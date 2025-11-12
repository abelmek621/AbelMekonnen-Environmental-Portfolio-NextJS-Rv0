// lib/telegram.ts
import crypto from "crypto";
import { Redis } from "@upstash/redis";

/**
 * Shared global maps so sessions survive hot reload in dev.
 */
declare global {
  var __LIVECHAT_SESSIONS__: Map<string, any> | undefined;
  var __LIVECHAT_MSGMAP__: Record<string, string> | undefined;
  var __broadcastSessionUpdate__: ((sessionId: string, payload: any) => void) | undefined;
}

if (!globalThis.__LIVECHAT_SESSIONS__) globalThis.__LIVECHAT_SESSIONS__ = new Map<string, any>();
if (!globalThis.__LIVECHAT_MSGMAP__) globalThis.__LIVECHAT_MSGMAP__ = {};

/** in-memory session store (primary for dev) */
export const sessions: Map<string, any> = globalThis.__LIVECHAT_SESSIONS__!;
export const msgIdToSessionMap: Record<string, string> = globalThis.__LIVECHAT_MSGMAP__!;

/** Upstash Redis client (optional: only when env vars set) */
// cast env to string|undefined for TypeScript
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL as string | undefined;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN as string | undefined;

let redis: Redis | null = null;
if (UPSTASH_URL && UPSTASH_TOKEN) {
  try {
    redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
  } catch (e) {
    console.warn("[lib/telegram] failed to init Upstash Redis client:", e);
    redis = null;
  }
}

export function generateSessionId(prefix = "s") {
  return prefix + crypto.randomBytes(6).toString("hex");
}

function escapeHtml(s?: string) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Basic heuristic for escalation (tweak as needed) */
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
  ];
  return triggers.some((t) => text.includes(t));
}

/**
 * Persist session to Upstash Redis (best-effort) and to in-memory map.
 */
export async function saveSession(session: any) {
  try {
    sessions.set(session.sessionId, session);
    if (redis) {
      try {
        await redis.set(`livechat:session:${session.sessionId}`, JSON.stringify(session));
      } catch (err) {
        console.warn("[lib/telegram] redis set in saveSession failed:", err);
      }
    }
    // Also broadcast session creation/update if a broadcast hook exists
    try {
      if (typeof globalThis.__broadcastSessionUpdate__ === "function") {
        globalThis.__broadcastSessionUpdate__(session.sessionId, { type: "session_saved", session });
      }
    } catch (e) { /* non-fatal */ }
    return true;
  } catch (err) {
    console.warn("[lib/telegram] saveSession failed:", err);
    return false;
  }
}

export async function deleteSession(sessionId: string) {
  try {
    sessions.delete(sessionId);
    if (redis) {
      try {
        await redis.del(`livechat:session:${sessionId}`);
      } catch (err) {
        console.warn("[lib/telegram] redis del failed:", err);
      }
    }
    // broadcast deletion if needed
    try {
      if (typeof globalThis.__broadcastSessionUpdate__ === "function") {
        globalThis.__broadcastSessionUpdate__(sessionId, { type: "session_deleted", sessionId });
      }
    } catch (e) {}
    return true;
  } catch (err) {
    console.warn("[lib/telegram] deleteSession failed:", err);
    return false;
  }
}

export async function getSession(sessionId: string) {
  // Try in-memory first
  const s = sessions.get(sessionId);
  if (s) return s;
  // Try redis fallback
  if (redis) {
    try {
      const txt = (await redis.get(`livechat:session:${sessionId}`)) as string | null;
      if (txt) {
        const parsed = JSON.parse(txt);
        sessions.set(sessionId, parsed);
        return parsed;
      }
    } catch (err) {
      console.warn("[lib/telegram] redis getSession failed:", err);
    }
  }
  return null;
}

/** Telegram notifier */
const DEFAULT_BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || "") as string;
const DEFAULT_ADMIN_CHAT = (process.env.TELEGRAM_ADMIN_CHAT_ID || "") as string;

export class TelegramNotifier {
  botToken: string;
  defaultChatId: string;

  constructor(botToken?: string, defaultChatId?: string) {
    this.botToken = botToken || DEFAULT_BOT_TOKEN;
    this.defaultChatId = defaultChatId || DEFAULT_ADMIN_CHAT;
    if (!this.botToken) console.warn("[TelegramNotifier] TELEGRAM_BOT_TOKEN not set");
  }

  async sendMessage(chatId: string, text: string, options?: { parse_mode?: string; reply_markup?: any }) {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const body: any = { chat_id: chatId, text };
    if (options?.parse_mode) body.parse_mode = options.parse_mode;
    if (options?.reply_markup) body.reply_markup = options.reply_markup;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const txt = await res.text().catch(() => "");
    try {
      const json = JSON.parse(txt);
      if (!res.ok || !json?.ok) {
        throw new Error(json?.description || `HTTP ${res.status}`);
      }
      return json;
    } catch (err) {
      throw new Error(`Telegram sendMessage failed: ${String(err)} - raw: ${txt}`);
    }
  }

  /**
   * Creates session, persists it, sends Telegram notification with inline keyboard.
   * Returns: { success: boolean, sessionId, messageId?, error? }
   */
  async sendLiveChatRequest(opts: {
    visitorName?: string;
    message: string;
    pageUrl?: string;
    email?: string;
    sessionId?: string;
    adminChatId?: string;
  }) {
    const adminChatId = opts.adminChatId || this.defaultChatId;
    if (!adminChatId) return { success: false, error: "No admin chat id" };
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

    // Save session (in-memory and optional redis)
    try {
      await saveSession(session);
    } catch (err) {
      console.warn("[TelegramNotifier] saveSession failed:", err);
    }

    const text = [
      "📩 <b>Live chat request</b>",
      "",
      `From: <b>${escapeHtml(session.visitorName)}</b>`,
      `Email: ${escapeHtml(session.email || "not provided")}`,
      `Page: ${escapeHtml(session.pageUrl || "unknown")}`,
      "",
      "Message:",
      escapeHtml(session.message),
      "",
      `Session ID: <code>${sessionId}</code>`,
    ].join("\n");

    const keyboard = {
      inline_keyboard: [
        [{ text: "Join Chat", callback_data: `join:${sessionId}` }, { text: "Away / Not now", callback_data: `away:${sessionId}` }],
      ],
    };

    try {
      const json = await this.sendMessage(adminChatId, text, { parse_mode: "HTML", reply_markup: keyboard });
      const messageId = json?.result?.message_id;
      if (messageId) {
        msgIdToSessionMap[String(messageId)] = sessionId;
        if (redis) {
          try {
            await redis.set(`livechat:msg2sess:${messageId}`, sessionId);
          } catch (e) {
            console.warn("[TelegramNotifier] persist msg2sess failed:", e);
          }
        }
      }
      console.log("[TelegramNotifier] Notification sent to admin:", adminChatId, "message_id:", messageId);
      return { success: true, sessionId, messageId };
    } catch (err: any) {
      try { await deleteSession(sessionId); } catch (_) {}
      console.error("[TelegramNotifier] sendLiveChatRequest error:", err?.message || err);
      return { success: false, error: err?.message || String(err) };
    }
  }

  async answerCallback(callbackQueryId: string, text: string) {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`;
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: false }),
      });
    } catch (err) {
      console.warn("[TelegramNotifier] answerCallback failed:", err);
    }
  }

  /**
   * Handle inline button clicks from the admin (join / away)
   */
  async handleCallbackQuery(callback: {
    id: string;
    from: { id: number; first_name?: string; last_name?: string; username?: string };
    data: string;
    message?: { chat: { id: number }; message_id?: number };
  }) {
    try {
      console.log("[TelegramNotifier] handleCallbackQuery data=", callback.data);
      const [action, sessionId] = String(callback.data || "").split(":");
      if (!sessionId) {
        await this.answerCallback(callback.id, "Invalid session data");
        return { handled: false };
      }
      const session = await getSession(sessionId);
      if (!session) {
        console.warn("[TelegramNotifier] session not found for callback:", sessionId);
        await this.answerCallback(callback.id, "Session not found or expired.");
        return { handled: true };
      }

      if (action === "join") {
        session.accepted = true;
        session.acceptedBy = {
          telegramChatId: String(callback.from.id),
          responderName: `${callback.from.first_name || ""} ${callback.from.last_name || ""}`.trim() || callback.from.username,
          acceptedAt: Date.now(),
        };
        session.lastActivityAt = Date.now();
        await saveSession(session);

        await this.answerCallback(callback.id, "You joined the visitor chat. Send messages in this Telegram chat to communicate.");

        // send a force-reply follow-up so owner can reply and we map reply_to -> session
        try {
          const followUp = await this.sendMessage(String(callback.from.id), `✅ You joined session <code>${sessionId}</code>. Please reply to this message to send text to the visitor.`, { parse_mode: "HTML", reply_markup: { force_reply: true } });
          const messageId = followUp?.result?.message_id;
          if (messageId) {
            msgIdToSessionMap[String(messageId)] = sessionId;
            if (redis) {
              try { await redis.set(`livechat:msg2sess:${messageId}`, sessionId); } catch (e) { /* ignore */ }
            }
            console.log("[TelegramNotifier] mapped follow-up message_id -> session", messageId, sessionId);
          }
        } catch (e) {
          console.warn("[TelegramNotifier] failed to send follow-up force_reply", e);
        }

        // notify listeners via global broadcast hook
        try {
          if (typeof globalThis.__broadcastSessionUpdate__ === "function") {
            globalThis.__broadcastSessionUpdate__(sessionId, { type: "accepted", session, _meta: { event: "accepted" } });
          }
        } catch (e) {}
        return { handled: true, session };
      }

      if (action === "away") {
        session.accepted = false;
        session.lastActivityAt = Date.now();
        await saveSession(session);
        try {
          if (typeof globalThis.__broadcastSessionUpdate__ === "function") {
            globalThis.__broadcastSessionUpdate__(sessionId, { type: "accepted", session, _meta: { event: "away" } });
          }
        } catch (e) {}
        await this.answerCallback(callback.id, "Marked as away — visitor will be notified.");
        return { handled: true };
      }

      await this.answerCallback(callback.id, "Unknown action");
      return { handled: false };
    } catch (err) {
      console.error("[TelegramNotifier] handleCallbackQuery error", err);
      return { handled: false, error: err };
    }
  }

  /**
   * Append an owner message to the most relevant session for this owner.
   * If replyToMessageId is provided and maps to a session, use that mapping.
   */
  appendOwnerMessageToSession(ownerTelegramChatId: string, text: string, replyToMessageId?: number | null) {
    try {
      const ownerIdStr = String(ownerTelegramChatId);
      const now = Date.now();
      const RECENT_MS = 15 * 60 * 1000; // 15 minutes
      if (replyToMessageId) {
        const mapped = msgIdToSessionMap[String(replyToMessageId)];
        if (mapped) {
          const mappedSession = sessions.get(mapped);
          if (mappedSession) {
            mappedSession.ownerMessages = mappedSession.ownerMessages || [];
            mappedSession.ownerMessages.push({ text, at: now });
            mappedSession.lastActivityAt = now;
            sessions.set(mapped, mappedSession);
            if (redis) {
              try { redis.set(`livechat:session:${mapped}`, JSON.stringify(mappedSession)); } catch (_) {}
            }
            if (typeof globalThis.__broadcastSessionUpdate__ === "function") {
              globalThis.__broadcastSessionUpdate__(mapped, { type: "owner_message", session: mappedSession });
            }
            console.log("[TelegramNotifier] appended owner message via reply_to mapping to session", mapped);
            return mappedSession;
          }
        }
      }

      // find sessions accepted by this owner
      const acceptedSessions: any[] = Array.from(sessions.values()).filter((s: any) => s.acceptedBy?.telegramChatId === ownerIdStr);
      if (acceptedSessions.length === 0) {
        console.warn("[TelegramNotifier] no accepted session found for owner", ownerIdStr);
        return null;
      }

      const recentCandidates = acceptedSessions.filter((s) => {
        const last = s.lastActivityAt || s.acceptedBy?.acceptedAt || s.createdAt || 0;
        return now - last <= RECENT_MS;
      });

      let targetSession: any;
      if (recentCandidates.length > 0) {
        recentCandidates.sort((a, b) => (b.lastActivityAt || b.acceptedBy?.acceptedAt || 0) - (a.lastActivityAt || a.acceptedBy?.acceptedAt || 0));
        targetSession = recentCandidates[0];
      } else {
        acceptedSessions.sort((a, b) => (b.acceptedBy?.acceptedAt || 0) - (a.acceptedBy?.acceptedAt || 0));
        targetSession = acceptedSessions[0];
      }

      targetSession.ownerMessages = targetSession.ownerMessages || [];
      targetSession.ownerMessages.push({ text, at: now });
      targetSession.lastActivityAt = now;
      sessions.set(targetSession.sessionId, targetSession);
      if (redis) {
        try { redis.set(`livechat:session:${targetSession.sessionId}`, JSON.stringify(targetSession)); } catch (_) {}
      }

      if (typeof globalThis.__broadcastSessionUpdate__ === "function") {
        globalThis.__broadcastSessionUpdate__(targetSession.sessionId, { type: "owner_message", session: targetSession });
      }

      console.log("[TelegramNotifier] appended owner message to session", targetSession.sessionId);
      return targetSession;
    } catch (err) {
      console.error("[TelegramNotifier] appendOwnerMessageToSession error", err);
      return null;
    }
  }

  /**
   * Expose a getSession method for other code to use
   */
  getSession(sessionId: string) {
    return sessions.get(sessionId) || null;
  }
}

/** re-export helpers for convenience */
/* export {
  generateSessionId,
  shouldEscalateToHuman,
  saveSession,
  deleteSession,
  getSession,
}; */
