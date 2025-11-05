import { config } from 'dotenv';

// Load environment variables from .env
config({ path: '.env' });

async function setWebhook() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  // pass public URL as argv[2] if you want: npx tsx scripts/set-telegram-webhook.ts https://abc..cloudflare.com
  // const providedUrl = process.argv[2];
  // const base = providedUrl || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  // const webhookUrl = `${base?.replace(/\/$/, "")}/api/telegram-webhook`;
  const arg = process.argv[2] || "";
  const base = arg || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  if (!botToken) {
    console.error('❌ TELEGRAM_BOT_TOKEN required in env');
    process.exit(1);
  }

  if (!base) {
    console.error("❌ No base url provided. Pass cloudflared/ngrok url as argument or set NEXT_PUBLIC_BASE_URL / NEXTAUTH_URL in .env");
    // console.log("Usage: npx tsx scripts/set-telegram-webhook.ts https://your-public-url");
    process.exit(1);
  }

  // If user passed a URL that already contains the webhook path, use it as-is
  let webhookUrl = base;
  if (!webhookUrl.endsWith("/api/telegram-webhook")) {
    webhookUrl = webhookUrl.replace(/\/$/, "") + "/api/telegram-webhook";
  }

  // console.log(`🔧 Setting Telegram webhook to: ${webhookUrl}`);
  
  try {
    console.log("Setting webhook to:", webhookUrl);
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl }),
    });

    const data = await res.json();
    
    if (data.ok) {
      console.log('✅ Webhook set successfully!');
      // console.log('📊 Webhook info:');
      // console.log(`   - URL: ${data.result.url}`);
      // console.log(`   - Has custom certificate: ${data.result.has_custom_certificate}`);
      // console.log(`   - Pending updates: ${data.result.pending_update_count}`);
    } else {
      console.error("❌ Failed setWebhook:", data.description || JSON.stringify(data));
    }
  } catch (err: any) {
    console.error("Error setting webhook:", err.message || err);
  }
}

setWebhook();