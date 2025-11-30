// lib/session-manager.ts
import { Redis } from "@upstash/redis";

// Singleton Redis client
let redis: Redis | null = null;

export function getRedisClient(): Redis | null {
  if (redis) return redis;
  
  try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      console.log("✅ Redis client initialized");
      return redis;
    } else {
      console.warn("❌ Redis environment variables missing");
      return null;
    }
  } catch (error) {
    console.error("❌ Failed to initialize Redis:", error);
    return null;
  }
}

// Session operations
const SESSION_TTL = 24 * 60 * 60; // 24 hours

export async function saveSessionToRedis(session: any): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    console.error("❌ No Redis client available");
    return false;
  }

  try {
    const key = `livechat:session:${session.sessionId}`;
    await client.setex(key, SESSION_TTL, JSON.stringify(session));
    console.log(`✅ Session saved to Redis: ${session.sessionId}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to save session to Redis:", error);
    return false;
  }
}

export async function getSessionFromRedis(sessionId: string): Promise<any> {
  const client = getRedisClient();
  if (!client) {
    console.error("❌ No Redis client available");
    return null;
  }

  try {
    const key = `livechat:session:${sessionId}`;
    const data = await client.get(key);
    
    if (data) {
      const session = JSON.parse(data as string);
      console.log(`✅ Session retrieved from Redis: ${sessionId}`);
      return session;
    } else {
      console.log(`❌ Session not found in Redis: ${sessionId}`);
      return null;
    }
  } catch (error) {
    console.error("❌ Failed to get session from Redis:", error);
    return null;
  }
}

export async function deleteSessionFromRedis(sessionId: string): Promise<boolean> {
  const client = getRedisClient();
  if (!client) {
    console.error("❌ No Redis client available");
    return false;
  }

  try {
    const key = `livechat:session:${sessionId}`;
    await client.del(key);
    console.log(`✅ Session deleted from Redis: ${sessionId}`);
    return true;
  } catch (error) {
    console.error("❌ Failed to delete session from Redis:", error);
    return false;
  }
}
