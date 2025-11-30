import { NextRequest } from 'next/server';

// Declare global type for this file
declare global {
  var __broadcastSessionUpdate__: ((sessionId: string, payload: any) => void) | undefined;
}

// Store connected clients
const clients = new Map<string, ReadableStreamDefaultController[]>();

// This is the REAL broadcast function that should be used globally
function broadcastSessionUpdate(sessionId: string, payload: any) {
  const sessionClients = clients.get(sessionId);
  if (sessionClients) {
    const data = `data: ${JSON.stringify(payload)}\n\n`;
    sessionClients.forEach(controller => {
      try {
        controller.enqueue(new TextEncoder().encode(data));
      } catch (e) {
        console.warn('[session-events] failed to send to client:', e);
      }
    });
    console.log(`[session-events] broadcast to ${sessionClients.length} clients for session ${sessionId}`);
  }
}

// Set the global broadcast function - THIS IS CRITICAL
if (typeof global.__broadcastSessionUpdate__ === 'undefined') {
  global.__broadcastSessionUpdate__ = broadcastSessionUpdate;
  console.log('[session-events] Global broadcast function set');
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return new Response('Missing sessionId', { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Add client to the session
      if (!clients.has(sessionId)) {
        clients.set(sessionId, []);
      }
      clients.get(sessionId)!.push(controller);

      // Send initial session state if exists
      const session = sessions.get(sessionId);
      if (session) {
        const data = `data: ${JSON.stringify(session)}\n\n`;
        controller.enqueue(new TextEncoder().encode(data));
      }

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        const sessionClients = clients.get(sessionId);
        if (sessionClients) {
          const index = sessionClients.indexOf(controller);
          if (index > -1) {
            sessionClients.splice(index, 1);
          }
          if (sessionClients.length === 0) {
            clients.delete(sessionId);
          }
        }
        console.log(`[session-events] Client disconnected from session ${sessionId}`);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Import sessions from telegram with proper typing
import { sessions } from '@/lib/telegram';

// Export the broadcast function for direct use if needed
export { broadcastSessionUpdate };
