import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Initialize Redis client safely
const getRedisClient = () => {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      return new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    }
    return null;
  } catch (error) {
    console.error("Redis initialization error:", error);
    return null;
  }
};

export async function GET() {
  try {
    const redis = getRedisClient();
    if (!redis) {
      return NextResponse.json({ 
        error: "Redis not configured",
        env: {
          hasUrl: !!process.env.UPSTASH_REDIS_REST_URL,
          hasToken: !!process.env.UPSTASH_REDIS_REST_TOKEN
        }
      }, { status: 500 });
    }

    // Get all session keys
    const sessionKeys = await redis.keys("livechat:session:*");
    const sessions = [];

    for (const key of sessionKeys) {
      try {
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
      } catch (e) {
        console.error(`Error parsing session from key ${key}:`, e);
      }
    }

    // Get message mappings
    const msgKeys = await redis.keys("livechat:msg2sess:*");
    const messageMappings = [];
    
    for (const key of msgKeys.slice(0, 10)) {
      try {
        const sessionId = await redis.get(key);
        messageMappings.push({
          messageKey: key,
          sessionId
        });
      } catch (e) {
        console.error(`Error getting message mapping from key ${key}:`, e);
      }
    }

    return NextResponse.json({
      redisStatus: "connected",
      totalSessions: sessions.length,
      sessions,
      messageMappings,
    });
  } catch (error) {
    console.error("Redis debug error:", error);
    return NextResponse.json({ 
      error: "Failed to debug Redis",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const redis = getRedisClient();
    if (!redis) {
      return NextResponse.json({ error: "Redis not configured" }, { status: 500 });
    }

    await redis.del(`livechat:session:${sessionId}`);
    
    return NextResponse.json({ success: true, message: `Session ${sessionId} deleted` });
  } catch (error) {
    console.error("Redis delete error:", error);
    return NextResponse.json({ 
      error: "Failed to delete session",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
