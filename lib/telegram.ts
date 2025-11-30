import crypto from "crypto";
import { Redis } from "@upstash/redis";

// Declare global types at the top
declare global {
  var __LIVECHAT_SESSIONS__: Map<string, any> | undefined;
  var __LIVECHAT_MSGMAP__: Map<string, string> | undefined;
  var __broadcastSessionUpdate__: ((sessionId: string, payload: any) => void) | undefined;
}

// Initialize Redis client properly
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log("✅ Redis client initialized successfully");
  } else {
    console.warn("❌ Redis credentials not found");
  }
} catch (error) {
  console.error("❌ Failed to initialize Redis:", error);
  redis = null;
}

// Initialize global maps with proper type checking
const getGlobalSessions = (): Map<string, any> => {
  if (!global.__LIVECHAT_SESSIONS__) {
    global.__LIVECHAT_SESSIONS__ = new Map<string, any>();
  }
  return global.__LIVECHAT_SESSIONS__;
};

const getGlobalMsgMap = (): Map<string, string> => {
  if (!global.__LIVECHAT_MSGMAP__) {
    global.__LIVECHAT_MSGMAP__ = new Map<string, string>();
  }
  return global.__LIVECHAT_MSGMAP__;
};

// Use the global maps
const memorySessions = getGlobalSessions();
const memoryMsgMap = getGlobalMsgMap();

export function generateSessionId(prefix = "sess"): string {
  return prefix + crypto.randomBytes(10).toString("hex");
}

export function shouldEscalateToHuman(message: string): boolean {
  if (!message) return false;
  const text = message.toLowerCase();
  const triggers = [
    "talk to someone", "talk to the owner", "talk to owner", "can i talk",
    "human", "live chat", "talk to", "connect me", "i want to talk", "need to talk",
    "real person", "speak to", "contact the expert", "get in touch with abel"
  ];
  return triggers.some((t) => text.includes(t));
}

// Session TTL (24 hours)
const SESSION_TTL = 24 * 60 * 60;

export async function saveSession(session: any): Promise<boolean> {
  try {
    const sessionId = session.sessionId;
    if (!sessionId) {
      console.error("❌ [saveSession] Missing sessionId");
      return false;
    }

    // Update timestamp
    session.lastActivityAt = Date.now();
    
    // Save to memory cache
    memorySessions.set(sessionId, session);
    
    // Save to Redis (primary storage)
    if (redis) {
      try {
        await redis.setex(`livechat:session:${sessionId}`, SESSION_TTL, JSON.stringify(session));
        console.log(`✅ [saveSession] Session ${sessionId} saved to Redis`);
      } catch (redisError) {
        console.error("❌ [saveSession] Redis save failed:", redisError);
        // Don't return false here - we still have memory cache
      }
    } else {
      console.warn("⚠️ [saveSession] Redis not available, using memory only");
    }

    // Broadcast update with proper type checking
    try {
      const broadcastFn = global.__broadcastSessionUpdate__;
      if (typeof broadcastFn === "function") {
        broadcastFn(sessionId, { 
          type: "session_updated", 
          session 
        });
      }
    } catch (e) {
      console.warn("❌ [saveSession] Broadcast failed:", e);
    }
    
    return true;
  } catch (error) {
    console.error("❌ [saveSession] Error:", error);
    return false;
  }
}

export async function getSession(sessionId: string): Promise<any> {
  try {
    // Try memory cache first
    let session = memorySessions.get(sessionId);
    if (session) {
      // Check if expired
      if (Date.now() - (session.createdAt || 0) > SESSION_TTL * 1000) {
        await deleteSession(sessionId);
        return null;
      }
      return session;
    }

    // Try Redis
    if (redis) {
      try {
        const sessionData = await redis.get(`livechat:session:${sessionId}`);
        if (sessionData) {
          session = JSON.parse(sessionData as string);
          
          // Check expiration
          if (Date.now() - (session.createdAt || 0) > SESSION_TTL * 1000) {
            await deleteSession(sessionId);
            return null;
          }
          
          // Cache in memory
          memorySessions.set(sessionId, session);
          console.log(`✅ [getSession] Session ${sessionId} loaded from Redis`);
          return session;
        }
      } catch (redisError) {
        console.error("❌ [getSession] Redis get failed:", redisError);
      }
    }

    console.log(`❌ [getSession] Session ${sessionId} not found in any storage`);
    return null;
  } catch (error) {
    console.error("❌ [getSession] Error:", error);
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    // Remove from memory
    memorySessions.delete(sessionId);
    
    // Remove from Redis
    if (redis) {
      try {
        await redis.del(`livechat:session:${sessionId}`);
      } catch (error) {
        console.error("❌ [deleteSession] Redis delete failed:", error);
      }
    }
    
    // Clean up message mappings
    for (const [msgId, sessId] of memoryMsgMap.entries()) {
      if (sessId === sessionId) {
        memoryMsgMap.delete(msgId);
      }
    }
    
    // Broadcast deletion with proper type checking
    try {
      const broadcastFn = global.__broadcastSessionUpdate__;
      if (typeof broadcastFn === "function") {
        broadcastFn(sessionId, { 
          type: "session_deleted", 
          sessionId 
        });
      }
    } catch (e) {
      console.warn("❌ [deleteSession] Broadcast failed:", e);
    }
    
    return true;
  } catch (error) {
    console.error("❌ [deleteSession] Error:", error);
    return false;
  }
}

// Telegram Notifier Class
export class TelegramNotifier {
  botToken: string;
  defaultChatId: string;

  constructor(botToken?: string, defaultChatId?: string) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN || "";
    this.defaultChatId = defaultChatId || process.env.TELEGRAM_ADMIN_CHAT_ID || "";
    
    if (!this.botToken) {
      throw new Error("❌ TELEGRAM_BOT_TOKEN not configured");
    }
    if (!this.defaultChatId) {
      throw new Error("❌ TELEGRAM_ADMIN_CHAT_ID not configured");
    }
  }

  async sendMessage(chatId: string, text: string, options?: { 
    parse_mode?: string; 
    reply_markup?: any;
    reply_to_message_id?: number;
  }) {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const body: any = { 
      chat_id: chatId, 
      text,
      disable_web_page_preview: true
    };
    
    if (options?.parse_mode) body.parse_mode = options.parse_mode;
    if (options?.reply_markup) body.reply_markup = options.reply_markup;
    if (options?.reply_to_message_id) body.reply_to_message_id = options.reply_to_message_id;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    const responseText = await response.text();
    
    try {
      const json = JSON.parse(responseText);
      if (!response.ok || !json?.ok) {
        throw new Error(json?.description || `HTTP ${response.status}`);
      }
      return json;
    } catch (error) {
      throw new Error(`Telegram API error: ${responseText}`);
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
    const sessionId = opts.sessionId || generateSessionId();
    
    console.log(`📨 [sendLiveChatRequest] Creating session: ${sessionId}`);

    const session = {
      sessionId,
      visitorName: opts.visitorName || "Website Visitor",
      email: opts.email || "not-provided",
      pageUrl: opts.pageUrl || "unknown",
      message: opts.message,
      createdAt: Date.now(),
      accepted: false,
      acceptedBy: null,
      ownerMessages: [],
      userMessages: [{ text: opts.message, at: Date.now(), name: opts.visitorName || "Visitor" }],
      lastActivityAt: Date.now(),
    };

    // Save session first - this is critical!
    const saved = await saveSession(session);
    if (!saved) {
      throw new Error("Failed to save session");
    }

    console.log(`✅ [sendLiveChatRequest] Session ${sessionId} saved successfully`);

    const text = [
      "📩 *Live Chat Request*",
      "",
      `👤 *From:* ${opts.visitorName || "Website Visitor"}`,
      `📧 *Email:* ${opts.email || "not provided"}`,
      `🌐 *Page:* ${opts.pageUrl || "unknown"}`,
      "",
      "*Message:*",
      opts.message,
      "",
      `🆔 *Session:* \`${sessionId}\``,
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
        parse_mode: "Markdown", 
        reply_markup: keyboard 
      });
      
      const messageId = result?.result?.message_id;
      if (messageId) {
        // Store mapping
        memoryMsgMap.set(String(messageId), sessionId);
        
        if (redis) {
          try {
            await redis.setex(`livechat:msg2sess:${messageId}`, SESSION_TTL, sessionId);
          } catch (error) {
            console.warn("❌ Failed to save message mapping to Redis:", error);
          }
        }
      }
      
      console.log(`✅ [sendLiveChatRequest] Notification sent for session ${sessionId}`);
      return { success: true, sessionId, messageId };
    } catch (error: any) {
      // Clean up session if notification failed
      await deleteSession(sessionId);
      console.error("❌ [sendLiveChatRequest] Error:", error);
      return { success: false, error: error.message };
    }
  }

  async answerCallbackQuery(callbackQueryId: string, text: string, showAlert = false) {
    const url = `https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`;
    
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        callback_query_id: callbackQueryId, 
        text, 
        show_alert: showAlert 
      }),
    });
  }

  async handleCallbackQuery(callback: {
    id: string;
    from: { id: number; first_name?: string; last_name?: string; username?: string };
    data: string;
    message?: { chat: { id: number }; message_id?: number };
  }) {
    try {
      console.log("🔄 [handleCallbackQuery] Received:", callback.data);
      
      const [action, sessionId] = String(callback.data || "").split(":");
      if (!sessionId) {
        await this.answerCallbackQuery(callback.id, "❌ Invalid session data", true);
        return { handled: false };
      }

      console.log(`🔍 [handleCallbackQuery] Looking for session: ${sessionId}`);
      
      // Get session from storage (Redis)
      const session = await getSession(sessionId);
      
      if (!session) {
        console.error(`❌ [handleCallbackQuery] Session ${sessionId} not found`);
        
        // Debug: Check what sessions exist
        if (redis) {
          try {
            // This is just for debugging - don't use in production
            const keys = await redis.keys("livechat:session:*");
            console.log(`📋 Existing session keys: ${keys.length}`);
            for (const key of keys.slice(0, 5)) {
              console.log(`   - ${key}`);
            }
          } catch (e) {
            console.error("❌ Failed to list sessions:", e);
          }
        }
        
        await this.answerCallbackQuery(
          callback.id, 
          "❌ Session not found. It may have expired. Please ask the visitor to start a new chat.", 
          true
        );
        return { handled: true };
      }

      console.log(`✅ [handleCallbackQuery] Found session:`, {
        sessionId: session.sessionId,
        visitorName: session.visitorName,
        accepted: session.accepted
      });

      if (action === "join") {
        // Update session
        session.accepted = true;
        session.acceptedBy = {
          telegramChatId: String(callback.from.id),
          responderName: `${callback.from.first_name || ""} ${callback.from.last_name || ""}`.trim() || callback.from.username || "Admin",
          acceptedAt: Date.now(),
        };
        session.lastActivityAt = Date.now();

        const saved = await saveSession(session);
        if (!saved) {
          console.error(`❌ [handleCallbackQuery] Failed to save session ${sessionId}`);
          await this.answerCallbackQuery(callback.id, "❌ Failed to join chat. Please try again.", true);
          return { handled: true };
        }

        console.log(`✅ [handleCallbackQuery] Session ${sessionId} accepted by ${session.acceptedBy.responderName}`);
        
        await this.answerCallbackQuery(
          callback.id, 
          "✅ You joined the chat! Reply to this chat to talk to the visitor.", 
          false
        );

        // Send welcome message to owner
        try {
          const welcomeText = 
            `✅ *You are now chatting with ${session.visitorName}*\n\n` +
            `💬 *Their original message:*\n` +
            `${session.message}\n\n` +
            `🌐 *Page:* ${session.pageUrl}\n` +
            `📧 *Email:* ${session.email}\n\n` +
            `🆔 *Session:* \`${sessionId}\`\n\n` +
            `Just type your messages here and they will be sent to the visitor in real-time!`;
          
          await this.sendMessage(
            String(callback.from.id), 
            welcomeText,
            { 
              parse_mode: "Markdown",
              reply_markup: { force_reply: true } 
            }
          );
        } catch (error) {
          console.error("❌ [handleCallbackQuery] Failed to send welcome message:", error);
        }

        // Broadcast acceptance with proper type checking
        try {
          const broadcastFn = global.__broadcastSessionUpdate__;
          if (typeof broadcastFn === "function") {
            broadcastFn(sessionId, { 
              type: "accepted", 
              session,
              _meta: { event: "accepted" } 
            });
          }
        } catch (error) {
          console.error("❌ [handleCallbackQuery] Broadcast failed:", error);
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
    } catch (error) {
      console.error("❌ [handleCallbackQuery] Error:", error);
      await this.answerCallbackQuery(callback.id, "❌ An error occurred. Please try again.", true);
      return { handled: false, error };
    }
  }

  async appendOwnerMessageToSession(ownerTelegramChatId: string, text: string, replyToMessageId?: number | null) {
    try {
      console.log(`💬 [appendOwnerMessageToSession] From: ${ownerTelegramChatId}, text: ${text}, replyTo: ${replyToMessageId}`);
      
      let targetSessionId: string | null = null;

      // Try to find session by reply_to_message_id
      if (replyToMessageId) {
        // Check memory
        targetSessionId = memoryMsgMap.get(String(replyToMessageId)) || null;
        
        // Check Redis
        if (!targetSessionId && redis) {
          try {
            targetSessionId = await redis.get(`livechat:msg2sess:${replyToMessageId}`) as string;
            if (targetSessionId) {
              memoryMsgMap.set(String(replyToMessageId), targetSessionId);
            }
          } catch (error) {
            console.error("❌ [appendOwnerMessageToSession] Redis get failed:", error);
          }
        }
        
        if (targetSessionId) {
          console.log(`🔍 [appendOwnerMessageToSession] Found session via reply: ${targetSessionId}`);
        }
      }

      // If no session found via reply, find most recent session for this owner
      if (!targetSessionId) {
        console.log(`🔍 [appendOwnerMessageToSession] Finding recent session for owner: ${ownerTelegramChatId}`);
        
        if (redis) {
          try {
            // Get all session keys
            const keys = await redis.keys("livechat:session:*");
            let mostRecentSession = null;
            let mostRecentTime = 0;

            // Check each session (this is not efficient for large numbers, but works for now)
            for (const key of keys) {
              const sessionData = await redis.get(key);
              if (sessionData) {
                const session = JSON.parse(sessionData as string);
                if (session.acceptedBy?.telegramChatId === ownerTelegramChatId && 
                    session.accepted && 
                    session.lastActivityAt > mostRecentTime) {
                  mostRecentSession = session;
                  mostRecentTime = session.lastActivityAt;
                }
              }
            }

            if (mostRecentSession) {
              targetSessionId = mostRecentSession.sessionId;
              console.log(`✅ [appendOwnerMessageToSession] Found recent session: ${targetSessionId}`);
            }
          } catch (error) {
            console.error("❌ [appendOwnerMessageToSession] Redis search failed:", error);
          }
        }
      }

      if (!targetSessionId) {
        console.error("❌ [appendOwnerMessageToSession] No session found for owner");
        return null;
      }

      // Get and update the session
      const session = await getSession(targetSessionId);
      if (!session) {
        console.error(`❌ [appendOwnerMessageToSession] Session ${targetSessionId} not found`);
        return null;
      }

      session.ownerMessages = session.ownerMessages || [];
      session.ownerMessages.push({ 
        text, 
        at: Date.now() 
      });
      session.lastActivityAt = Date.now();

      await saveSession(session);
      console.log(`✅ [appendOwnerMessageToSession] Message appended to session ${targetSessionId}`);

      return session;
    } catch (error) {
      console.error("❌ [appendOwnerMessageToSession] Error:", error);
      return null;
    }
  }
}

// Export the memory maps for debugging
export const sessions = memorySessions;
export const msgIdToSessionMap = memoryMsgMap;
