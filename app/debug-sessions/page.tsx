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
  const [testResult, setTestResult] = useState<string>('')

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/redis-debug')
      const data = await response.json()
      
      if (data.sessions) {
        setSessions(data.sessions)
        setRedisStatus(data.redisStatus || 'unknown')
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
      await loadSessions()
    } catch (error) {
      console.error('Failed to delete session:', error)
      alert('Failed to delete session')
    }
  }

  const testSessionCreation = async () => {
    try {
      setTestResult('Testing...')
      const response = await fetch('/api/test-session?action=create')
      const data = await response.json()
      
      if (data.success) {
        setTestResult(`✅ Test session created: ${data.sessionId}`)
        await loadSessions() // Refresh the list
      } else {
        setTestResult('❌ Failed to create test session')
      }
    } catch (error) {
      setTestResult('❌ Test failed: ' + error)
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
        
        <div className="mt-4 space-y-2">
          <button 
            onClick={loadSessions}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          >
            Refresh Sessions
          </button>
          
          <button 
            onClick={testSessionCreation}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Test Session Creation
          </button>
        </div>
        
        {testResult && (
          <div className={`mt-2 p-2 rounded ${testResult.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {testResult}
          </div>
        )}
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
              <li>The session storage is not working</li>
            </ul>
          </p>
          <button 
            onClick={testSessionCreation}
            className="mt-2 bg-green-500 text-white px-4 py-2 rounded"
          >
            Test if sessions work
          </button>
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
                  
                  {/* Test this specific session */}
                  <div className="mt-2">
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(`/api/test-session?action=get&sessionId=${session.sessionId}`)
                          const data = await response.json()
                          alert(`Session lookup: ${data.found ? '✅ Found' : '❌ Not found'}\n\n${JSON.stringify(data.session, null, 2)}`)
                        } catch (error) {
                          alert('Test failed: ' + error)
                        }
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm mr-2"
                    >
                      Test Lookup
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm(`Delete session for ${session.visitorName}?`)) {
                          deleteSession(session.sessionId)
                        }
                      }}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
