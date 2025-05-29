"use client"

import { useState, useEffect } from "react"

interface UserTokens {
  lines: number
  nukes: number
}

export function useUserTokens(sessionId: string, walletAddress: string | null) {
  const [tokens, setTokens] = useState<UserTokens>({ lines: 0, nukes: 0 })
  const [loading, setLoading] = useState(false)

  const fetchTokens = async () => {
    if (!sessionId || !walletAddress) {
      setTokens({ lines: 0, nukes: 0 })
      return
    }

    try {
      setLoading(true)
      console.log("🔄 Fetching tokens for:", { sessionId, walletAddress })

      const response = await fetch(`/api/tokens/${sessionId}?wallet=${walletAddress}`)

      if (response.ok) {
        const data = await response.json()
        console.log("📊 Fetched tokens:", data.tokens)

        // Map the API response to our interface with proper fallbacks
        const mappedTokens = {
          lines: (data.tokens?.line_tokens || 0) + (data.tokens?.bundle_tokens || 0),
          nukes: data.tokens?.nuke_tokens || 0,
        }

        setTokens(mappedTokens)
      } else {
        console.error("❌ Failed to fetch tokens:", response.status, response.statusText)
        // Set default values on error
        setTokens({ lines: 0, nukes: 0 })
      }
    } catch (error) {
      console.error("❌ Error fetching tokens:", error)
      // Set default values on error
      setTokens({ lines: 0, nukes: 0 })
    } finally {
      setLoading(false)
    }
  }

  const useToken = async (tokenType: "line" | "nuke") => {
    if (!sessionId || !walletAddress) return false

    try {
      console.log("🎯 Using token:", { tokenType, sessionId, walletAddress })

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
        console.log("✅ Token used successfully:", data)

        // Update local token state
        if (data.tokens) {
          const mappedTokens = {
            lines: (data.tokens.line_tokens || 0) + (data.tokens.bundle_tokens || 0),
            nukes: data.tokens.nuke_tokens || 0,
          }
          setTokens(mappedTokens)
        } else {
          // Refresh tokens if not returned
          await fetchTokens()
        }
        return true
      } else {
        const errorData = await response.json()
        console.error("❌ Failed to use token:", errorData)
        return false
      }
    } catch (error) {
      console.error("❌ Error using token:", error)
      return false
    }
  }

  const addTokens = async (tokenType: string, quantity: number) => {
    if (!sessionId || !walletAddress) return false

    try {
      console.log("💰 Purchasing tokens:", { tokenType, quantity, sessionId, walletAddress })

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

      console.log("💵 Purchase details:", { tokenType, quantity, totalAmount })

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
        console.log("✅ Purchase successful:", data)

        // Immediately refresh tokens from server
        await fetchTokens()
        return true
      } else {
        const errorData = await response.json()
        console.error("❌ Purchase failed:", errorData)
        return false
      }
    } catch (error) {
      console.error("❌ Error purchasing tokens:", error)
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
