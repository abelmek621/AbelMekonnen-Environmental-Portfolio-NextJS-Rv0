// app/api/set-webhook/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return NextResponse.json({ 
        error: "TELEGRAM_BOT_TOKEN not found in environment variables" 
      }, { status: 500 });
    }

    // Get the webhook URL - use Vercel URL for production, localhost for development
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    
    const webhookUrl = `${baseUrl}/api/telegram-webhook`;
    
    console.log(`Setting webhook to: ${webhookUrl}`);

    // Set the webhook via Telegram API
    const telegramUrl = `https://api.telegram.org/bot${botToken}/setWebhook`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true
      }),
    });

    const result = await response.json();
    
    if (result.ok) {
      return NextResponse.json({
        success: true,
        message: "Webhook set successfully!",
        webhookUrl,
        result
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.description,
        webhookUrl,
        result
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Webhook setup error:", error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}

// Also add a method to get webhook info
export async function POST(request: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return NextResponse.json({ 
        error: "TELEGRAM_BOT_TOKEN not found" 
      }, { status: 500 });
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/getWebhookInfo`;
    const response = await fetch(telegramUrl);
    const result = await response.json();

    return NextResponse.json({
      webhookInfo: result
    });
  } catch (error: any) {
    console.error("Webhook info error:", error);
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}
