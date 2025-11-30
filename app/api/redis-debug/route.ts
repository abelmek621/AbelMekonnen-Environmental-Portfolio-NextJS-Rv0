import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.error("Redis init error:", error);
}

export async function GET() {
  try {
    if (!redis) {
      return NextResponse.json({ error: "Redis not configured" }, { status: 500 });
    }

    // Get all session keys
    const sessionKeys = await redis.keys("livechat:session:*");
    const sessions = [];

    for (const key of sessionKeys) {
      const sessionData = await redis.get(key);
      if (sessionData) {
        const session = JSON.parse(sessionData as string);
        sessions.push({
          key,
          sessionId: session.sessionId,
          visitorName: session.visitorName,
          accepted: session.accepted,
          createdAt: new Date(session.createdAt).toISOString(),
          lastActivityAt: new Date(session.lastActivityAt).toISOString(),
          acceptedBy: session.acceptedBy,
        });
      }
    }

    // Get message mappings
    const msgKeys = await redis.keys("livechat:msg2sess:*");
    const messageMappings = [];
    
    for (const key of msgKeys.slice(0, 10)) { // Limit to first 10
      const sessionId = await redis.get(key);
      messageMappings.push({
        messageKey: key,
        sessionId
      });
    }

    return NextResponse.json({
      redisStatus: "connected",
      totalSessions: sessions.length,
      sessions,
      messageMappings,
    });
  } catch (error) {
    console.error("Redis debug error:", error);
    return NextResponse.json({ error: "Failed to debug Redis" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    if (!redis) {
      return NextResponse.json({ error: "Redis not configured" }, { status: 500 });
    }

    await redis.del(`livechat:session:${sessionId}`);
    
    return NextResponse.json({ success: true, message: `Session ${sessionId} deleted` });
  } catch (error) {
    console.error("Redis delete error:", error);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }
}
