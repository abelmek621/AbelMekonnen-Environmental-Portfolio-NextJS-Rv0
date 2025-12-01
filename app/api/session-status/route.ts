// app/api/session-status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/simple-sessions";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    console.log(`🔍 Checking session: ${sessionId}`);
    
    const session = await getSession(sessionId);
    
    if (!session) {
      console.log(`❌ Session not found: ${sessionId}`);
      return NextResponse.json({ 
        status: "not_found",
        message: "Session not found"
      }, { status: 404 });
    }

    // ALWAYS return the session, regardless of timestamp issues
    console.log(`✅ Session found: ${sessionId}, accepted: ${session.accepted}`);
    
    return NextResponse.json({
      status: session.accepted ? "accepted" : "pending",
      session: session
    });
    
  } catch (error) {
    console.error("❌ Session status error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
