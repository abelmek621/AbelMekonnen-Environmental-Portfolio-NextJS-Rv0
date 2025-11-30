// lib/telegram.ts
import crypto from "crypto";
import { saveSessionToRedis, getSessionFromRedis, deleteSessionFromRedis } from "./session-manager";

// Simple in-memory cache for active sessions (supplements Redis)
const activeSessions = new Map<string, any>();
const messageToSessionMap = new Map<string, string>();

export function generateSessionId(prefix = "sess"): string {
  return prefix + crypto.randomBytes(12).toString("hex");
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

export async function saveSession(session: any): Promise<boolean> {
  try {
    if (!session.sessionId) {
      console.error("❌ [saveSession] Missing sessionId");
      return false;
    }

    // Update timestamp
    session.lastActivityAt = Date.now();
    
    // Save to memory cache
    activeSessions.set(session.sessionId, session);
    
    // Save to Redis (primary storage)
    const redisSaved = await saveSessionToRedis(session);
    
    if (!redisSaved) {
      console.error("❌ [saveSession] Failed to save to Redis");
      return false;
    }

    console.log(`✅ [saveSession] Session ${session.sessionId} saved successfully`);
    return true;
  } catch (error) {
    console.error("❌ [saveSession] Error:", error);
    return false;
  }
}

export async function getSession(sessionId: string): Promise<any> {
  try {
    // Try memory first
    let session = activeSessions.get(sessionId);
    if (session) {
      return session;
    }

    // Try Redis
    session = await getSessionFromRedis(sessionId);
    if (session) {
      // Cache in memory
      activeSessions.set(sessionId, session);
      return session;
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
    activeSessions.delete(sessionId);
    
    // Remove from Redis
    const redisDeleted = await deleteSessionFromRedis(sessionId);
    
    // Clean up message mappings
    for (const [msgId, sessId] of messageToSessionMap.entries()) {
      if (sessId === sessionId) {
        messageToSessionMap.delete(msgId);
      }
    }

    return redisDeleted;
  } catch (error) {
    console.error("❌ [deleteSession] Error:", error);
    return false;
  }
}

// Telegram Notifier
export class TelegramNotifier {
  botToken: string;
  defaultChatId: string;

  constructor(botToken?: string, defaultChatId?: string) {
    this.botToken = botToken || process.env.TELEGRAM_BOT_TOKEN || "";
    this.defaultChatId = defaultChatId || process.env.TELEGRAM_ADMIN_CHAT_ID || "";
    
    if (!this.botToken) throw new Error("TELEGRAM_BOT_TOKEN not configured");
    if (!this.defaultChatId) throw new Error("TELEGRAM_ADMIN_CHAT_ID not configured");
  }

  async sendMessage(chatId: string, text: string, options?: any) {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const body: any = { 
      chat_id: chatId, 
      text,
      disable_web_page_preview: true
    };
    
    Object.assign(body, options);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    const result = await response.json();
    
    if (!response.ok || !result?.ok) {
      throw new Error(result?.description || `HTTP ${response.status}`);
    }
    
    return result;
  }

  async sendLiveChatRequest(opts: {
    visitorName?: string;
    message: string;
    pageUrl?: string;
    email?: string;
    sessionId?: string;
  }) {
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

    // Save session FIRST - this is critical
    const saved = await saveSession(session);
    if (!saved) {
      throw new Error("Failed to save session to storage");
    }

    console.log(`✅ [sendLiveChatRequest] Session ${sessionId} saved, sending Telegram notification`);

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
      const result = await this.sendMessage(this.defaultChatId, text, { 
        parse_mode: "Markdown", 
        reply_markup: keyboard 
      });
      
      const messageId = result?.result?.message_id;
      if (messageId) {
        messageToSessionMap.set(String(messageId), sessionId);
      }
      
      console.log(`✅ [sendLiveChatRequest] Telegram notification sent for session ${sessionId}`);
      return { success: true, sessionId, messageId };
    } catch (error: any) {
      // Clean up session if notification failed
      await deleteSession(sessionId);
      console.error("❌ [sendLiveChatRequest] Telegram error:", error);
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
  }) {
    try {
      console.log("🔄 [handleCallbackQuery] Received:", callback.data);
      
      const [action, sessionId] = String(callback.data || "").split(":");
      if (!sessionId) {
        await this.answerCallbackQuery(callback.id, "❌ Invalid session data", true);
        return { handled: false };
      }

      console.log(`🔍 [handleCallbackQuery] Looking for session: ${sessionId}`);
      
      // Get session from storage
      const session = await getSession(sessionId);
      
      if (!session) {
        console.error(`❌ [handleCallbackQuery] Session ${sessionId} not found`);
        await this.answerCallbackQuery(
          callback.id, 
          "❌ Session not found. Please ask the visitor to start a new chat.", 
          true
        );
        return { handled: true };
      }

      console.log(`✅ [handleCallbackQuery] Found session for: ${session.visitorName}`);

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

        // Send welcome message
        try {
          const welcomeText = 
            `✅ *You are now chatting with ${session.visitorName}*\n\n` +
            `💬 *Their message:* ${session.message}\n\n` +
            `Just type your messages here and they will be sent to the visitor!`;
          
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

        return { handled: true, session };
      }

      if (action === "away") {
        await this.answerCallbackQuery(callback.id, "❌ Marked as away.", false);
        return { handled: true };
      }

      await this.answerCallbackQuery(callback.id, "❌ Unknown action", true);
      return { handled: false };
    } catch (error) {
      console.error("❌ [handleCallbackQuery] Error:", error);
      await this.answerCallbackQuery(callback.id, "❌ An error occurred.", true);
      return { handled: false, error };
    }
  }

  async appendOwnerMessageToSession(ownerTelegramChatId: string, text: string, replyToMessageId?: number | null) {
    try {
      // Simplified - find any active session for this owner
      if (replyToMessageId) {
        const sessionId = messageToSessionMap.get(String(replyToMessageId));
        if (sessionId) {
          const session = await getSession(sessionId);
          if (session && session.acceptedBy?.telegramChatId === ownerTelegramChatId) {
            session.ownerMessages = session.ownerMessages || [];
            session.ownerMessages.push({ text, at: Date.now() });
            session.lastActivityAt = Date.now();
            await saveSession(session);
            return session;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error("❌ [appendOwnerMessageToSession] Error:", error);
      return null;
    }
  }
}

// Export for debugging
export const sessions = activeSessions;
export const msgIdToSessionMap = messageToSessionMap;
