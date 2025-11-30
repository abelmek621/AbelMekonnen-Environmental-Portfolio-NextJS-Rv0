import { NextResponse } from "next/server";
import { sessions, deleteSession } from "@/lib/telegram";

export async function GET() {
  try {
    const sessionArray = Array.from(sessions.values()).map(session => ({
      sessionId: session.sessionId,
      visitorName: session.visitorName,
      accepted: session.accepted,
      createdAt: session.createdAt,
      lastActivityAt: session.lastActivityAt,
      acceptedBy: session.acceptedBy,
      userMessages: session.userMessages?.length || 0,
      ownerMessages: session.ownerMessages?.length || 0,
    }));

    return NextResponse.json({
      sessions: sessionArray,
      total: sessionArray.length
    });
  } catch (error) {
    console.error("Debug sessions error:", error);
    return NextResponse.json({ error: "Failed to get sessions" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    await deleteSession(sessionId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
