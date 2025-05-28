"use client"

import { useState, useEffect } from "react"

interface UserTokens {
  line_tokens: number
  nuke_tokens: number
}

export function useUserTokens(sessionId: string, walletAddress: string | null) {
  const [tokens, setTokens] = useState<UserTokens>({ line_tokens: 0, nuke_tokens: 0 })
  const [loading, setLoading] = useState(false)

  const fetchTokens = async () => {
    if (!sessionId || !walletAddress) return

    try {
      setLoading(true)
      const response = await fetch(`/api/tokens/${sessionId}?wallet=${walletAddress}`)

      if (response.ok) {
        const data = await response.json()
        setTokens(data.tokens)
      }
    } catch (error) {
      console.error("Error fetching tokens:", error)
    } finally {
      setLoading(false)
    }
  }

  const useToken = async (tokenType: "line" | "nuke") => {
    if (!sessionId || !walletAddress) return false

    try {
      const response = await fetch(`/api/tokens/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_wallet: walletAddress,
          action: "use",
          token_type: tokenType,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTokens(data.tokens)
        return true
      }
      return false
    } catch (error) {
      console.error("Error using token:", error)
      return false
    }
  }

  const addTokens = async (lineTokens = 0, nukeTokens = 0) => {
    if (!sessionId || !walletAddress) return false

    try {
      const response = await fetch(`/api/tokens/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_wallet: walletAddress,
          action: "add",
          line_tokens: lineTokens,
          nuke_tokens: nukeTokens,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTokens(data.tokens)
        return true
      }
      return false
    } catch (error) {
      console.error("Error adding tokens:", error)
      return false
    }
  }

  useEffect(() => {
    fetchTokens()
  }, [sessionId, walletAddress])

  return {
    tokens,
    loading,
    useToken,
    addTokens,
    refetch: fetchTokens,
  }
}
