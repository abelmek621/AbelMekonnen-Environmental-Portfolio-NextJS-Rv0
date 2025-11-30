import crypto from "crypto";
import { Redis } from "@upstash/redis";

/**
 * Shared global maps so sessions survive hot reload in dev.
 */
declare global {
  var __LIVECHAT_SESSIONS__: Map<string, any> | undefined;
  var __LIVECHAT_MSGMAP__: Map<string, string> | undefined;
  var __broadcastSessionUpdate__: ((sessionId: string, payload: any) => void) | undefined;
}

if (!globalThis.__LIVECHAT_SESSIONS__) globalThis.__LIVECHAT_SESSIONS__ = new Map<string, any>();
if (!globalThis.__LIVECHAT_MSGMAP__) globalThis.__LIVECHAT_MSGMAP__ = new Map<string, string>();

/** in-memory session store (primary for dev) */
export const sessions: Map<string, any> = globalThis.__LIVECHAT_SESSIONS__!;
export const msgIdToSessionMap: Map<string, string> = globalThis.__LIVECHAT_MSGMAP__!;

/** Upstash Redis client */
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;
if (UPSTASH_URL && UPSTASH_TOKEN) {
  try {
    redis = new Redis({ 
      url: UPSTASH_URL, 
      token: UPSTASH_TOKEN,
      // Add retry mechanism
      retry: {
        retries: 3,
        backoff: (retryCount) => Math.min(1000 * 2 ** retryCount, 30000),
      }
    });
    console.log("[lib/telegram] Redis client initialized successfully");
  } catch (e) {
    console.error("[lib/telegram] Failed to init Redis client:", e);
    redis = null;
  }
} else {
  console.warn("[lib/telegram] Redis credentials not found, using in-memory storage only");
}

export function generateSessionId(prefix = "s") {
  return prefix + crypto.randomBytes(8).toString("hex");
}

function escapeHtml(s?: string) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Basic heuristic for escalation */
export function shouldEscalateToHuman(message: string): boolean {
  if (!message) return false;
  const text = message.toLowerCase();
  const triggers = [
    "talk to someone",
    "talk to the owner",
    "talk to owner",
    "can i talk",
    "human",
    "live chat",
    "talk to",
    "connect me",
    "i want to talk",
    "need to talk",
    "real person",
    "speak to",
  ];
  return triggers.some((t) => text.includes(t));
}

/**
 * Persist session to Upstash Redis and in-memory map
 */
export async function saveSession(session: any): Promise<boolean> {
  try {
    const sessionId = session.sessionId;
    
    // Validate session
    if (!sessionId) {
      console.error("[saveSession] Missing sessionId");
      return false;
    }

    // Update timestamp
    session.lastActivityAt = Date.now();
    
    // Save to memory
    sessions.set(sessionId, session);
    
    // Save to Redis with expiration (24 hours)
    if (redis) {
      try {
        await redis.setex(
          `livechat:session:${sessionId}`, 
          24 * 60 * 60, // 24 hours in seconds
          JSON.stringify(session)
        );
        console.log(`[saveSession] Session ${sessionId} saved to Redis`);
      } catch (redisErr) {
        console.error("[saveSession] Redis save failed:", redisErr);
        // Don't fail completely if Redis is down
      }
    }

    // Broadcast update
    try {
      if (typeof globalThis.__broadcastSessionUpdate__ === "function") {
        globalThis.__broadcastSessionUpdate__(sessionId, { 
          type: "session_updated", 
          session 
        });
      }
    } catch (e) {
      console.warn("[saveSession] Broadcast failed:", e);
    }
    
    return true;
  } catch (err) {
    console.error("[saveSession] Error:", err);
    return false;
  }
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    sessions.delete(sessionId);
    
    if (redis) {
      try {
        await redis.del(`livechat:session:${sessionId}`);
      } catch (err) {
        console.warn("[deleteSession] Redis delete failed:", err);
      }
    }
    
    // Clean up message mappings
    for (const [msgId, sessId] of msgIdToSessionMap.entries()) {
      if (sessId === sessionId) {
        msgIdToSessionMap.delete(msgId);
      }
    }
    
    // Broadcast deletion
    try {
      if (typeof globalThis.__broadcastSessionUpdate__ === "function") {
        globalThis.__broadcastSessionUpdate__(sessionId, { 
          type: "session_deleted", 
          sessionId 
        });
      }
    } catch (e) {}
    
    return true;
  } catch (err) {
    console.error("[deleteSession] Error:", err);
    return false;
  }
}

export async function getSession(sessionId: string): Promise<any> {
  try {
    // Try in-memory first
    let session = sessions.get(sessionId);
    
    if (session) {
      // Check if session expired (24 hours)
      const now = Date.now();
      const sessionAge = now - (session.createdAt || now);
      if (sessionAge > 24 * 60 * 60 * 1000) {
        await deleteSession(sessionId);
        return null;
      }
      return session;
    }
    
    // Try Redis fallback
    if (redis) {
      try {
        const sessionData = await redis.get(`livechat:session:${sessionId}`);
        if (sessionData) {
          session = JSON.parse(sessionData as string);
          
          // Check expiration
          const now = Date.now();
          const sessionAge = now - (session.createdAt || now);
          if (sessionAge > 24 * 60 * 60 * 1000) {
            await deleteSession(sessionId);
            return null;
          }
          
          // Cache in memory
          sessions.set(sessionId, session);
          return session;
        }
      } catch (redisErr) {
        console.error("[getSession] Redis get failed:", redisErr);
      }
    }
    
    return null;
  } catch (err) {
    console.error("[getSession] Error:", err);
    return null;
  }
}

/** Telegram notifier */
export class TelegramNotifier {
  botToken: string;
  defaultChatId: string;

  constructor(botToken?: string, defaultChatId?: string) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN || "";
    this.defaultChatId = defaultChatId || process.env.TELEGRAM_ADMIN_CHAT_ID || "";
    
    if (!this.botToken) {
      console.error("[TelegramNotifier] TELEGRAM_BOT_TOKEN not set");
    }
    if (!this.defaultChatId) {
      console.error("[TelegramNotifier] TELEGRAM_ADMIN_CHAT_ID not set");
    }
  }

  async sendMessage(chatId: string, text: string, options?: { 
    parse_mode?: string; 
    reply_markup?: any;
    reply_to_message_id?: number;
  }) {
    if (!this.botToken) {
      throw new Error("Telegram bot token not configured");
    }

    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const body: any = { 
      chat_id: chatId, 
      text,
      disable_web_page_preview: true
    };
    
    if (options?.parse_mode) body.parse_mode = options.parse_mode;
    if (options?.reply_markup) body.reply_markup = options.reply_markup;
    if (options?.reply_to_message_id) body.reply_to_message_id = options.reply_to_message_id;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      
      const responseText = await res.text();
      const json = JSON.parse(responseText);
      
      if (!res.ok || !json?.ok) {
        throw new Error(json?.description || `HTTP ${res.status}: ${responseText}`);
      }
      
      return json;
    } catch (err) {
      console.error("[TelegramNotifier] sendMessage failed:", err);
      throw err;
    }
  }

  async sendLiveChatRequest(opts: {
    visitorName?: string;
    message: string;
    pageUrl?: string;
    email?: string;
    sessionId?: string;
    adminChatId?: string;
  }) {
    const adminChatId = opts.adminChatId || this.defaultChatId;
    if (!adminChatId) {
      return { success: false, error: "No admin chat id configured" };
    }

    const sessionId = opts.sessionId || generateSessionId();
    const now = Date.now();
    
    const session = {
      sessionId,
      visitorName: opts.visitorName || "Website Visitor",
      email: opts.email || "not-provided",
      pageUrl: opts.pageUrl || "unknown",
      message: opts.message,
      createdAt: now,
      accepted: false,
      acceptedBy: null,
      ownerMessages: [],
      userMessages: [],
      lastActivityAt: now,
    };

    // Save session first
    const saved = await saveSession(session);
    if (!saved) {
      return { success: false, error: "Failed to save session" };
    }

    // Build notification message
    const text = [
      "📩 <b>Live Chat Request</b>",
      "",
      `👤 <b>From:</b> ${escapeHtml(session.visitorName)}`,
      `📧 <b>Email:</b> ${escapeHtml(session.email)}`,
      `🌐 <b>Page:</b> ${escapeHtml(session.pageUrl)}`,
      "",
      "💬 <b>Message:</b>",
      escapeHtml(session.message),
      "",
      `🆔 <b>Session ID:</b> <code>${sessionId}</code>`,
    ].join("\n");

    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ Join Chat", callback_data: `join:${sessionId}` }, 
          { text: "❌ Away", callback_data: `away:${sessionId}` }
        ],
      ],
    };

    try {
      const result = await this.sendMessage(adminChatId, text, { 
        parse_mode: "HTML", 
        reply_markup: keyboard 
      });
      
      const messageId = result?.result?.message_id;
      if (messageId) {
        // Store mapping in both memory and Redis
        msgIdToSessionMap.set(String(messageId), sessionId);
        
        if (redis) {
          try {
            await redis.setex(
              `livechat:msg2sess:${messageId}`, 
              24 * 60 * 60,
              sessionId
            );
          } catch (e) {
            console.warn("[sendLiveChatRequest] Failed to save msg mapping to Redis:", e);
          }
        }
      }
      
      console.log(`[TelegramNotifier] Live chat request sent for session ${sessionId}`);
      return { success: true, sessionId, messageId };
    } catch (err: any) {
      // Clean up session if notification failed
      await deleteSession(sessionId);
      console.error("[TelegramNotifier] sendLiveChatRequest error:", err?.message || err);
      return { success: false, error: err?.message || String(err) };
    }
  }

  async answerCallbackQuery(callbackQueryId: string, text: string, showAlert = false) {
    if (!this.botToken) return;

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          callback_query_id: callbackQueryId, 
          text, 
          show_alert: false,
        }),
      });
    } catch (err) {
      console.warn("[TelegramNotifier] answerCallbackQuery failed:", err);
    }
  }

  async handleCallbackQuery(callback: {
  id: string;
  from: { id: number; first_name?: string; last_name?: string; username?: string };
  data: string;
  message?: { chat: { id: number }; message_id?: number };
}) {
  try {
    console.log("🔄 [TelegramNotifier] Handling callback:", callback.data);
    
    const [action, sessionId] = String(callback.data || "").split(":");
    if (!sessionId) {
      await this.answerCallbackQuery(callback.id, "❌ Invalid session data", true);
      return { handled: false };
    }

    console.log(`🔍 [TelegramNotifier] Looking for session: ${sessionId}`);
    
    // Get session with proper error handling - IMPORTANT: Use await
    const session = await getSession(sessionId);
    
    if (!session) {
      console.error(`❌ [TelegramNotifier] Session ${sessionId} not found in storage`);
      
      // Debug: List all current sessions
      console.log("📋 Current sessions in memory:", Array.from(sessions.keys()));
      
      await this.answerCallbackQuery(
        callback.id, 
        "❌ Session not found or expired. Please ask the visitor to start a new chat request.", 
        true
      );
      return { handled: true };
    }

    console.log(`✅ [TelegramNotifier] Found session:`, session);

    if (action === "join") {
      // Update session with owner info
      session.accepted = true;
      session.acceptedBy = {
        telegramChatId: String(callback.from.id),
        responderName: `${callback.from.first_name || ""} ${callback.from.last_name || ""}`.trim() || callback.from.username || "Admin",
        acceptedAt: Date.now(),
      };
      session.lastActivityAt = Date.now();

      const saved = await saveSession(session);
      if (!saved) {
        console.error(`❌ [TelegramNotifier] Failed to save session ${sessionId}`);
        await this.answerCallbackQuery(callback.id, "❌ Failed to join chat. Please try again.", true);
        return { handled: true };
      }

      console.log(`✅ [TelegramNotifier] Session ${sessionId} accepted by ${session.acceptedBy.responderName}`);
      
      await this.answerCallbackQuery(
        callback.id, 
        "✅ You joined the chat! Reply to this chat to talk to the visitor.", 
        false
      );

      // Send welcome message to owner
      try {
        const welcomeText = 
          `✅ You are now chatting with ${session.visitorName}.\n\n` +
          `💬 <b>Their original message:</b>\n` +
          `${session.message}\n\n` +
          `🌐 <b>Page:</b> ${session.pageUrl}\n` +
          `📧 <b>Email:</b> ${session.email}\n\n` +
          `🆔 <b>Session:</b> <code>${sessionId}</code>\n\n` +
          `Just type your messages here and they will be sent to the visitor in real-time!`;
        
        const followUp = await this.sendMessage(
          String(callback.from.id), 
          welcomeText,
          { 
            parse_mode: "HTML",
            reply_markup: { force_reply: true } 
          }
        );
        
        const messageId = followUp?.result?.message_id;
        if (messageId) {
          // Store this mapping so replies to this message go to the right session
          msgIdToSessionMap.set(String(messageId), sessionId);
          if (redis) {
            try {
              await redis.setex(`livechat:msg2sess:${messageId}`, 24 * 60 * 60, sessionId);
            } catch (e) {
              console.warn("Failed to save message mapping to Redis:", e);
            }
          }
        }
      } catch (e) {
        console.error("❌ [TelegramNotifier] Failed to send follow-up message:", e);
      }

      // Broadcast session acceptance to website
      try {
        if (typeof globalThis.__broadcastSessionUpdate__ === "function") {
          globalThis.__broadcastSessionUpdate__(sessionId, { 
            type: "accepted", 
            session,
            _meta: { event: "accepted" } 
          });
          console.log(`✅ [TelegramNotifier] Broadcasted session acceptance for ${sessionId}`);
        } else {
          console.warn("❌ [TelegramNotifier] Broadcast function not available");
        }
      } catch (e) {
        console.error("❌ [TelegramNotifier] Broadcast failed:", e);
      }
      
      return { handled: true, session };
    }

    if (action === "away") {
      session.accepted = false;
      session.lastActivityAt = Date.now();
      await saveSession(session);
      
      await this.answerCallbackQuery(callback.id, "❌ Marked as away. The visitor will be notified.", false);
      return { handled: true };
    }

    await this.answerCallbackQuery(callback.id, "❌ Unknown action", true);
    return { handled: false };
  } catch (err) {
    console.error("❌ [TelegramNotifier] handleCallbackQuery error:", err);
    await this.answerCallbackQuery(callback.id, "❌ An error occurred. Please try again.", true);
    return { handled: false, error: err };
  }
}

  async appendOwnerMessageToSession(ownerTelegramChatId: string, text: string, replyToMessageId?: number | null) {
    try {
      const ownerIdStr = String(ownerTelegramChatId);
      const now = Date.now();
      
      // First, try to find session by reply_to_message_id
      if (replyToMessageId) {
        let sessionId: string | undefined;
        
        // Check memory
        sessionId = msgIdToSessionMap.get(String(replyToMessageId));
        
        // Check Redis if not found
        if (!sessionId && redis) {
          try {
            sessionId = await redis.get(`livechat:msg2sess:${replyToMessageId}`) as string;
            if (sessionId) {
              msgIdToSessionMap.set(String(replyToMessageId), sessionId);
            }
          } catch (e) {
            console.warn("[appendOwnerMessageToSession] Redis get failed:", e);
          }
        }
        
        if (sessionId) {
          const session = await getSession(sessionId);
          if (session && session.acceptedBy?.telegramChatId === ownerIdStr) {
            session.ownerMessages = session.ownerMessages || [];
            session.ownerMessages.push({ text, at: now });
            session.lastActivityAt = now;
            
            await saveSession(session);
            console.log(`[TelegramNotifier] Appended owner message to session ${sessionId} via reply mapping`);
            return session;
          }
        }
      }
      
      // Fallback: find most recent session accepted by this owner
      const RECENT_MS = 30 * 60 * 1000; // 30 minutes
      const acceptedSessions: any[] = [];
      
      // Check in-memory sessions
      for (const session of sessions.values()) {
        if (session.acceptedBy?.telegramChatId === ownerIdStr && session.accepted) {
          acceptedSessions.push(session);
        }
      }
      
      // If no recent sessions in memory, try to find in Redis
      if (acceptedSessions.length === 0 && redis) {
        try {
          // This is simplified - you might want to maintain a separate index of owner sessions
          // For now, we'll rely on in-memory being populated from recent activity
          console.warn("[appendOwnerMessageToSession] No recent sessions found for owner", ownerIdStr);
        } catch (e) {
          console.warn("[appendOwnerMessageToSession] Redis scan failed:", e);
        }
      }
      
      if (acceptedSessions.length === 0) {
        console.warn("[TelegramNotifier] No accepted sessions found for owner", ownerIdStr);
        return null;
      }
      
      // Find the most recently active session
      acceptedSessions.sort((a, b) => (b.lastActivityAt || 0) - (a.lastActivityAt || 0));
      const targetSession = acceptedSessions[0];
      
      // Check if session is still recent
      if (now - (targetSession.lastActivityAt || 0) > RECENT_MS) {
        console.warn("[TelegramNotifier] Most recent session is too old:", targetSession.sessionId);
        return null;
      }
      
      targetSession.ownerMessages = targetSession.ownerMessages || [];
      targetSession.ownerMessages.push({ text, at: now });
      targetSession.lastActivityAt = now;
      
      await saveSession(targetSession);
      console.log(`[TelegramNotifier] Appended owner message to session ${targetSession.sessionId}`);
      return targetSession;
    } catch (err) {
      console.error("[TelegramNotifier] appendOwnerMessageToSession error:", err);
      return null;
    }
  }

  getSession(sessionId: string) {
    return sessions.get(sessionId) || null;
  }
}
