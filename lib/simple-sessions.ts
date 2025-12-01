// lib/simple-sessions.ts
import { Redis } from "@upstash/redis";
import crypto from "crypto";

// Simple Redis client
const getRedis = () => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    throw new Error("Redis credentials missing");
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
};

// Session TTL - 1 hour (3600 seconds)
const SESSION_TTL = 3600;

export function generateSessionId(): string {
  return "sess" + crypto.randomBytes(16).toString("hex");
}

export async function createSession(data: {
  visitorName?: string;
  message: string;
  pageUrl?: string;
  email?: string;
}): Promise<string> {
  const redis = getRedis();
  const sessionId = generateSessionId();
  
  const session = {
    sessionId,
    visitorName: data.visitorName || "Website Visitor",
    email: data.email || "not-provided",
    pageUrl: data.pageUrl || "unknown",
    message: data.message,
    createdAt: Math.floor(Date.now() / 1000), // Current time in seconds
    accepted: false,
    acceptedBy: null,
    ownerMessages: [],
    userMessages: [{
      text: data.message,
      at: Math.floor(Date.now() / 1000),
      name: data.visitorName || "Visitor"
    }],
    lastActivityAt: Math.floor(Date.now() / 1000),
  };

  await redis.setex(`livechat:session:${sessionId}`, SESSION_TTL, JSON.stringify(session));
  console.log(`✅ Session created: ${sessionId}`);
  
  return sessionId;
}

export async function getSession(sessionId: string): Promise<any> {
  try {
    const redis = getRedis();
    const data = await redis.get(`livechat:session:${sessionId}`);
    
    if (!data) {
      console.log(`❌ Session not found: ${sessionId}`);
      return null;
    }

    const session = JSON.parse(data as string);
    
    // Always return the session regardless of timestamp
    // Let the client handle expiration logic
    console.log(`✅ Session retrieved: ${sessionId}`);
    return session;
  } catch (error) {
    console.error(`❌ Error getting session ${sessionId}:`, error);
    return null;
  }
}

export async function updateSession(sessionId: string, updates: any): Promise<boolean> {
  try {
    const redis = getRedis();
    const existing = await getSession(sessionId);
    
    if (!existing) {
      return false;
    }

    const updated = {
      ...existing,
      ...updates,
      lastActivityAt: Math.floor(Date.now() / 1000)
    };

    await redis.setex(`livechat:session:${sessionId}`, SESSION_TTL, JSON.stringify(updated));
    console.log(`✅ Session updated: ${sessionId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error updating session ${sessionId}:`, error);
    return false;
  }
}
