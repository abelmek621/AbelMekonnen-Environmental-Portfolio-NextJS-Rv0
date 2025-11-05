// lib/telegram.ts
import crypto from "crypto";

/**
 * Ensure a single shared sessions Map on globalThis so it survives hot reloads in dev.
 */
declare global {
  var __LIVECHAT_SESSIONS__: Map<string, any> | undefined;
  var __LIVECHAT_MSGMAP__: Record<string, string> | undefined;
  var __broadcastSessionUpdate__: ((sessionId: string, payload: any) => void) | undefined;
}

if (!globalThis.__LIVECHAT_SESSIONS__) {
  globalThis.__LIVECHAT_SESSIONS__ = new Map();
}
export const sessions: Map<string, any> = globalThis.__LIVECHAT_SESSIONS__!;

if (!globalThis.__LIVECHAT_MSGMAP__) {
  globalThis.__LIVECHAT_MSGMAP__ = {};
}
export const msgIdToSessionMap = globalThis.__LIVECHAT_MSGMAP__;

/** utilities */
export function generateSessionId(prefix = "s") {
  return prefix + crypto.randomBytes(6).toString("hex");
}
const DEFAULT_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const DEFAULT_ADMIN_CHAT = process.env.TELEGRAM_ADMIN_CHAT_ID || "";

function escapeHtml(s: string) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Helper: attempt to broadcast a session update to connected SSE clients.
 * Tries 1) globalThis.__broadcastSessionUpdate__, 2) dynamic import of the SSE module's exported function.
 * Always logs the outcome so you can debug.
 */
async function safeBroadcastSessionUpdate(sessionId: string, payload: any) {
  try {
    // 1) fast path: global function (set by app/api/session-events/route.ts at module load time)
    if (typeof globalThis.__broadcastSessionUpdate__ === "function") {
      try {
        globalThis.__broadcastSessionUpdate__(sessionId, payload);
        console.log("[lib/telegram] broadcast via globalThis.__broadcastSessionUpdate__", sessionId);
        return true;
      } catch (err) {
        console.warn("[lib/telegram] global broadcast threw:", err);
        // fall through to dynamic import attempt
      }
    } else {
      console.debug("[lib/telegram] globalThis.__broadcastSessionUpdate__ not present");
    }

    // 2) try dynamic import of SSE route module (avoids circular import at top-level)
    try {
      // dynamic import path — same as your session-events file
      const mod = await import(/* webpackIgnore: true */ "@/app/api/session-events/route");
      if (mod && typeof mod.broadcastSessionUpdate === "function") {
        try {
          mod.broadcastSessionUpdate(sessionId, payload);
          console.log("[lib/telegram] broadcast via dynamic import of session-events", sessionId);
          return true;
        } catch (err) {
          console.warn("[lib/telegram] dynamic import broadcast threw:", err);
        }
      } else {
        console.debug("[lib/telegram] session-events module loaded but broadcastSessionUpdate not found");
      }
    } catch (err) {
      console.debug("[lib/telegram] dynamic import of session-events failed (likely dev HMR ordering):", err);
    }

    // 3) last resort: nothing we can do — log and continue
    console.warn("[lib/telegram] no broadcast available for session", sessionId);
    return false;
  } catch (err) {
    console.error("[lib/telegram] safeBroadcastSessionUpdate unexpected error", err);
    return false;
  }
}

/**
 * Should we escalate this visitor message to a human (owner/admin)?
 * Simple keyword-based heuristic that's easy to extend.
 * Returns true when the user explicitly asks to talk to a person, owner, or expert.
 */
export function shouldEscalateToHuman(message: string): boolean {
  if (!message || typeof message !== "string") return false;
  const s = message.toLowerCase();

  // common escalation / human-request phrases
  const patterns = [
    /\b(can i talk|can we talk|want to talk|talk to (someone|someone\.)|talk to (the )?(owner|expert|admin|representative|person))\b/,
    /\b(talk to (you|someone|owner|expert)|speak to (someone|owner|expert))\b/,
    /\b(contact (the )?(owner|expert|admin)|contact someone|contact us)\b/,
    /\b(human|real person|representative|support|agent|owner|expert)\b/,
    /\b(help me (please)?|i need help|i need to speak)\b/,
    /\b(chat with (owner|expert|human|someone))\b/,
    /\b(join (me|chat)|join chat|talk now|online now)\b/,
  ];

  for (const re of patterns) {
    if (re.test(s)) return true;
  }

  // fallback: short direct requests like "can i talk?" or "i want to speak"
  if (/\b(can i talk\??|i want to speak|i want to talk)\b/.test(s)) return true;

  return false;
}

export class TelegramNotifier {
  botToken: string;
  defaultChatId: string;
  constructor(botToken?: string, defaultChatId?: string) {
    this.botToken = botToken || DEFAULT_BOT_TOKEN;
    this.defaultChatId = defaultChatId || DEFAULT_ADMIN_CHAT;
    if (!this.botToken) {
      console.warn("TelegramNotifier: TELEGRAM_BOT_TOKEN not set");
    }
  }

  private async safeFetchJson(url: string, body: any) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const txt = await res.text().catch(() => "");
    let json: any = null;
    try {
      json = JSON.parse(txt);
    } catch {
      json = txt;
    }
    return { ok: res.ok, status: res.status, body: json };
  }

  async sendMessage(chatId: string, text: string) {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const { ok, status, body } = await this.safeFetchJson(url, { chat_id: chatId, text, parse_mode: "HTML" });
    if (!ok || !body?.ok) {
      const err = body?.description || `HTTP ${status}`;
      throw new Error(`Telegram sendMessage failed: ${err}`);
    }
    return body;
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
    if (!adminChatId) return { success: false, error: "No admin chat id" };
    const sessionId = opts.sessionId || generateSessionId();
    const now = Date.now();
    const session = {
      sessionId,
      visitorName: opts.visitorName || "Website Visitor",
      email: opts.email,
      pageUrl: opts.pageUrl,
      message: opts.message,
      createdAt: now,
      accepted: false,
      acceptedBy: null,
      ownerMessages: [],
      userMessages: [],
      lastActivityAt: now,
    };
    sessions.set(sessionId, session);
    console.log("[TelegramNotifier] Created session", sessionId);

    const text = `📩 <b>Live chat request</b>\n\nFrom: <b>${escapeHtml(session.visitorName)}</b>\nEmail: ${escapeHtml(session.email || "not provided")}\nPage: ${escapeHtml(session.pageUrl || "unknown")}\n\nMessage:\n${escapeHtml(session.message)}\n\nSession ID: <code>${sessionId}</code>`;
    const keyboard = {
      inline_keyboard: [
        [
          { text: "Join Chat", callback_data: `join:${sessionId}` },
          { text: "Away / Not now", callback_data: `away:${sessionId}` },
        ],
      ],
    };

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const { ok, status, body } = await this.safeFetchJson(url, {
        chat_id: adminChatId,
        text,
        parse_mode: "HTML",
        reply_markup: keyboard,
      });

      if (!ok || !body?.ok) {
        sessions.delete(sessionId);
        const err = body?.description || `HTTP ${status}`;
        console.error("[TelegramNotifier] sendLiveChatRequest failed:", err);
        return { success: false, error: err };
      }

      if (body?.result?.message_id) {
        msgIdToSessionMap[String(body.result.message_id)] = sessionId;
        console.log("[TelegramNotifier] mapped message_id -> session", body.result.message_id, sessionId);
      }

      // Attempt to broadcast session creation
      try {
        await safeBroadcastSessionUpdate(sessionId, session);
      } catch (e) {
        console.warn("[TelegramNotifier] broadcast on create failed", e);
      }

      console.log("[TelegramNotifier] Notification sent to admin:", adminChatId, "message_id:", body.result?.message_id);
      return { success: true, sessionId, messageId: body.result?.message_id };
    } catch (err: any) {
      sessions.delete(sessionId);
      console.error("[TelegramNotifier] sendLiveChatRequest error:", err?.message || err);
      return { success: false, error: err?.message || String(err) };
    }
  }

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
      const session = sessions.get(sessionId);
      if (!session) {
        console.warn("[TelegramNotifier] session not found for callback:", sessionId);
        await this.answerCallback(callback.id, "Session not found or expired.");
        return { handled: true };
      }

      if (action === "join") {
        session.accepted = true;
        session.acceptedBy = {
          telegramChatId: String(callback.from.id),
          responderName:
            `${callback.from.first_name || ""} ${callback.from.last_name || ""}`.trim() || callback.from.username,
          acceptedAt: Date.now(),
        };
        session.lastActivityAt = Date.now();
        sessions.set(sessionId, session);
        console.log("[TelegramNotifier] session ACCEPTED", sessionId, "by", session.acceptedBy);

        // broadcast session accepted to listeners (robust)
        try {
          await safeBroadcastSessionUpdate(sessionId, { ...session, _meta: { event: "accepted" } });
        } catch (e) {
          console.warn("[TelegramNotifier] broadcast on accepted failed", e);
        }

        await this.answerCallback(callback.id, "You joined the visitor chat. Send messages in this Telegram chat to communicate.");

        // send follow-up with force_reply and map its message_id to this session
        try {
          const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
          const { ok, body } = await this.safeFetchJson(url, {
            chat_id: callback.from.id,
            text: `✅ You joined session <code>${sessionId}</code>. Please reply to this message to send text to the visitor.`,
            parse_mode: "HTML",
            reply_markup: { force_reply: true },
          });
          if (ok && body?.result?.message_id) {
            msgIdToSessionMap[String(body.result.message_id)] = sessionId;
            console.log("[TelegramNotifier] mapped follow-up message_id -> session", body.result.message_id, sessionId);
          } else {
            console.warn("[TelegramNotifier] follow-up send returned no message_id", body);
          }
        } catch (e) {
          console.warn("[TelegramNotifier] failed to send follow-up force_reply", e);
        }

        return { handled: true, session };
      }

      if (action === "away") {
        session.accepted = false;
        session.lastActivityAt = Date.now();
        sessions.set(sessionId, session);

        try {
          await safeBroadcastSessionUpdate(sessionId, { ...session, _meta: { event: "away" } });
        } catch (e) {
          console.warn("[TelegramNotifier] broadcast on away failed", e);
        }

        console.log("[TelegramNotifier] session marked away", sessionId);
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
   * Append an owner message to the most relevant session for this owner.
   * If replyToMessageId is provided and maps to a session, use that mapping.
   */
  appendOwnerMessageToSession(ownerTelegramChatId: string, text: string, replyToMessageId?: number | null) {
    try {
      const ownerIdStr = String(ownerTelegramChatId);
      const now = Date.now();
      const RECENT_MS = 15 * 60 * 1000; // 15 minutes considered "recent"

      // 1) If message is reply to mapped message -> route exactly
      if (replyToMessageId) {
        const mappedSessionId = msgIdToSessionMap[String(replyToMessageId)];
        if (mappedSessionId) {
          const mappedSession = sessions.get(mappedSessionId);
          if (mappedSession) {
            mappedSession.ownerMessages = mappedSession.ownerMessages || [];
            mappedSession.ownerMessages.push({ text, at: now });
            mappedSession.lastActivityAt = now;
            sessions.set(mappedSessionId, mappedSession);

            // broadcast update (robust)
            safeBroadcastSessionUpdate(mappedSessionId, mappedSession).catch(() => {});

            console.log("[TelegramNotifier] appended owner message via reply_to mapping to session", mappedSessionId);
            return mappedSession;
          }
        }
      }

      // 2) find accepted sessions by this owner
      const acceptedSessions: any[] = Array.from(sessions.values()).filter(
        (s: any) => s.acceptedBy?.telegramChatId === ownerIdStr
      );
      if (acceptedSessions.length === 0) {
        console.warn("[TelegramNotifier] no accepted session found for owner", ownerIdStr);
        return null;
      }

      // prefer recent active sessions
      const recentCandidates = acceptedSessions.filter((s) => {
        const last = s.lastActivityAt || s.acceptedBy?.acceptedAt || s.createdAt || 0;
        return now - last <= RECENT_MS;
      });

      let targetSession;
      if (recentCandidates.length > 0) {
        recentCandidates.sort((a, b) => (b.lastActivityAt || b.acceptedBy?.acceptedAt || 0) - (a.lastActivityAt || a.acceptedBy?.acceptedAt || 0));
        targetSession = recentCandidates[0];
        console.log("[TelegramNotifier] chose recent session for owner", ownerIdStr, "session", targetSession.sessionId);
      } else {
        acceptedSessions.sort((a, b) => (b.acceptedBy?.acceptedAt || 0) - (a.acceptedBy?.acceptedAt || 0));
        targetSession = acceptedSessions[0];
        console.log("[TelegramNotifier] no recent session; chose newest accepted for owner", ownerIdStr, "session", targetSession.sessionId);
      }

      // append message and broadcast
      targetSession.ownerMessages = targetSession.ownerMessages || [];
      targetSession.ownerMessages.push({ text, at: now });
      targetSession.lastActivityAt = now;
      sessions.set(targetSession.sessionId, targetSession);

      // robust broadcast
      safeBroadcastSessionUpdate(targetSession.sessionId, targetSession).catch(() => {});

      console.log("[TelegramNotifier] appended owner message to session", targetSession.sessionId);
      return targetSession;
    } catch (err) {
      console.error("[TelegramNotifier] appendOwnerMessageToSession error", err);
      return null;
    }
  }
  
  getSession(sessionId: string) {
    return sessions.get(sessionId) || null;
  }
}
