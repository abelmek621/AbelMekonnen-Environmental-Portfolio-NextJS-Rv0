"use client"

import { useState, useEffect } from 'react'

interface Session {
  sessionId: string;
  visitorName: string;
  accepted: boolean;
  createdAt: string;
  lastActivityAt: string;
  acceptedBy?: any;
}

export default function DebugSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [redisStatus, setRedisStatus] = useState<string>('')

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/redis-debug')
      const data = await response.json()
      
      if (data.sessions) {
        setSessions(data.sessions)
        setRedisStatus(data.redisStatus)
      } else {
        setSessions([])
        setRedisStatus('error')
      }
    } catch (error) {
      console.error('Failed to load sessions:', error)
      setSessions([])
      setRedisStatus('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
    const interval = setInterval(loadSessions, 3000)
    return () => clearInterval(interval)
  }, [])

  const deleteSession = async (sessionId: string) => {
    try {
      await fetch(`/api/redis-debug?sessionId=${sessionId}`, { method: 'DELETE' })
      await loadSessions() // Reload the list
    } catch (error) {
      console.error('Failed to delete session:', error)
      alert('Failed to delete session')
    }
  }

  if (loading) {
    return <div className="p-8">Loading sessions from Redis...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Redis Live Chat Sessions Debug</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <p><strong>Redis Status:</strong> {redisStatus}</p>
        <p><strong>Total Sessions:</strong> {sessions.length}</p>
        <button 
          onClick={loadSessions}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Refresh
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="p-4 border rounded bg-yellow-50">
          <p>No active sessions found in Redis.</p>
          <p className="text-sm mt-2">
            This could mean:
            <ul className="list-disc list-inside mt-1">
              <li>No one has requested live chat yet</li>
              <li>Redis is not properly configured</li>
              <li>Sessions are expiring immediately</li>
            </ul>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <div key={session.sessionId} className="border p-4 rounded">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{session.visitorName}</h3>
                  <p className="text-sm text-gray-600 break-all">ID: {session.sessionId}</p>
                  <p className="text-sm">
                    Status: <span className={session.accepted ? 'text-green-600 font-bold' : 'text-yellow-600'}>
                      {session.accepted ? '✅ Accepted' : '⏳ Pending'}
                    </span>
                  </p>
                  <p className="text-sm">
                    Created: {new Date(session.createdAt).toLocaleString()}
                  </p>
                  <p className="text-sm">
                    Last Activity: {new Date(session.lastActivityAt).toLocaleString()}
                  </p>
                  {session.acceptedBy && (
                    <p className="text-sm">
                      Accepted by: {session.acceptedBy.responderName} (Telegram: {session.acceptedBy.telegramChatId})
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Delete session for ${session.visitorName}?`)) {
                      deleteSession(session.sessionId)
                    }
                  }}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm ml-4"
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
