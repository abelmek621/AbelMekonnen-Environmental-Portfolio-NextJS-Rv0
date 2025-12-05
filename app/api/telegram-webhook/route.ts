import { NextResponse } from "next/server";
import { TelegramNotifier } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[webhook] Received update:", JSON.stringify(body, null, 2));

    const notifier = new TelegramNotifier();

    // Handle callback queries (button clicks)
    if (body.callback_query) {
      const cq = body.callback_query;
      console.log("[webhook] Handling callback query:", cq.data);
      
      await notifier.handleCallbackQuery({
        id: cq.id,
        from: cq.from,
        data: cq.data,
        message: cq.message
      });
      
      return new Response("OK");
    }

    // Handle regular messages
    if (body.message) {
      const msg = body.message;
      const chatId = msg.chat?.id;
      const text = msg.text || "";
      const replyToMessageId = msg.reply_to_message?.message_id;
      
      console.log(`[webhook] Message from ${chatId}: "${text}" (reply_to: ${replyToMessageId})`);

      // Ignore messages from groups or channels
      if (msg.chat?.type !== "private") {
        console.log("[webhook] Ignoring non-private chat message");
        return new Response("OK");
      }

      // Handle owner messages (reply to bot messages)
      if (replyToMessageId || text) {
        const appended = await notifier.appendOwnerMessageToSession(
          String(chatId), 
          text, 
          replyToMessageId
        );
        
        if (appended) {
          console.log(`[webhook] Owner message appended to session ${appended.sessionId}`);
        } else {
          console.log("[webhook] Could not map owner message to session");
          
          // Send help message if we can't find a session
          try {
            await notifier.sendMessage(
              String(chatId),
              "I couldn't find an active chat session. Please use the 'Join Chat' button on a live chat request to start chatting with a visitor."
            );
          } catch (e) {
            console.error("[webhook] Failed to send help message:", e);
          }
        }
      }

      return new Response("OK");
    }

    console.log("[webhook] No actionable update received");
    return new Response("OK");
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Add GET handler for webhook verification (optional)
export async function GET(request: Request) {
  return new Response("Telegram webhook is running", { status: 200 });
}
