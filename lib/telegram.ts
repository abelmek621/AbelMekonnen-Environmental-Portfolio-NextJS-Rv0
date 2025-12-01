// lib/telegram.ts
import { createSession, getSession, updateSession } from "./simple-sessions";

export class TelegramBot {
  private botToken: string;
  private adminChatId: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN!;
    this.adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID!;
    
    if (!this.botToken || !this.adminChatId) {
      throw new Error("Telegram credentials missing");
    }
  }

  async sendMessage(chatId: string, text: string, options?: any) {
    const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        ...options
      }),
    });

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.description || "Telegram API error");
    }
    return result;
  }

  async sendLiveChatNotification(data: {
    visitorName?: string;
    message: string;
    pageUrl?: string;
    email?: string;
  }) {
    // Create session first
    const sessionId = await createSession(data);
    
    const message = `
📩 *New Live Chat Request*

👤 *From:* ${data.visitorName || "Website Visitor"}
📧 *Email:* ${data.email || "Not provided"}  
🌐 *Page:* ${data.pageUrl || "Unknown"}

💬 *Message:*
${data.message}

🆔 *Session ID:* \`${sessionId}\`
    `.trim();

    const keyboard = {
      inline_keyboard: [[
        { text: "✅ Join Chat", callback_data: `join:${sessionId}` },
        { text: "❌ Decline", callback_data: `decline:${sessionId}` }
      ]]
    };

    await this.sendMessage(this.adminChatId, message, {
      reply_markup: keyboard
    });

    return { success: true, sessionId };
  }

  async handleCallback(callbackQuery: {
    id: string;
    from: { id: number; first_name?: string; username?: string };
    data: string;
  }) {
    const [action, sessionId] = callbackQuery.data.split(":");
    
    if (!sessionId) {
      await this.answerCallback(callbackQuery.id, "Invalid request");
      return;
    }

    const session = await getSession(sessionId);
    if (!session) {
      await this.answerCallback(callbackQuery.id, "Session expired or not found");
      return;
    }

    if (action === "join") {
      // Update session with owner info
      const updated = await updateSession(sessionId, {
        accepted: true,
        acceptedBy: {
          telegramChatId: String(callbackQuery.from.id),
          name: callbackQuery.from.first_name || callbackQuery.from.username || "Admin",
          joinedAt: Math.floor(Date.now() / 1000)
        }
      });

      if (updated) {
        await this.answerCallback(callbackQuery.id, "You joined the chat! Reply here to talk to the visitor.");
        
        // Send welcome message to owner
        await this.sendMessage(
          String(callbackQuery.from.id),
          `✅ You're now chatting with ${session.visitorName}\n\nTheir message: "${session.message}"\n\nJust reply to this chat to continue.`
        );
      } else {
        await this.answerCallback(callbackQuery.id, "Failed to join chat");
      }
    } else if (action === "decline") {
      await this.answerCallback(callbackQuery.id, "Chat request declined");
    }
  }

  private async answerCallback(callbackId: string, text: string) {
    const url = `https://api.telegram.org/bot${this.botToken}/answerCallbackQuery`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackId,
        text: text
      }),
    });
  }
}
