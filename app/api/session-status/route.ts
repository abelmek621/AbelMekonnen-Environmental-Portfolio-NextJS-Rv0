// app/api/session-status/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/telegram";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    const sess = await getSession(sessionId);
    if (!sess) return NextResponse.json({ status: "not_found" }, { status: 404 });
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
        accepted: sess.accepted || false,
      },
    });
  } catch (err) {
    console.error("session-status error", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
