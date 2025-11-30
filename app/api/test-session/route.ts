import { NextResponse } from "next/server";
import { getSession, saveSession, generateSessionId } from "@/lib/telegram";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const sessionId = url.searchParams.get("sessionId");

    if (action === "create") {
      // Create a test session
      const testSessionId = generateSessionId("test");
      const testSession = {
        sessionId: testSessionId,
        visitorName: "Test User",
        email: "test@example.com",
        pageUrl: "https://example.com/test",
        message: "This is a test message",
        createdAt: Date.now(),
        accepted: false,
        acceptedBy: null,
        ownerMessages: [],
        userMessages: [],
        lastActivityAt: Date.now(),
      };

      const saved = await saveSession(testSession);
      
      return NextResponse.json({
        success: saved,
        sessionId: testSessionId,
        message: saved ? "Test session created" : "Failed to create test session"
      });
    }

    if (action === "get" && sessionId) {
      // Get a specific session
      const session = await getSession(sessionId);
      
      return NextResponse.json({
        found: !!session,
        session: session || null
      });
    }

    return NextResponse.json({
      error: "Invalid action. Use 'create' or 'get' with sessionId"
    }, { status: 400 });

  } catch (error) {
    console.error("❌ Test session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
