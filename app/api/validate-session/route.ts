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

    console.log(`🔍 [validate-session] Validating session: ${sessionId}`);
    
    const session = await getSession(sessionId);
    
    if (!session) {
      return NextResponse.json({ 
        valid: false,
        reason: "Session not found in Redis"
      });
    }

    // Check timestamp validity
    const now = Date.now();
    const createdAt = session.createdAt;
    const age = now - createdAt;
    const isFuture = age < 0;
    
    const validity = {
      sessionId: session.sessionId,
      valid: !isFuture && age < (24 * 60 * 60 * 1000), // 24 hours
      reason: isFuture ? "Future timestamp" : age > (24 * 60 * 60 * 1000) ? "Expired" : "Valid",
      details: {
        createdAt: new Date(createdAt).toISOString(),
        currentTime: new Date(now).toISOString(),
        age: age,
        ageReadable: `${Math.abs(age / 1000).toFixed(1)} seconds ${isFuture ? 'in future' : 'ago'}`,
        accepted: session.accepted,
        visitorName: session.visitorName
      }
    };

    return NextResponse.json(validity);
  } catch (error) {
    console.error("❌ [validate-session] Error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
