"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { X, Send, User, AlertCircle } from "lucide-react"
import { chat } from "@/app/actions/chat"
import Image from "next/image"

interface Message {
  id: string
  text: string
  sender: "user" | "bot" | "owner"
  timestamp: Date
  escalated?: boolean
}

function RotatingGlobe() {
  return (
    <Image
      src="/globe-design-3.png"
      alt="Environmental Globe"
      width={62}
      height={62}
      className="h-8 w-8 sm:h-14 sm:w-14 animate-spin-slow"
    />
  )
}

const POLL_INTERVAL_MS = 3000
const FETCH_TIMEOUT_MS = 20000 // 20s timeout for each poll
const ESCALATION_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
const MAX_CONSECUTIVE_FAILURES = 5

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [showForwardToast, setShowForwardToast] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm an AI assistant for Abel's portfolio. Ask me anything about his services, projects, and how to get in touch. You can also request for LIVE Chat with him!",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [waitingForHuman, setWaitingForHuman] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionAccepted, setSessionAccepted] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // polling control
  const runningRef = useRef(false)
  const lastOwnerIndexRef = useRef<number>(0)
  const escalationStartedAt = useRef<number | null>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    return () => {
      stopPolling()
      stopSSE()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isOpen) {
      stopPolling()
      stopSSE()
      setWaitingForHuman(false)
      setSessionId(null)
      setSessionAccepted(false)
    }
  }, [isOpen])

  // SSE helpers
  function startSSE(sid: string) {
    try {
      stopSSE();
      console.info("[client] starting SSE for session", sid);
      const url = `/api/session-events?sessionId=${encodeURIComponent(sid)}`
      const es = new EventSource(url)
      es.onopen = () => {
        console.info("[client] SSE connection opened for session", sid);
      };
      es.onmessage = (ev) => {
        console.info("[client] SSE raw message:", ev.data);
        try {
          const data = JSON.parse(ev.data)
          // data shapes: { type: 'init'|'session_update', session: { ... } }
          // append ownerMessages if present
          const sess = data.session
          // If we get an 'init' payload it may contain ownerMessages already
          if (sess?.ownerMessages) {
            const ownerMessages = sess.ownerMessages as { text: string; at: number }[]
            const last = lastOwnerIndexRef.current || 0
            if (ownerMessages.length > last) {
              const newMsgs = ownerMessages.slice(last);
              console.info("[client] SSE new owner messages count:", newMsgs.length);
              newMsgs.forEach((om) => {
                const m: Message = {
                  id: `owner_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                  text: om.text,
                  sender: "owner",
                  timestamp: new Date(om.at),
                }
                setMessages((prev) => [...prev, m])
              })
              lastOwnerIndexRef.current = ownerMessages.length
            }
          }
          if (data?.type === "session_update" || data?.type === "init") {
            // detect accepted meta if present
            if (sess?.accepted) {
              setSessionAccepted(true)
              setWaitingForHuman(false)
            }
          }
        } catch (err) {
          console.error("[client] SSE parse error", err);
        }
      };
      es.onerror = (err) => {
        console.warn("[client] SSE error for session", sid, err);
        // EventSource auto-reconnects; consider fallback to polling
      }
      esRef.current = es;
    } catch (err) {
      console.error("[client] startSSE error", err);
    }
  }

  function stopSSE() {
    if (esRef.current) {
      try {
        esRef.current.close()
      } catch (e) {}
      esRef.current = null
    }
  }

  // Polling loop (fallback) - non-overlapping
  function startPolling(sid: string) {
    if (!sid) {
      console.warn("[poll] startPolling called with empty sid:", sid)
      return
    }

    // start SSE as primary method
    startSSE(sid)

    // stop any existing polling
    stopPolling()
    runningRef.current = true
    escalationStartedAt.current = Date.now()
    lastOwnerIndexRef.current = 0
    let failures = 0

    ;(async () => {
      while (runningRef.current) {
        try {
          const controller = new AbortController()
          const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
          const res = await fetch(`/api/session-status?sessionId=${encodeURIComponent(sid)}`, {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          })
          clearTimeout(timer)

          if (!res.ok) {
            console.warn(`[poll] session-status non-ok (${res.status}) for sid=${sid}`)
            failures++
          } else {
            failures = 0
            const payload = await res.json().catch((e) => {
              console.error("[poll] failed to parse session-status JSON:", e)
              return null
            })
            if (payload) {
              if (payload.status === "accepted") {
                if (!sessionAccepted) setSessionAccepted(true)
                setWaitingForHuman(false)

                const ownerMessages: { text: string; at: number }[] = payload.session?.ownerMessages || []
                const last = lastOwnerIndexRef.current || 0
                if (ownerMessages.length > last) {
                  const newMsgs = ownerMessages.slice(last)
                  newMsgs.forEach((om) => {
                    const m: Message = {
                      id: `owner_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
                      text: om.text,
                      sender: "owner",
                      timestamp: new Date(om.at),
                    }
                    setMessages((prev) => [...prev, m])
                  })
                  lastOwnerIndexRef.current = ownerMessages.length
                }
              } else if (payload.status === "pending") {
                const started = escalationStartedAt.current || 0
                if (Date.now() - started > ESCALATION_TIMEOUT_MS) {
                  console.info("[poll] escalation timeout for sid:", sid)
                  stopPolling()
                  stopSSE()
                  setWaitingForHuman(false)
                  setSessionId(null)
                  setSessionAccepted(false)
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `escalation_timeout_${Date.now()}`,
                      text:
                        "The expert hasn't joined yet. We'll send you an appointment email and the expert will contact you shortly.",
                      sender: "bot",
                      timestamp: new Date(),
                    },
                  ])
                  // appointment fallback
                  fetch("/api/contact/appointment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: "Website Visitor",
                      email: "not-provided",
                      message: "Visitor requested human chat but expert did not join in time.",
                    }),
                  }).catch(() => {})
                }
              } else if (payload.status === "not_found") {
                // ignore
              }
            }
          }
        } catch (err: any) {
          if (err?.name === "AbortError") {
            console.warn("[poll] fetch aborted (timeout) for sid:", sid)
          } else {
            console.error("[poll] unexpected fetch error for sid:", sid, err)
          }
          failures++
        }

        if (failures >= MAX_CONSECUTIVE_FAILURES) {
          console.error("[poll] too many consecutive failures — stopping polling for", sid)
          runningRef.current = false
          break
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
      }
    })()
  }

  function stopPolling() {
    runningRef.current = false
  }

  // send visitor messages to owner when accepted
  async function sendToOwnerIfAccepted(sid: string | null, text: string) {
    if (!sid) return false;
    try {
      const res = await fetch("/api/send-to-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid, text }),
      });
      if (!res.ok) {
        console.warn("send-to-owner returned non-ok:", res.status);
        return false;
      }
      const body = await res.json().catch(() => ({}));
      if (body && body.success) {
        return true;
      } else {
        console.warn("send-to-owner responded:", body);
        return false;
      }
    } catch (e) {
      console.warn("send-to-owner failed", e);
      return false;
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    const toSend = input
    setInput("")
    setIsLoading(true)
    try {
      const userData = {
        name: "Website Visitor",
        currentPage: typeof window !== "undefined" ? window.location.href : "Unknown",
        sessionId: sessionId || undefined, // provide sessionId to server if available
      };

      // IMPORTANT: if live chat is accepted, forward to owner and DO NOT call AI.
    if (sessionAccepted && sessionId) {
      const forwarded = await sendToOwnerIfAccepted(sessionId, toSend);
      if (forwarded) {
        // show a soft confirmation message from "bot"
        /* const confirmMsg: Message = {
          id: `forwarded_${Date.now()}`,
          text: "Your message was forwarded to the expert. They will reply via Telegram shortly.",
          sender: "bot",
          timestamp: new Date(),
        }; */
        // show ephemeral toast for 2.5s
        setShowForwardToast(true);
        setTimeout(() => setShowForwardToast(false), 2500);
        // setMessages((prev) => [...prev, confirmMsg]);
      } else {
        // forwarding failed — fall back to AI so user still gets help
        const fallbackMsg: Message = {
          id: `fallback_${Date.now()}`,
          text: "Couldn't forward your message to the expert — I'll try to answer instead.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, fallbackMsg]);

        // Call AI as fallback
        try {
          const result = await chat(toSend, userData);
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: result.response,
            sender: "bot",
            timestamp: new Date(),
            escalated: result.escalated,
          };
          setMessages((prev) => [...prev, botMessage]);
        } catch (aiErr) {
          console.error("AI fallback error:", aiErr);
          setMessages((prev) => [
            ...prev,
            {
              id: `error_${Date.now()}`,
              text: "Sorry — I'm having trouble responding right now. Please try again later or contact us directly.",
              sender: "bot",
              timestamp: new Date(),
            },
          ]);
        }
      }
      // done — don't call AI normally when owner is present
      return;
    }

      // Normal path (no accepted owner) — call chat() which may escalate
      const result = await chat(toSend, userData);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: result.response,
        sender: "bot",
        timestamp: new Date(),
        escalated: result.escalated,
      };
      setMessages((prev) => [...prev, botMessage]);

      if (result.escalated && result.sessionId) {
        console.log("[chat client] starting poll & SSE for session", result.sessionId);
        setWaitingForHuman(true);
        setSessionId(result.sessionId);
        setSessionAccepted(false);
        lastOwnerIndexRef.current = 0;
        startPolling(result.sessionId);

        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `followup_${Date.now()}`,
              text: "The environmental expert has been notified and should be with you shortly. In the meantime, feel free to ask any other questions about our services!",
              sender: "bot",
              timestamp: new Date(),
            },
          ]);
        }, 10000);
      } else if (result.escalated) {
        console.warn("[chat client] escalated true but missing sessionId in result:", result);
      }

    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "Sorry, I encountered an error. Please try again or contact us at mekonnengebretsadikabel@gmail.com",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat trigger */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2">
        {!isOpen && <div className="bg-secondary text-black px-3 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse">Need help?</div>}
        <button onClick={() => setIsOpen(!isOpen)} className="p-1 sm:p-1 rounded-full bg-transparent border-3 border-secondary shadow-lg transition-all duration-300 hover:scale-105" aria-label="Open chatbot">
          {isOpen ? <X className="h-6 w-6 sm:h-7 sm:w-7 text-primary" /> : <RotatingGlobe />}
        </button>
      </div>

      {/* Chat window */}
      {isOpen && (
        <Card className="fixed py-2 gap-2 bottom-20 sm:bottom-20 right-4 sm:right-6 z-20 w-full sm:w-110 max-w-[calc(100vw-2rem)] h-80 sm:h-96 flex flex-col shadow-xl border-2 border-secondary rounded-lg">
          <div className="bg-primary text-white p-1 sm:p-2 rounded-t-lg border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="ml-22 font-semibold text-base sm:text-lg">AI Chatbot - Including LIVE !</h3>
                <p className="ml-28 text-xs sm:text-sm opacity-90">Ask me anything about Abel</p>
              </div>
              {waitingForHuman && (
                <div className="flex items-center gap-1 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs">
                  <User className="h-3 w-3" />
                  <span>Expert Notified</span>
                </div>
              )}
            </div>
          </div>

          {showForwardToast && (
            <div className="fixed bottom-32 right-6 bg-black/80 text-white px-3 py-1 rounded text-sm z-50">
              Message sent to the expert
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-1 sm:p-2 space-y-3 sm:space-y-4 bg-background">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-sm px-3 sm:px-4 py-2 rounded-lg text-sm ${message.sender === "user" ? "bg-primary text-primary-foreground rounded-br-none" : message.sender === "owner" ? "bg-green-100 text-green-900 border border-green-300 rounded-bl-none" : "bg-muted text-muted-foreground rounded-bl-none"}`}>
                  {message.escalated && (
                    <div className="flex items-center gap-1 mb-1">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs font-medium">Expert Notified</span>
                    </div>
                  )}
                  <p className="text-xs sm:text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-muted-foreground px-3 sm:px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="border-t p-3 sm:p-4 bg-background rounded-b-lg">
            <div className="flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder={waitingForHuman ? "The expert has been notified. Ask follow-up questions..." : "Ask a question..."} disabled={isLoading} className="flex-1 text-sm" />
              <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="bg-primary text-white hover:bg-secondary/70 hover:text-black">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {waitingForHuman && (
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-green-600">
                <User className="h-3 w-3" />
                <span>The environmental expert has been notified and will respond shortly</span>
              </div>
            )}
          </form>
        </Card>
      )}
    </>
  )
}
