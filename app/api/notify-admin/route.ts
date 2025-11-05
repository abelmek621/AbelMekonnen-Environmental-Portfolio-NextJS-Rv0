import { NextResponse } from 'next/server';
import { TelegramNotifier } from '@/lib/telegram';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { visitorName, message, pageUrl, email, sessionId } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const telegram = new TelegramNotifier(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_ADMIN_CHAT_ID);
    
    const result = await telegram.sendLiveChatRequest({
      visitorName,
      message,
      pageUrl,
      email,
      sessionId
    });

    if (result.success) {
      return NextResponse.json({
        status: 'success',
        message: 'Notification sent to admin',
        sessionId: result.sessionId,
        messageId: result.messageId
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send notification', details: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in notify-admin API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}