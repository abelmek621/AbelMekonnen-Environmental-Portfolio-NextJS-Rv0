// lib/telegram.ts
import crypto from "crypto";

/**
 * Shared dev-friendly memory (survive HMR).
 */
declare global {
  var __LIVECHAT_SESSIONS__: Map<string, any> | undefined;
  var __LIVECHAT_MSGMAP__: Record<string, string> | undefined;
  var __broadcastSessionUpdate__: ((sessionId: string, payload: any) => void) | undefined;
}
if (!globalThis.__LIVECHAT_SESSIONS__) globalThis.__LIVECHAT_SESSIONS__ = new Map();
if (!globalThis.__LIVECHAT_MSGMAP__) globalThis.__LIVECHAT_MSGMAP__ = {};

export const sessions: Map<string, any> = globalThis.__LIVECHAT_SESSIONS__!;
export const msgIdToSessionMap: Record<string, string> = globalThis.__LIVECHAT_MSGMAP__!;

export function generateSessionId(prefix = "s") {
  return prefix + crypto.randomBytes(6).toString("hex");
}

const DEFAULT_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const DEFAULT_ADMIN_CHAT = process.env.TELEGRAM_ADMIN_CHAT_ID || "";

function escapeHtml(s: string) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** robust broadcast helper */
async function safeBroadcastSessionUpdate(sessionId: string, payload: any) {
  try {
    if (typeof globalThis.__broadcastSessionUpdate__ === "function") {
      try {
        globalThis.__broadcastSessionUpdate__(sessionId, payload);
        console.log("[lib/telegram] broadcast via globalThis", sessionId);
        return true;
      } catch (e) {
        console.warn("[lib/telegram] global broadcast threw:", e);
      }
    } 
    
    console.warn("[lib/telegram] broadcast unavailable for", sessionId);
    return false;
  } catch (err) {
    console.error("[lib/telegram] safeBroadcast unexpected", err);
    return false;
  }
}

/** Basic heuristic exported for chat escalation */
export function shouldEscalateToHuman(message: string): boolean {
  if (!message || typeof message !== "string") return false;
  const s = message.toLowerCase();
  const patterns = [
    /\b(can i talk|can we talk|want to talk|talk to (someone|owner|expert|admin))\b/,
    /\b(contact (the )?(owner|expert|admin)|contact someone)\b/,
    /\b(human|real person|representative|support|agent|owner|expert)\b/,
    /\b(help me|i need help|i want to talk)\b/,
  ];
  return patterns.some((re) => re.test(s));
}

export class TelegramNotifier {
  botToken: string;
  defaultChatId: string;
  constructor(botToken?: string, defaultChatId?: string) {
    this.botToken = botToken || DEFAULT_BOT_TOKEN;
    this.defaultChatId = defaultChatId || DEFAULT_ADMIN_CHAT;
    if (!this.botToken) console.warn("TelegramNotifier: TELEGRAM_BOT_TOKEN not set");
  }

  private async safeFetchJson(url: string, body: any) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const txt = await res.text().catch(() => "");
    let json: any = null;
    try { json = JSON.parse(txt); } catch { json = txt; }
    return { ok: res.ok, status: res.status, body: json };
  }

  async sendMessage(chatId: string, text: string, extra?: any) {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const payload: any = { chat_id: chatId, text, parse_mode: "HTML", ...extra };
    const { ok, body } = await this.safeFetchJson(url, payload);
    if (!ok || !body?.ok) {
      const err = body?.description || `HTTP ${body?.status || "?"}`;
      throw new Error(`Telegram sendMessage failed: ${err}`);
    }
    return body;
  }

  /** Create live chat session + notify owner */
  async sendLiveChatRequest(opts: { visitorName?: string; message: string; pageUrl?: string; email?: string; sessionId?: string; adminChatId?: string }) {
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
    const keyboard = { inline_keyboard: [[{ text: "Join Chat", callback_data: `join:${sessionId}` }, { text: "Away / Not now", callback_data: `away:${sessionId}` }]] };

    try {
      const { ok, body } = await this.safeFetchJson(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        chat_id: adminChatId, text, parse_mode: "HTML", reply_markup: keyboard
      });
      if (!ok || !body?.ok) {
        sessions.delete(sessionId);
        const err = body?.description || `HTTP ${body?.status || "?"}`;
        console.error('[TelegramNotifier] sendLiveChatRequest failed:', err);
        return { success: false, error: err };
      }
      if (body?.result?.message_id) {
        msgIdToSessionMap[String(body.result.message_id)] = sessionId;
        console.log('[TelegramNotifier] mapped message_id -> session', body.result.message_id, sessionId);
      }
      // broadcast new session
      await safeBroadcastSessionUpdate(sessionId, session).catch(() => {});
      console.log('[TelegramNotifier] Notification sent to admin:', adminChatId, 'message_id:', body.result?.message_id);
      return { success: true, sessionId, messageId: body.result?.message_id };
    } catch (err: any) {
      sessions.delete(sessionId);
      console.error('[TelegramNotifier] sendLiveChatRequest error:', err?.message || err);
      return { success: false, error: err?.message || String(err) };
    }
  }

  async handleCallbackQuery(callback: { id: string; from: { id: number; first_name?: string; last_name?: string; username?: string }; data: string; message?: { chat: { id: number }; message_id?: number } }) {
    try {
      console.log('[TelegramNotifier] handleCallbackQuery data=', callback.data);
      const [action, sessionId] = String(callback.data || "").split(':');
      if (!sessionId) { await this.answerCallback(callback.id, 'Invalid session data'); return { handled: false }; }
      const session = sessions.get(sessionId);
      if (!session) { await this.answerCallback(callback.id, 'Session not found or expired.'); return { handled: true }; }

      if (action === 'join') {
        session.accepted = true;
        session.acceptedBy = {
          telegramChatId: String(callback.from.id),
          responderName: `${callback.from.first_name || ''} ${callback.from.last_name || ''}`.trim() || callback.from.username,
          acceptedAt: Date.now(),
        };
        session.lastActivityAt = Date.now();
        sessions.set(sessionId, session);
        console.log('[TelegramNotifier] session ACCEPTED', sessionId, 'by', session.acceptedBy);

        // broadcast accepted
        await safeBroadcastSessionUpdate(sessionId, { ...session, _meta: { event: "accepted" } }).catch(() => {});

        await this.answerCallback(callback.id, 'You joined the visitor chat. Send messages in this Telegram chat to communicate.');

        // send force_reply follow-up and map message id
        try {
          const { ok, body } = await this.safeFetchJson(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
            chat_id: callback.from.id, text: `✅ You joined session <code>${sessionId}</code>. Reply to this message to send text to the visitor.`, parse_mode: 'HTML', reply_markup: { force_reply: true }
          });
          if (ok && body?.result?.message_id) {
            msgIdToSessionMap[String(body.result.message_id)] = sessionId;
            console.log('[TelegramNotifier] mapped follow-up message_id -> session', body.result.message_id, sessionId);
          }
        } catch (e) {
          console.warn('[TelegramNotifier] follow-up force_reply failed', e);
        }

        // send a persistent "End Chat" button message to owner
        try {
          const kb = { inline_keyboard: [[{ text: 'End Chat', callback_data: `end:${sessionId}` }]] };
          const { ok, body } = await this.safeFetchJson(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
            chat_id: callback.from.id, text: `🔴 Controls for session <code>${sessionId}</code>`, parse_mode: 'HTML', reply_markup: kb
          });
          if (ok && body?.result?.message_id) {
            // map this control message so owner replies can be correlated if needed
            msgIdToSessionMap[String(body.result.message_id)] = sessionId;
            console.log('[TelegramNotifier] mapped control message_id -> session', body.result.message_id, sessionId);
          }
        } catch (e) {
          console.warn('[TelegramNotifier] End Chat button send failed', e);
        }

        return { handled: true, session };
      }

      if (action === 'away' || action === 'end') {
        session.accepted = false;
        session.endedAt = Date.now();
        session.endedBy = {
          telegramChatId: String(callback.from.id),
          responderName: `${callback.from.first_name || ''} ${callback.from.last_name || ''}`.trim() || callback.from.username,
        };
        session.lastActivityAt = Date.now();
        sessions.set(sessionId, session);
        
        // Broadcast end/away
        await safeBroadcastSessionUpdate(sessionId, { ...session, _meta: { event: action === 'end' ? 'ended' : 'away' } }).catch(() => {});
        
        // Notify visitor when owner explicitly ends the chat
        if (action === 'end') {
          await this.notifyVisitorSessionEnded(sessionId);
        }
        
        console.log('[TelegramNotifier] session marked', action, sessionId);
        await this.answerCallback(callback.id, action === 'end' ? "Chat ended — visitor will be notified." : "Marked as away — visitor will be notified.");
        return { handled: true };
      }

      await this.answerCallback(callback.id, 'Unknown action');
      return { handled: false };
    } catch (err) {
      console.error('[TelegramNotifier] handleCallbackQuery error', err);
      return { handled: false, error: err };
    }
  }

  async answerCallback(callbackQueryId: string, text: string) {
    try {
      const url = `https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: false }),
      });
    } catch (err) {
      console.warn('[TelegramNotifier] answerCallback failed:', err);
    }
  }

  appendOwnerMessageToSession(ownerTelegramChatId: string, text: string, replyToMessageId?: number | null) {
    try {
      const ownerIdStr = String(ownerTelegramChatId);
      const now = Date.now();
      const RECENT_MS = 15 * 60 * 1000;

      if (replyToMessageId) {
        const mapped = msgIdToSessionMap[String(replyToMessageId)];
        if (mapped) {
          const sess = sessions.get(mapped);
          if (sess) {
            sess.ownerMessages = sess.ownerMessages || [];
            sess.ownerMessages.push({ text, at: now });
            sess.lastActivityAt = now;
            sessions.set(mapped, sess);
            safeBroadcastSessionUpdate(mapped, sess).catch(() => {});
            console.log('[TelegramNotifier] appended owner message via reply_to mapping to session', mapped);
            return sess;
          }
        }
      }

      const acceptedSessions = Array.from(sessions.values()).filter((s: any) => s.acceptedBy?.telegramChatId === ownerIdStr);
      if (acceptedSessions.length === 0) { console.warn('[TelegramNotifier] no accepted session for owner', ownerIdStr); return null; }

      const recentCandidates = acceptedSessions.filter((s) => {
        const last = s.lastActivityAt || s.acceptedBy?.acceptedAt || s.createdAt || 0;
        return now - last <= RECENT_MS;
      });

      let target = recentCandidates.length ? recentCandidates.sort((a,b)=> (b.lastActivityAt||b.acceptedBy?.acceptedAt||0)-(a.lastActivityAt||a.acceptedBy?.acceptedAt||0))[0] : acceptedSessions.sort((a,b)=> (b.acceptedBy?.acceptedAt||0)-(a.acceptedBy?.acceptedAt||0))[0];

      target.ownerMessages = target.ownerMessages || [];
      target.ownerMessages.push({ text, at: now });
      target.lastActivityAt = now;
      sessions.set(target.sessionId, target);
      safeBroadcastSessionUpdate(target.sessionId, target).catch(() => {});
      console.log('[TelegramNotifier] appended owner message to session', target.sessionId);
      return target;
    } catch (err) {
      console.error('[TelegramNotifier] appendOwnerMessageToSession error', err);
      return null;
    }
  }

  getSession(sessionId: string) {
    return sessions.get(sessionId) || null;
  }

  // Add this method to the TelegramNotifier class in lib/telegram.ts
  async notifyVisitorSessionEnded(sessionId: string) {
    try {
      const session = sessions.get(sessionId);
      if (!session) {
        console.warn('[TelegramNotifier] Cannot notify visitor - session not found:', sessionId);
        return false;
      }

      // Broadcast a special end session event to all connected clients
      await safeBroadcastSessionUpdate(sessionId, { 
        ...session, 
        _meta: { 
          event: "session_ended",
          endedAt: Date.now(),
          endedBy: session.endedBy,
          message: "The expert has ended the live chat session. You can continue chatting with the AI assistant."
        } 
      });
      
      console.log('[TelegramNotifier] Notified visitor that session ended:', sessionId);
      return true;
    } catch (error) {
      console.error('[TelegramNotifier] Error notifying visitor:', error);
      return false;
    }
  }
}