// app/api/test/route.ts
import { NextResponse } from "next/server";
import { createSession, getSession } from "@/lib/simple-sessions";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  
  if (action === "create") {
    const sessionId = await createSession({
      visitorName: "Test User",
      message: "Test message",
      pageUrl: "https://example.com"
    });
    
    return NextResponse.json({ sessionId });
  }
  
  if (action === "get") {
    const sessionId = url.searchParams.get("sessionId");
    if (!sessionId) return NextResponse.json({ error: "No sessionId" });
    
    const session = await getSession(sessionId);
    return NextResponse.json({ session });
  }
  
  return NextResponse.json({ message: "Use ?action=create or ?action=get&sessionId=XXX" });
}
