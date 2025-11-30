// app/api/debug-session/route.ts
import { NextResponse } from "next/server";
import { getSession, saveSession, generateSessionId } from "@/lib/telegram";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const action = url.searchParams.get("action");

  if (action === "test") {
    // Test session creation and retrieval
    const testSessionId = generateSessionId("test");
    const testSession = {
      sessionId: testSessionId,
      visitorName: "Test User",
      email: "test@example.com",
      pageUrl: "https://example.com/test",
      message: "Test message",
      createdAt: Date.now(),
      accepted: false,
      acceptedBy: null,
      ownerMessages: [],
      userMessages: [],
      lastActivityAt: Date.now(),
    };

    console.log(`🧪 Creating test session: ${testSessionId}`);
    const saved = await saveSession(testSession);
    
    if (saved) {
      const retrieved = await getSession(testSessionId);
      return NextResponse.json({
        test: "session_storage",
        created: true,
        retrieved: !!retrieved,
        sessionId: testSessionId,
        session: retrieved
      });
    } else {
      return NextResponse.json({
        test: "session_storage",
        created: false,
        retrieved: false,
        error: "Failed to save session"
      });
    }
  }

  if (sessionId) {
    const session = await getSession(sessionId);
    return NextResponse.json({
      sessionId,
      found: !!session,
      session: session
    });
  }

  return NextResponse.json({ error: "Provide sessionId or action=test" });
}
