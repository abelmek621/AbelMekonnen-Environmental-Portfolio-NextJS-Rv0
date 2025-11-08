// app/api/telegram-webhook/route.ts
import { NextResponse } from "next/server";
import { TelegramNotifier } from "@/lib/telegram";

const notifier = new TelegramNotifier(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_ADMIN_CHAT_ID);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[webhook] received update:', JSON.stringify(body, null, 2));

    // Handle callback queries (button clicks)
    if (body.callback_query) {
      const { id, from, data, message } = body.callback_query;
      console.log(`[webhook] handling callback: ${data} from ${from.id}`);
      
      const result = await notifier.handleCallbackQuery({
        id,
        from,
        data,
        message
      });
      
      if (result.handled) {
        return NextResponse.json({ ok: true });
      }
    }

    // Handle regular messages from owner
    if (body.message && body.message.text) {
      const { chat, message_id, text, reply_to_message } = body.message;
      console.log(`[webhook] message from ${chat.id}: ${text}`);
      
      // Check if this is a reply to a force_reply message
      if (reply_to_message) {
        const session = notifier.appendOwnerMessageToSession(
          String(chat.id),
          text,
          reply_to_message.message_id
        );
        
        if (session) {
          return NextResponse.json({ ok: true, session: session.sessionId });
        }
      }
      
      // Try to append to any recent session for this owner
      const session = notifier.appendOwnerMessageToSession(
        String(chat.id),
        text,
        null
      );
      
      if (session) {
        return NextResponse.json({ ok: true, session: session.sessionId });
      }
    }

    return NextResponse.json({ ok: true, handled: false });
  } catch (error) {
    console.error('[webhook] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
