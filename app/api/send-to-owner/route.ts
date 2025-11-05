// app/api/send-to-owner/route.ts
import { NextResponse } from "next/server";
import { TelegramNotifier, sessions } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { sessionId, text, name } = body || {};

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "sessionId is required" }, { status: 400 });
    }
    if (!text || !String(text).trim()) {
      return NextResponse.json({ success: false, error: "text is required" }, { status: 400 });
    }

    const sess = sessions.get(String(sessionId));
    if (!sess) {
      return NextResponse.json({ success: false, error: "session not found" }, { status: 404 });
    }

    if (!sess.accepted || !sess.acceptedBy?.telegramChatId) {
      return NextResponse.json({ success: false, error: "session not accepted or owner not available" }, { status: 400 });
    }

    const ownerChatId = String(sess.acceptedBy.telegramChatId);
    const visitorName = name || sess.visitorName || "Website Visitor";

    // Format message we send to the owner's Telegram
    const ownerMessage = `💬 Message from ${visitorName} (session: ${sessionId}):\n\n${String(text)}`;

    const notifier = new TelegramNotifier(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_ADMIN_CHAT_ID);

    try {
      // send message to owner
      const res = await notifier.sendMessage(ownerChatId, ownerMessage);
      console.log(`[send-to-owner] forwarded visitor message to owner ${ownerChatId} for session ${sessionId}`, res?.result?.message_id ?? "");
    } catch (err) {
      console.error("[send-to-owner] failed to send message to owner:", err);
      return NextResponse.json({ success: false, error: "failed to send message to owner" }, { status: 500 });
    }

    // append visitor message to session.userMessages and update session
    try {
      sess.userMessages = sess.userMessages || [];
      const now = Date.now();
      sess.userMessages.push({ text: String(text), at: now, name: visitorName });
      sess.lastActivityAt = now;
      sessions.set(String(sessionId), sess);

      // Broadcast updated session to SSE listeners (if available)
      try {
        if (typeof (globalThis as any).__broadcastSessionUpdate__ === "function") {
          (globalThis as any).__broadcastSessionUpdate__(String(sessionId), sess);
          console.log("[send-to-owner] broadcasted updated session via globalThis.__broadcastSessionUpdate__", sessionId);
        } else {
          // Try dynamic import fallback if needed (defensive)
          try {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const mod = await import("@/app/api/session-events/route");
            if (mod?.broadcastSessionUpdate) {
              mod.broadcastSessionUpdate(String(sessionId), sess);
              console.log("[send-to-owner] broadcasted updated session via dynamic import", sessionId);
            }
          } catch (e) {
            console.debug("[send-to-owner] broadcast not available (no SSE subscribers or HMR order)", e);
          }
        }
      } catch (e) {
        console.warn("[send-to-owner] broadcast attempt failed", e);
      }
    } catch (e) {
      console.error("[send-to-owner] error updating session store:", e);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-to-owner] unexpected error", err);
    return NextResponse.json({ success: false, error: "internal error" }, { status: 500 });
  }
}
