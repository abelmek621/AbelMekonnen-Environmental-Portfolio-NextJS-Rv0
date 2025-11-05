// app/api/session-status/route.ts
import { NextResponse } from "next/server";
import { sessions } from "@/lib/telegram";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });

    const sess = sessions.get(sessionId);
    if (!sess) {
      // return not_found but with JSON 200 to make client parsing uniform
      return NextResponse.json({ status: "not_found", session: null }, { status: 200 });
    }

    return NextResponse.json({
      status: sess.accepted ? "accepted" : "pending",
      session: {
        sessionId: sess.sessionId,
        visitorName: sess.visitorName,
        email: sess.email,
        pageUrl: sess.pageUrl,
        createdAt: sess.createdAt,
        ownerMessages: sess.ownerMessages || [],
        userMessages: sess.userMessages || [],
        acceptedBy: sess.acceptedBy || null,
        lastActivityAt: sess.lastActivityAt || null,
      },
    });
  } catch (err) {
    console.error("session-status error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
