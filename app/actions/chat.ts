// app/actions/chat.ts
"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

import { TelegramNotifier, shouldEscalateToHuman, generateSessionId, sessions } from '@/lib/telegram';

const portfolioContext = `
You are an AI assistant for an Abel Mekonnen's portfolio website. Abel Mekonnen is Senior Environmental Expert. You have access to the following information about the expert, Abel Mekonnen:

ABOUT /Detail Information/:
- Name: Abel Mekonnen
- Full Name: Abel Mekonnen Gebretsadik 
- Title: Senior Environmental Consultant
- Experience: 10+ years in Environmental Consultancy - ESIA, ESG, RAP, Environmental Monitoring, and Environmental Audit Studies
- Specializations: Hydrology, Air Quality & Noise Assessment, GIS & Remote Sensing
- Background: Dedicated environmental professional with extensive expertise across multiple disciplines
- Approach: Combines technical expertise with practical solutions for environmental studies and connsultation
- Resume (Link): 

LIST OF AREAS OF EXPERTISE:
1. Hydrologist /Water & Energy Use Expert/
2. Air Quality & Noise Specialist /Environmental Pollution Analyst/
3. GIS & Remote Sensing Expert

AREAS OF EXPERTISE:
1. Hydrologist /Water & Energy Use Expert/
   - hydrological modeling, Water resource management, flood risk assessment, watershed analysis
   - Key Skills: Hydrological Modeling, Water Quality Monitoring, Watershed Analysis, Flood Risk Assessment

2. Air Quality & Noise Specialist /Environmental Pollution Analyst/
   - Environmental impact assessment, air pollution monitoring, noise level analysis, regulatory compliance
   - Key Skills: Environmental Impact Studies,, Noise Impact Assessment, Air Pollution Monitoring, Regulatory Compliance

3. GIS & Remote Sensing Expert
   - environmental mapping, Spatial analysis, satellite imagery interpretation, geospatial data management
   - Key Skills: Spatial Analysis, Satellite Imagery, Environmental Mapping, Geospatial Data Management

SERVICES OFFERED:
1. Environmental Impact Assessment - Comprehensive EIA studies for development projects
2. Consulting & Advisory - Strategic environmental consulting for businesses and agencies
3. Data Analysis & Modeling - Advanced data analysis, environmental modeling, and geospatial solutions
4. Regulatory Compliance - Expert guidance on environmental regulations and permitting

PORTFOLIO PROJECTS:
1. Mining & Oil Exploration - Comprehensive environmental impact assessment including hydrogeological baseline studies, air quality, noise, and dust monitoring (minimized environmental impact)
2. Wind Power & Geothermal Energy - Air-quality and noise impact modelling, construction and operational air emissions, and mitigation design for sustainable power development (assessed/modelled impacts & optimized siting)
3. Transmission Lines & Substations - Route selection and corridor impact assessment using GIS-based constraints mapping, habitat and land-use analysis, EMF and erosion considerations (minimized habitat fragmentation & optimized routing)
4. Environmental Audit & ESG - Corporate environmental audits and ESG gap analysis, including water-use audits, compliance reviews, and actionable roadmap to improve sustainability (improved ESG performance & closed key compliance gaps)
5. LULC & Constarints Mapping - High-resolution land use / land cover mapping and constraints analysis (floodplains, protected areas, steep slopes) using multi-source satellite imagery (delivered decision-ready maps that avoid high-risk areas/streamline permitting)
6. Environmental Monitoring & EMS - Design and implementation of environmental monitoring programs and EMS: air, water and noise monitoring networks, data management and automated reporting to support compliance and continuous improvement (implemented EMS & reduced incident response times)

CONTACT INFORMATION:
- Email: mekonnengebretsadikabel@gmail.com
- Phone: +251-983-34-2060
- LinkedIn: Available on LinkedIn
- Location: Addis Ababa, Ethiopia

You are helpful, professional, and knowledgeable. Answer questions about the Abel's background, list of area of expertise, area of expertise, services, and projects.
If asked about expert's detail, provide the detail information.
If asked about expert's background, provide the beckground.
If asked about expert's expertise, provide the areas of expertise.
If asked about expert's services, provide the services.
If asked about expert's projects, provide the portfolio projects.
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
            response: "I've just sent a notification to Abel! He will join this chat shortly to provide personalized assistance. In the meantime, is there anything specific about Abel's environmental services I can help with?",
            escalated: true,
            sessionId: notificationResult.sessionId
          };
        } else {
          console.warn('Telegram notification failed, falling back to AI response:', notificationResult.error);
          // Fallthrough to normal AI reply
          return { response: "Abel is not available for a moment, please send him e-mail or ask me your question" };
        }
      } catch (telegramError) {
        console.error('Telegram notify error:', telegramError);
        // Fall through to AI reply
        return { response: "Abel is not available for a moment, please send him e-mail or ask me your question" };
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
