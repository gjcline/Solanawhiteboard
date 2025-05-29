"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"

interface Session {
  id: string
  session_id: string
  name: string
  owner_id: number
  streamer_wallet: string
  is_active: boolean
  total_earnings: number
  viewer_count: number
  created_at: string
  updated_at: string
  lines_drawn: number
  nukes_used: number
  total_tokens_sold: number
  unique_participants: number
  active_viewers: number
}

export function useSessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log("Fetching sessions for user:", user.id)
      const response = await fetch(`/api/sessions?owner_id=${user.id}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch sessions")
      }

      const data = await response.json()
      console.log("Sessions fetched:", data.sessions)
      setSessions(data.sessions)
    } catch (err) {
      console.error("Error fetching sessions:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const createSession = async (name: string, streamerWallet: string) => {
    if (!user) throw new Error("User not authenticated")

    console.log("Creating session:", { name, owner_id: user.id, streamer_wallet: streamerWallet })

    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        owner_id: user.id,
        streamer_wallet: streamerWallet,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to create session")
    }

    const data = await response.json()
    console.log("Session created:", data.session)
    setSessions((prev) => [data.session, ...prev])
    return data.session
  }

  const updateSession = async (sessionId: string, updates: Partial<Session>) => {
    console.log("Updating session:", sessionId, updates)

    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to update session")
    }

    const data = await response.json()
    console.log("Session updated:", data.session)

    // Update the session in our local state using session_id
    setSessions((prev) =>
      prev.map((session) =>
        session.session_id === sessionId || session.id === sessionId ? { ...session, ...data.session } : session,
      ),
    )

    return data.session
  }

  const deleteSession = async (sessionId: string) => {
    console.log("Deactivating session:", sessionId)

    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_active: false }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to deactivate session")
    }

    const data = await response.json()
    console.log("Session deactivated:", data.session)

    // Update the session in local state to show as inactive
    setSessions((prev) =>
      prev.map((session) =>
        session.session_id === sessionId || session.id === sessionId ? { ...session, is_active: false } : session,
      ),
    )

    return data.session
  }

  const permanentDeleteSession = async (sessionId: string) => {
    console.log("Permanently deleting session:", sessionId)

    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to permanently delete session")
    }

    console.log("Session permanently deleted:", sessionId)

    // Remove the session from local state completely
    setSessions((prev) => prev.filter((session) => session.session_id !== sessionId && session.id !== sessionId))

    return true
  }

  useEffect(() => {
    fetchSessions()
  }, [user])

  return {
    sessions,
    loading,
    error,
    createSession,
    updateSession,
    deleteSession,
    permanentDeleteSession,
    refetch: fetchSessions,
  }
}
