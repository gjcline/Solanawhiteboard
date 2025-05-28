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
      // Use the escrow API endpoint instead of direct token usage
      const response = await fetch(`/api/escrow/use-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          userWallet: walletAddress,
          tokenType,
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

  const addTokens = async (tokenType: string, quantity: number) => {
    if (!sessionId || !walletAddress) return false

    try {
      // Calculate total amount based on token type and quantity
      let totalAmount = 0
      if (tokenType === "single") {
        totalAmount = 0.005 * quantity
      } else if (tokenType === "bundle") {
        totalAmount = 0.02 // Bundle is fixed price for 10 tokens
        quantity = 10 // Ensure quantity is 10 for bundles
      } else if (tokenType === "nuke") {
        totalAmount = 0.03 * quantity
      }

      // Create escrow purchase
      const response = await fetch(`/api/escrow/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          userWallet: walletAddress,
          tokenType,
          quantity,
          totalAmount,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Refresh tokens to get updated balance
        await fetchTokens()
        return true
      }
      return false
    } catch (error) {
      console.error("Error purchasing tokens:", error)
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
