// app/api/telegram-webhook/route.ts
import { NextResponse } from "next/server";
import { TelegramBot } from "@/lib/telegram";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📱 Webhook received:", JSON.stringify(body, null, 2));

    const bot = new TelegramBot();

    if (body.callback_query) {
      await bot.handleCallback(body.callback_query);
    }

    return new Response("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response("Error", { status: 500 });
  }
}

export async function GET() {
  return new Response("Telegram webhook is running ✅");
}
