// app/api/session-events/route.ts
import { NextResponse } from "next/server";
import { sessions } from "@/lib/telegram";

declare global {
  var __LIVECHAT_SSE_SUBSCRIBERS__: Record<string, Array<ReadableStreamDefaultController<any>>> | undefined;
  var __broadcastSessionUpdate__: ((sessionId: string, payload: any) => void) | undefined;
}

if (!globalThis.__LIVECHAT_SSE_SUBSCRIBERS__) globalThis.__LIVECHAT_SSE_SUBSCRIBERS__ = {};
const subscribers = globalThis.__LIVECHAT_SSE_SUBSCRIBERS__ as Record<string, Array<ReadableStreamDefaultController<any>>>;

function sendEvent(ctrl: ReadableStreamDefaultController<any>, data: any) {
  try {
    ctrl.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
  } catch (e) {
    // controller may be closed; ignore
  }
}

// register global broadcast function once (survives HMR)
if (!globalThis.__broadcastSessionUpdate__) {
  globalThis.__broadcastSessionUpdate__ = (sessionId: string, payload: any) => {
    const list = subscribers[sessionId] || [];
    for (const ctrl of list.slice()) {
      try {
        sendEvent(ctrl, { type: "session_update", session: payload });
      } catch (e) {
        // ignore
      }
    }
  };
}

/**
 * SSE endpoint: GET /api/session-events?sessionId=...
 * Sends an initial 'init' event (session or null) and then keeps the stream open.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const stream = new ReadableStream({
      start(controller) {
        // add controller to subscribers for this session
        if (!subscribers[sessionId]) subscribers[sessionId] = [];
        subscribers[sessionId].push(controller);

        // send initial state immediately
        try {
          const sess = sessions && typeof sessions.get === "function" ? sessions.get(sessionId) : null;
          sendEvent(controller, { type: "init", session: sess || null });
        } catch (err) {
          sendEvent(controller, { type: "init", session: null });
        }
      },
      cancel(_reason) {
        // remove controller on disconnect
        if (!subscribers[sessionId]) return;
        subscribers[sessionId] = subscribers[sessionId].filter((c) => c !== this);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[session-events] error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

/**
 * Exported helper broadcast function (calls the global one).
 * Other modules can import this if they prefer (but prefer globalThis.__broadcastSessionUpdate__).
 */
export function broadcastSessionUpdate(sessionId: string, payload: any) {
  try {
    if (typeof globalThis.__broadcastSessionUpdate__ === "function") {
      globalThis.__broadcastSessionUpdate__(sessionId, payload);
    } else {
      // fallback: send directly to any subscribers in this module
      const list = subscribers[sessionId] || [];
      for (const ctrl of list.slice()) {
        try {
          sendEvent(ctrl, { type: "session_update", session: payload });
        } catch (e) {
          // ignore
        }
      }
    }
  } catch (e) {
    console.warn("[session-events] broadcastSessionUpdate failed", e);
  }
}
