// app/debug-sessions/page.tsx
"use client"

import { useState, useEffect } from 'react'

interface Session {
  sessionId: string;
  visitorName: string;
  accepted: boolean;
  createdAt: number;
  lastActivityAt: number;
  acceptedBy?: any;
}

export default function DebugSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await fetch('/api/debug-sessions')
        const data = await response.json()
        setSessions(data.sessions || [])
      } catch (error) {
        console.error('Failed to load sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSessions()
    const interval = setInterval(loadSessions, 5000)
    return () => clearInterval(interval)
  }, [])

  const deleteSession = async (sessionId: string) => {
    try {
      await fetch(`/api/debug-sessions?sessionId=${sessionId}`, { method: 'DELETE' })
      setSessions(sessions.filter(s => s.sessionId !== sessionId))
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  if (loading) {
    return <div className="p-8">Loading sessions...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Live Chat Sessions Debug</h1>
      
      <div className="mb-4">
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Refresh
        </button>
      </div>

      {sessions.length === 0 ? (
        <p>No active sessions</p>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.sessionId} className="border p-4 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{session.visitorName}</h3>
                  <p className="text-sm text-gray-600">ID: {session.sessionId}</p>
                  <p className="text-sm">
                    Status: <span className={session.accepted ? 'text-green-600' : 'text-yellow-600'}>
                      {session.accepted ? 'Accepted' : 'Pending'}
                    </span>
                  </p>
                  <p className="text-sm">
                    Created: {new Date(session.createdAt).toLocaleString()}
                  </p>
                  {session.acceptedBy && (
                    <p className="text-sm">
                      Accepted by: {session.acceptedBy.responderName} ({session.acceptedBy.telegramChatId})
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteSession(session.sessionId)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
