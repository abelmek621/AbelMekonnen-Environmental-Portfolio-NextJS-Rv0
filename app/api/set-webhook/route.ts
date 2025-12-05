import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const webhookUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/telegram-webhook`;
    
    if (!botToken) {
      return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
    }

    const url = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;
    
    const response = await fetch(url);
    const result = await response.json();
    
    return NextResponse.json({
      success: result.ok,
      webhookUrl,
      result
    });
  } catch (error: any) {
    console.error("Webhook setup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
