"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"

interface Session {
  id: string
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

  const deleteSession = async (sessionId: string) => {
    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error("Failed to delete session")
    }

    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
  }

  useEffect(() => {
    fetchSessions()
  }, [user])

  return {
    sessions,
    loading,
    error,
    createSession,
    deleteSession,
    refetch: fetchSessions,
  }
}
