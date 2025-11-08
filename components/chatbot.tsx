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

interface ChatResult {
  response?: string;
  escalated?: boolean;
  forwarded?: boolean;
  sessionId?: string;
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
// const ESCALATION_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes
// const MAX_CONSECUTIVE_FAILURES = 5

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [showForwardToast, setShowForwardToast] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm Abel's AI assistant. Ask me anything about his services, projects, and how to get in touch. You can also request for LIVE Chat with him!",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [waitingForHuman, setWaitingForHuman] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionAccepted, setSessionAccepted] = useState(false)
  // Add new state variable
  const [sessionEnded, setSessionEnded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastOwnerIndexRef = useRef<number>(0)
  const pollRef = useRef<number | null>(null)
  const escalationStartedAt = useRef<number | null>(null)

  // polling control
  // const runningRef = useRef(false)
  // const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  /* useEffect(() => {
    return () => {
      stopPolling()
      stopSSE()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) */

  useEffect(() => { 
    if (!isOpen) { 
      stopPolling(); 
      setWaitingForHuman(false); 
      setSessionId(null); 
      setSessionAccepted(false); 
    } 
  }, [isOpen]);

  function stopPolling() {
    if (pollRef.current) { 
      window.clearInterval(pollRef.current); 
      pollRef.current = null; 
    }
  }

  async function startPolling(sid: string) {
    if (!sid) return;
    stopPolling();
    escalationStartedAt.current = Date.now();
    lastOwnerIndexRef.current = 0;
    setSessionEnded(false); // Reset session ended state when starting new polling
    pollRef.current = window.setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
        const res = await fetch(`/api/session-status?sessionId=${encodeURIComponent(sid)}`, { 
          method: "GET", 
          cache: "no-store", 
          signal: controller.signal 
        });
        clearTimeout(timeout);
        if (!res.ok) {
          if (res.status === 404) return; // not created yet
          return;
        }
        const payload = await res.json().catch(() => null);
        if (!payload) return;
        
        // payload.status: 'accepted' | 'pending' | 'not_found'
        if (payload.status === "accepted") {
          setSessionAccepted(true);
          setWaitingForHuman(false);
          setSessionEnded(false);
          // append only new owner messages
          const ownerMessages: { text: string; at: number }[] = payload.session?.ownerMessages || [];
          const last = lastOwnerIndexRef.current || 0;
          if (ownerMessages.length > last) {
            const newMsgs = ownerMessages.slice(last);
            newMsgs.forEach((om) => {
              const m: Message = { 
                id: `owner_${Date.now()}_${Math.random().toString(36).slice(2,9)}`, 
                text: om.text, 
                sender: "owner", 
                timestamp: new Date(om.at) 
              };
              setMessages((prev) => [...prev, m]);
            });
            lastOwnerIndexRef.current = ownerMessages.length;
          }
        } else if (payload.status === "pending") {
          // still waiting — handle timeout as before
          const started = escalationStartedAt.current || 0;
          // (optional fallback not included here)
          setSessionEnded(false);
        } else if (payload.status === "not_found") {
          // ignore
        }
        // re-enable AI if owner ended (accepted === false)
        if (payload.session && payload.session.accepted === false && payload.session.endedAt) {
          setSessionAccepted(false);
          setWaitingForHuman(false);
          setSessionEnded(true);
        }

        // Add system message about chat ending
        const endMessage: Message = {
          id: `system_${Date.now()}`,
          text: "Abel has ended the live chat session. You can continue chatting with AI assistant.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, endMessage]);

        // Stop polling since session is over
        stopPolling();

        // Handle special session_ended event from broadcast
        if (payload._meta?.event === "session_ended") {
          setSessionAccepted(false);
          setWaitingForHuman(false);
          setSessionEnded(true);
          
          // Add system message about chat ending
          const endMessage: Message = {
            id: `system_${Date.now()}`,
            text: "Abel has ended the live chat session. You can continue chatting with AI assistant.",
            sender: "bot",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, endMessage]);
          
          // Stop polling since session is over
          stopPolling();
        }
      } catch (err: any) {
        if (err?.name === "AbortError") { /* timeout */ }
        else console.error("[poll] error", err);
      }
    }, POLL_INTERVAL_MS);
  }

  // unified send: always call server chat(); server will forward if session accepted
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

    // Call the server action — server will forward to owner if session accepted
    const result: ChatResult = await chat(toSend, userData);
    
    if (result.forwarded) {
        setShowForwardToast(true);
        window.setTimeout(() => setShowForwardToast(false), 2200);
        // do NOT append AI reply if forwarded
        setIsLoading(false);
        return;
      } 

      // If escalated created a new session, start poll
      if (result.escalated && result.sessionId) {
        setWaitingForHuman(true);
        setSessionId(result.sessionId);
        setSessionAccepted(false);
        lastOwnerIndexRef.current = 0;
        startPolling(result.sessionId);
      }

      // Otherwise, server returned an AI response — show it
      if (result.response) {
        const botMessage: Message = { 
          id: (Date.now()+1).toString(), 
          text: result.response, 
          sender: "bot", 
          timestamp: new Date(), 
          escalated: result.escalated 
        };
        setMessages((prev) => [...prev, botMessage]);
      }

    } catch (err) {
      console.error("handleSendMessage error", err);
      setMessages((prev) => [...prev, { 
        id: `err_${Date.now()}`, 
        text: "Sorry, something went wrong. Try again later.", 
        sender: "bot", 
        timestamp: new Date() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };  

  return (
    <>
      {/* Chat trigger */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2">
        {!isOpen && (
          <div className="bg-secondary text-black px-3 py-2 rounded-full text-sm font-medium shadow-lg animate-pulse">
            Need help?
          </div>
         )}
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-1 sm:p-1 rounded-full bg-transparent border-1 border-secondary shadow-lg transition-all duration-300 hover:scale-105" 
          aria-label="Open chatbot"
        >
          {isOpen ? <X className="h-6 w-6 sm:h-7 sm:w-7 text-primary" /> : <RotatingGlobe />}
        </button>
      </div>

      {isOpen && (
        <Card className="fixed py-2 gap-2 bottom-20 sm:bottom-20 right-4 sm:right-6 z-20 w-full sm:w-110 max-w-[calc(100vw-2rem)] h-80 sm:h-96 flex flex-col shadow-xl border-2 border-secondary rounded-lg">
          <div className="bg-primary text-white p-1 sm:p-2 rounded-t-lg border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base sm:text-lg">AI Chatbot - Including LIVE !</h3>
                <p className="text-xs sm:text-sm opacity-90">Ask me anything about Abel</p>
              </div>
              {/* Live chat active banner */}
              {sessionAccepted && (
                <div className="flex items-center gap-1 bg-secondary text-black italic px-2 py-1 rounded-full text-xs">
                  <User className="h-3 w-3" />
                  <span>Live chat active</span>
                </div>
              )}

              {/* Session ended notification */}
            {sessionEnded && (
              <div className="flex items-center gap-1 bg-amber-500 text-black px-2 py-1 rounded-full text-xs">
                <AlertCircle className="h-3 w-3" />
                <span>Chat ended by Abel</span>
              </div>
            )}
            </div>
          </div>
          {/* Ephemeral forward toast */}
          {showForwardToast && (
            <div className="absolute right-4 top-12 bg-black/80 text-white px-1 py-1 rounded text-sm z-50">
              Message sent to Abel
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-1 sm:p-2 space-y-3 sm:space-y-4 bg-background">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-sm px-3 sm:px-4 py-2 rounded-lg text-sm ${
                  message.sender === "user" 
                  ? "bg-primary text-primary-foreground rounded-br-none" 
                  : message.sender === "owner"
                  ? "bg-green-100 text-green-900 border border-green-300 rounded-bl-none"
                  : "bg-muted text-muted-foreground rounded-bl-none"
                }`}>
                  {message.escalated && (
                    <div className="flex items-center gap-1 mb-1">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs font-medium">Abel Notified</span>
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
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder={sessionAccepted ? "Live chat active — your messages go to Abel" : "Ask a question..."}
                disabled={isLoading || sessionEnded} 
                className="flex-1 text-sm" />
              <Button 
                type="submit" 
                disabled={isLoading || !input.trim() || sessionEnded} 
                size="icon" 
                className="bg-primary hover:bg-secondary/70 text-black">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {waitingForHuman && (
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-green-600">
                <User className="h-3 w-3" />
                <span>Abel has been notified and will respond shortly</span>
              </div>
            )}
            {sessionEnded && (
            <div className="mt-2 flex items-center justify-center gap-2 text-xs text-amber-600">
                <AlertCircle className="h-3 w-3" />
                <span>Abel ended the chat. You can continue with me.</span>
              </div>
            )}
          </form>
        </Card>
      )}
    </>
  );
}
