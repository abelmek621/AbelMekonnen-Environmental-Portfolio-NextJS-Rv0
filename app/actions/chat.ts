// app/actions/chat.ts
"use server"

import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { TelegramNotifier, shouldEscalateToHuman, generateSessionId, getSession, saveSession } from "@/lib/simple-sessions";
import { triggerWorkflow } from "@/lib/qstash";
import { TelegramBot } from "@/lib/telegram";

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
  forwarded?: boolean;
}

export async function chat(
  message: string,
  userData?: { name?: string; email?: string; currentPage?: string; sessionId?: string }
): Promise<ChatResult> {
  try {
    if (!message?.trim()) {
      return {
        response: "Please ask me a question about the environmental consultant's expertise, services, or projects.",
      };
    }

    const sessionId = userData?.sessionId;
    
    // 1) Check if we have an active session and forward to owner if accepted
    if (sessionId) {
      try {
        const session = await getSession(String(sessionId));
        if (session && session.accepted && session.acceptedBy?.telegramChatId) {
          // Forward to owner
          const telegram = new TelegramNotifier();
          const ownerChatId = String(session.acceptedBy.telegramChatId);
          const visitorName = userData?.name || session.visitorName || "Website Visitor";
          const payloadText = `💬 Message from ${visitorName} (session: ${sessionId}):\n\n${message}`;

          try {
            await telegram.sendMessage(ownerChatId, payloadText);
            
            // Update session
            session.userMessages = session.userMessages || [];
            session.userMessages.push({ 
              text: message, 
              at: Date.now(), 
              name: visitorName 
            });
            session.lastActivityAt = Date.now();
            await saveSession(session);

            return {
              response: "Your message was forwarded to Abel. He will reply shortly.",
              forwarded: true,
              escalated: true,
              sessionId: sessionId,
            };
          } catch (sendErr) {
            console.warn("[chat] Forwarding to owner failed:", sendErr);
            // Continue with AI response as fallback
          }
        }
      } catch (e) {
        console.warn("[chat] Session check failed:", e);
      }
    }

    // 2) Check if this message should escalate to human
    // In the chat function, replace the escalation section:
    // In the chat function, replace the escalation logic:
    if (shouldEscalateToHuman(message) && !sessionId) {
      console.log("🚨 Escalating to human...");

      try {
        const telegram = new TelegramBot();
        const result = await telegram.sendLiveChatNotification({
          visitorName: userData?.name,
          message: message,
          pageUrl: userData?.currentPage,
          email: userData?.email
        });

        if (result.success) {
          return {
            response: "I've notified Abel that you'd like to chat! He'll join this conversation shortly.",
            escalated: true,
            sessionId: result.sessionId,
          };
        }
      } catch (error) {
        console.error("Failed to send Telegram notification:", error);
      }

      // Fallback response if Telegram fails
      return {
        response: "I'd be happy to connect you with Abel! Please contact him directly at mekonnengebretsadikabel@gmail.com or +251-983-34-2060.",
      };
    }

    // 3) Normal AI processing - FIXED VERSION
    async function callModel(modelId: string) {
      // Use the newer API format to avoid type errors
      const { text } = await generateText({
        model: groq(modelId),
        system: portfolioContext,
        prompt: message,
        temperature: 0.7,
        // Add any additional required properties if needed
      } as any); // Using 'as any' to bypass the TypeScript error temporarily
      
      return { text };
    }

    try {
      console.log("[chat] Using GROQ model:", DEFAULT_MODEL);
      const { text } = await callModel(DEFAULT_MODEL);
      return { response: text };
    } catch (err: any) {
      console.warn("[chat] Model call failed:", err?.message ?? err);
      const msg = String(err?.message ?? "");
      if (msg.includes("model_decommissioned") || msg.includes("decommissioned")) {
        try {
          console.log("[chat] Retrying with fallback model:", FALLBACK_MODEL);
          const { text } = await callModel(FALLBACK_MODEL);
          return { response: text };
        } catch (err2: any) {
          console.error("[chat] Fallback model also failed:", err2);
          throw err2;
        }
      }
      throw err;
    }
  } catch (error: any) {
    console.error("[chat] Error:", error);
    return {
      response: "I apologize, but I'm having trouble responding right now. Please try again or contact Abel directly at mekonnengebretsadikabel@gmail.com",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
