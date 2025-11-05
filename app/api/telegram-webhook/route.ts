// app/api/telegram-webhook/route.ts
import { NextResponse } from "next/server";
import { TelegramNotifier, sessions } from "@/lib/telegram";

const notifier = new TelegramNotifier(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_ADMIN_CHAT_ID);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.callback_query) {
      const cq = body.callback_query;
      console.log("[webhook] received callback_query", cq.data);
      await notifier.handleCallbackQuery({
        id: cq.id,
        from: cq.from,
        data: cq.data,
        message: cq.message,
      });
      return new Response("OK");
    }

    if (body.message) {
      const msg = body.message;
      const chatId = msg.chat?.id;
      const text = msg.text || "";
      const replyToMessageId = msg.reply_to_message?.message_id || null;

      console.log("[webhook] received message from", chatId, "text:", text, "reply_to:", replyToMessageId);

      // append owner message to the right session (appendOwnerMessageToSession will broadcast)
      const appended = notifier.appendOwnerMessageToSession(String(chatId), text, replyToMessageId);
      if (appended) {
        console.log("[webhook] owner message appended to session", appended.sessionId);
      } else {
        console.log("[webhook] owner message could not be mapped to a session");
      }

      return new Response("OK");
    }

    return new Response("No actionable update", { status: 200 });
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// helper for debugging / admin usage
export function getActiveSessions() {
  return Array.from(sessions.entries()).map(([id, data]) => ({
    id,
    ...data,
  }));
}
