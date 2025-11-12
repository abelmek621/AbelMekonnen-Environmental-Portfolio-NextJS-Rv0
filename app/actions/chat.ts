// app/actions/chat.ts
"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { TelegramNotifier, shouldEscalateToHuman, generateSessionId, sessions, getSession, saveSession } from "@/lib/telegram";
// import { TelegramNotifier, shouldEscalateToHuman, generateSessionId, getSession, saveSession } from '@/lib/telegram';
import { triggerWorkflow } from "@/lib/qstash";
// import { TelegramNotifier, shouldEscalateToHuman, generateSessionId, sessions } from '@/lib/telegram';

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

export interface ChatResult {
  response: string;
  error?: string;
  escalated?: boolean;
  sessionId?: string;
  forwarded?: boolean; // true when message forwarded to owner
}

export async function chat(
  message: string,
  userData?: { name?: string; email?: string; currentPage?: string; sessionId?: string }
): Promise<ChatResult> {
  try {
    if (!message?.trim()) {
      return {
        response:
          "Please ask me a question about the environmental consultant's expertise, services, or projects.",
      };
    }

    // 1) If this message should escalate and user didn't already pass a session -> create session + notify owner
    if (shouldEscalateToHuman(message)) {
      console.log("🚨 User requested human support - creating session & triggering workflow");

      // create a sessionId immediately (client will poll for it)
      const sessionId = generateSessionId();

      // create session object *and save immediately* so client polling sees it
      const sessionObj = {
        sessionId,
        visitorName: userData?.name || "Website Visitor",
        email: userData?.email || "not-provided",
        pageUrl: userData?.currentPage || "unknown",
        message,
        createdAt: Date.now(),
        accepted: false,
        acceptedBy: null,
        ownerMessages: [],
        userMessages: [],
        lastActivityAt: Date.now(),
      };

      // Build payload to send to workflow
      const wfPayload = {
        sessionId,
        visitorName: userData?.name || "Website Visitor",
        message,
        pageUrl: userData?.currentPage || "unknown",
        email: userData?.email || "not-provided",
      };

      // best-effort: save it (to in-memory map and Upstash if configured)
      try {
        await saveSession(sessionObj);
      } catch (e) {
        console.warn("[chat] initial saveSession failed (non-fatal)", e);
      }

      // then trigger workflow / fallback to Telegram
      try {
        const triggerResult = await triggerWorkflow(wfPayload, "/api/workflow");
        // ...
      } catch (err) {
        // fallback notify via Telegram notifier (already in your code)
      }
      
      try {
        // trigger workflow (QStash) — non-blocking network but we await trigger call
        const triggerResult = await triggerWorkflow(wfPayload, "/api/workflow");
        console.log("[chat] workflow triggered", triggerResult?.workflowRunId);
        return {
          response: "I've just sent a notification to our environmental expert! They will join this chat shortly to provide personalized assistance. In the meantime, is there anything specific I can help with?",
          escalated: true,
          sessionId,
        };
      } catch (err) {
        console.error("[chat] workflow trigger failed, falling back to direct notify:", err);
        // Optional: fallback to existing TelegramNotifier if workflow fails
        try {
          const telegram = new TelegramNotifier(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_ADMIN_CHAT_ID);
          const result = await telegram.sendLiveChatRequest({
            sessionId,
            visitorName: userData?.name || "Website Visitor",
            message,
            pageUrl: userData?.currentPage || "unknown",
            email: userData?.email || "not-provided",
          });
          if (result.success) {
            return {
              response: "I've just sent a notification to our environmental expert! They will join this chat shortly to provide personalized assistance. In the meantime, is there anything specific I can help with?",
              escalated: true,
              sessionId,
            };
          }
        } catch (e) {
          console.error("[chat] fallback notifier failed:", e);
        }
        // If everything fails, continue with AI processing instead of crash
        console.warn("[chat] escalation failed - continuing with AI response");
      }
    }

    // 2) If the client supplied a sessionId, check session state and forward to owner if accepted
    const sid = userData?.sessionId;
    if (sid) {
      try {
        const sess = await getSession(String(sid));
        if (sess && sess.accepted && sess.acceptedBy?.telegramChatId) {
          // Forward to owner
          const telegram = new TelegramNotifier(process.env.TELEGRAM_BOT_TOKEN, process.env.TELEGRAM_ADMIN_CHAT_ID);
          const ownerChatId = String(sess.acceptedBy.telegramChatId);
          const visitorName = userData?.name || sess.visitorName || "Website Visitor";
          const payloadText = `💬 Message from ${visitorName} (session: ${sid}):\n\n${message}`;

          try {
            await telegram.sendMessage(ownerChatId, payloadText);
            // append to session userMessages and save
            sess.userMessages = sess.userMessages || [];
            sess.userMessages.push({ text: message, at: Date.now(), name: visitorName });
            sess.lastActivityAt = Date.now();
            await saveSession(sess);

            return {
              response: "Your message was forwarded to the expert. They will reply via Telegram shortly.",
              forwarded: true,
              escalated: true,
              sessionId: sid,
            };
          } catch (sendErr) {
            console.warn("[chat] forwarding to owner failed:", sendErr);
            // proceed to try AI as fallback
          }
        }
      } catch (e) {
        console.warn("[chat] session forward check failed", e);
        // fall through to AI processing
      }
    }

    // 3) Normal AI processing (call model)
    async function callModel(modelId: string) {
      return generateText({
        model: groq(modelId),
        system: portfolioContext,
        prompt: message,
        temperature: 0.7,
      });
    }

    try {
      console.log("[chat] using GROQ model:", DEFAULT_MODEL);
      const { text } = await callModel(DEFAULT_MODEL);
      return { response: text };
    } catch (err: any) {
      console.warn("[chat] model call failed:", err?.message ?? err);
      const msg = String(err?.message ?? "");
      if (msg.includes("model_decommissioned") || msg.includes("decommissioned")) {
        try {
          console.log("[chat] retrying with fallback model:", FALLBACK_MODEL);
          const { text } = await callModel(FALLBACK_MODEL);
          return { response: text };
        } catch (err2: any) {
          console.error("[chat] fallback model also failed:", err2);
          throw err2;
        }
      }
      throw err;
    }
  } catch (error: any) {
    console.error("[v0] Chat error:", error);
    return {
      response:
        "I apologize, but I'm having trouble responding right now. Please try again or contact the expert directly.",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
