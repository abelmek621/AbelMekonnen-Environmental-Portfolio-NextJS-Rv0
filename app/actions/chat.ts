// app/actions/chat.ts
"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

import { TelegramNotifier, shouldEscalateToHuman, generateSessionId, sessions } from '@/lib/telegram';

const portfolioContext = `
You are an AI assistant for an Environmental Consultant's portfolio website. You have access to the following information about the expert:

ABOUT:
- Name: Environmental Expert
- Experience: 10+ years in Environmental Consultancy
- Specializations: Hydrology, Air Quality & Noise Assessment, GIS & Remote Sensing
- Background: Dedicated environmental professional with extensive expertise across multiple disciplines
- Approach: Combines technical expertise with practical solutions for environmental challenges

AREAS OF EXPERTISE:
1. Hydrologist
   - Water resource management, flood risk assessment, watershed analysis, hydrological modeling
   - Key Skills: Watershed Analysis, Flood Risk Assessment, Water Quality Monitoring, Hydrological Modeling

2. Air Quality & Noise Specialist
   - Environmental impact assessment, air pollution monitoring, noise level analysis, regulatory compliance
   - Key Skills: Air Pollution Monitoring, Noise Impact Assessment, Environmental Impact Studies, Regulatory Compliance

3. GIS & Remote Sensing Expert
   - Spatial analysis, satellite imagery interpretation, environmental mapping, geospatial data management
   - Key Skills: Spatial Analysis, Satellite Imagery, Environmental Mapping, Geospatial Data Management

SERVICES OFFERED:
1. Environmental Impact Assessment - Comprehensive EIA studies for development projects
2. Regulatory Compliance - Expert guidance on environmental regulations and permitting
3. Consulting & Advisory - Strategic environmental consulting for businesses and agencies
4. Data Analysis & Modeling - Advanced data analysis, environmental modeling, and geospatial solutions

PORTFOLIO PROJECTS:
1. Urban Watershed Management - Comprehensive watershed analysis and flood risk assessment (40% flood risk reduction)
2. Industrial Air Quality Assessment - Multi-site air quality monitoring and noise impact assessment
3. Regional Environmental Mapping - Large-scale environmental mapping using satellite imagery (10,000+ hectares)
4. Coastal Erosion Study - Coastal vulnerability assessment and erosion modeling (50km coastline protected)
5. Mining Environmental Impact - Comprehensive environmental impact assessment for mining operations
6. Forest Change Detection - Multi-temporal satellite analysis for forest change detection (50,000+ hectares monitored)

CONTACT INFORMATION:
- Email: mekonnengebretsadikabel@gmail.com
- Phone: +251 983 342 040
- LinkedIn: Available on LinkedIn
- Location: Available Worldwide

You are helpful, professional, and knowledgeable. Answer questions about the expert's background, expertise, services, and projects. 
If asked about contact information, provide the email and phone number.
If asked something not related to the portfolio, politely redirect the conversation back to the expert's services and expertise.
Keep responses concise and professional.
`

const DEFAULT_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || "llama-3.1-8b-instant";

// simple escalate detector (you already have shouldEscalateToHuman in your code — keep it)
/* function shouldEscalateToHuman(message: string) {
  const triggers = ["human", "agent", "expert", "speak to", "talk to", "connect me", "connect with", "person"];
  const m = (message || "").toLowerCase();
  return triggers.some((t) => m.includes(t));
} */

export interface ChatResult {
  response: string;
  error?: string;
  escalated?: boolean;
  sessionId?: string;
  forwarded?: boolean; // whether forwarded to owner
}

export async function chat(
  message: string,
  userData?: { name?: string; email?: string; currentPage?: string; sessionId?: string }
): Promise<ChatResult> {
  try {
    if (!message?.trim()) {
      return {
        response: "Please ask me a question about the environmental consultant's expertise, services, or projects.",
      }
    }
    // ==== NEW: If user is in an accepted live-chat session, forward to owner and DO NOT call AI ====
    const sid = userData?.sessionId;
    if (sid) {
      try {
        const sess = sessions.get(String(sid));
        if (sess && sess.accepted && sess.acceptedBy?.telegramChatId) {
          // Forward the visitor message to the owner on Telegram
          const notifier = new TelegramNotifier(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_ADMIN_CHAT_ID);
          const ownerChatId = String(sess.acceptedBy.telegramChatId);
          const visitorName = userData?.name || sess.visitorName || 'Website Visitor';
          const payloadText = `💬 Message from ${visitorName} (session: ${sid}):\n\n${message}`;

          try {
            await notifier.sendMessage(ownerChatId, payloadText);
            // Append to session.userMessages so both sides see the message
            sess.userMessages = sess.userMessages || [];
            sess.userMessages.push({ text: message, at: Date.now(), name: visitorName });
            sess.lastActivityAt = Date.now();
            sessions.set(String(sid), sess);

            // Broadcast updated session to SSE listeners (if available)
            try {
              if (typeof (globalThis as any).__broadcastSessionUpdate__ === "function") {
                (globalThis as any).__broadcastSessionUpdate__(String(sid), sess);
              } else {
                // dynamic import fallback (defensive)
                try {
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  const mod = await import("@/app/api/session-events/route");
                  if (mod?.broadcastSessionUpdate) {
                    mod.broadcastSessionUpdate(String(sid), sess);
                  }
                } catch (e) {
                  // ignore - no SSE available
                }
              }
            } catch (e) {
              console.warn("[chat] broadcast attempt failed after forwarding message", e);
            }

            return {
              response: "Your message was forwarded to the expert. They will reply via Telegram shortly.",
              escalated: true,
              sessionId: String(sid),
              forwarded: true,
            };
          } catch (sendErr) {
            console.error("[chat] failed to forward message to owner:", sendErr);
            // Fall through to AI response as a graceful fallback (but inform user)
            return {
              response: "I couldn't forward your message to the expert — I'll try to answer instead.",
              error: sendErr instanceof Error ? sendErr.message : String(sendErr),
            };
          }
        }
      } catch (sessErr) {
        console.warn("[chat] session-forward check failed:", sessErr);
        // continue with normal AI processing
      }
    }

    // If user explicitly asked for a human, escalate BEFORE running model
    if (shouldEscalateToHuman(message)) {
      console.log("🚨 User requested human support - sending Telegram notification");
      try {
        const telegram = new TelegramNotifier(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_ADMIN_CHAT_ID);
        // const sessionId = generateSessionId();
        const notificationResult = await telegram.sendLiveChatRequest({
          visitorName: userData?.name || "Website Visitor",
          message: message,
          pageUrl: userData?.currentPage || "unknown",
          email: userData?.email || "not-provided",
          sessionId: generateSessionId(),
        });

        if (notificationResult.success) {
          return {
            response: "I've just sent a notification to our environmental expert! They will join this chat shortly to provide personalized assistance. In the meantime, is there anything specific about our environmental services I can help with?",
            escalated: true,
            sessionId: notificationResult.sessionId
          };
        } else {
          console.warn('Telegram notification failed, falling back to AI response:', notificationResult.error);
          // Fallthrough to normal AI reply
        }
      } catch (telegramError) {
        console.error('Telegram notify error:', telegramError);
        // Fall through to AI reply
      }
    }
    
    // helper to call generateText with a given model id
    async function callModel(modelId: string) {
      return generateText({
        model: groq(modelId),
        system: portfolioContext,
        prompt: message,
        temperature: 0.7,
        // maxTokens: 500, // uncomment / adjust if needed
      });
    }

    // 1) try configured/default model
    try {
      console.log("[chat] using GROQ model:", DEFAULT_MODEL);
      const { text } = await callModel(DEFAULT_MODEL);
      return { response: text };
    } catch (err: any) {
      console.warn("[chat] model call failed:", err?.message ?? err)
      const msg = String(err?.message ?? "");

      // 2) if it's a decommission error, attempt fallback once
      if (msg.includes("model_decommissioned") || msg.includes("decommissioned")) {
        const { text } = await callModel(FALLBACK_MODEL);
        return { response: text };
      }

      // rethrow non-handled errors
      throw err;
    }
  } catch (error: any) {
    console.error("[chat] error:", error)
    return {
      response:
        "I apologize, but I'm having trouble responding right now. Please try again or contact the expert directly.",
      // error: error instanceof Error ? error.message : "Unknown error",
      error: error?.message || String(error),
    };
  }
}



// Additional function for chat with history (if you need it)
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function sendChatMessage(
  messages: ChatMessage[], 
  userData?: { name?: string; email?: string; currentPage?: string }
): Promise<ChatResult> {
  const latestMessage = messages[messages.length - 1]?.content || '';
  return await chat(latestMessage, userData);
}

// Alternative function for form submissions
export async function handleChatForm(formData: FormData) {
  const message = formData.get('message') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  
  return await chat(message, {
    name: name || undefined,
    email: email || undefined,
    currentPage: typeof window !== 'undefined' ? window.location.href : 'Unknown'
  });
}
