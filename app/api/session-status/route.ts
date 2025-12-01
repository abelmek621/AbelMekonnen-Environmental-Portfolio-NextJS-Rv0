import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/telegram";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    console.log(`🔍 [session-status] Looking for session: ${sessionId}`);
    
    const session = await getSession(sessionId);
    
    if (!session) {
      console.log(`❌ [session-status] Session ${sessionId} not found`);
      return NextResponse.json({ 
        status: "not_found",
        message: "Session not found"
      }, { status: 404 });
    }

    // Debug timestamp info
    const now = Date.now();
    const sessionAge = now - session.createdAt;
    const isFuture = sessionAge < 0;
    
    console.log(`✅ [session-status] Session found:`, {
      sessionId: session.sessionId,
      accepted: session.accepted,
      visitorName: session.visitorName,
      createdAt: new Date(session.createdAt).toISOString(),
      now: new Date(now).toISOString(),
      age: sessionAge,
      isFuture: isFuture
    });

    // If session has future timestamp, still return it but with a warning
    if (isFuture) {
      console.warn(`⚠️ [session-status] Session ${sessionId} has future timestamp but returning anyway`);
      // Don't return 404 - let the client handle it
    }

    return NextResponse.json({
      status: session.accepted ? "accepted" : "pending",
      session: {
        sessionId: session.sessionId,
        visitorName: session.visitorName,
        email: session.email,
        pageUrl: session.pageUrl,
        createdAt: session.createdAt,
        ownerMessages: session.ownerMessages || [],
        userMessages: session.userMessages || [],
        accepted: session.accepted || false,
        acceptedBy: session.acceptedBy,
        lastActivityAt: session.lastActivityAt,
      },
      _meta: {
        timestampValid: !isFuture,
        serverTime: now,
        sessionTime: session.createdAt
      }
    });
  } catch (error) {
    console.error("❌ [session-status] Error:", error);
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 });
  }
}