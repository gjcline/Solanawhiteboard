"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Zap, Timer, Bomb, DollarSign } from "lucide-react"
import WalletConnection from "@/components/wallet-connection"
import PurchaseOptions from "@/components/purchase-options"
import DrawingCanvas from "@/components/drawing-canvas"
import { useToast } from "@/hooks/use-toast"
import DrawingBackground from "@/components/drawing-background"
import { useUserTokens } from "@/hooks/use-user-tokens"
import { getSession } from "@/lib/utils"

interface UserTokens {
  lines: number
  nukes: number
}

export default function DrawPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const { toast } = useToast()

  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [sessionExists, setSessionExists] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  // const [userTokens, setUserTokens] = useState<UserTokens>({ lines: 0, nukes: 0 })
  const { tokens, useToken, addTokens } = useUserTokens(sessionId, walletAddress)
  const [sessionDeleted, setSessionDeleted] = useState(false)
  const [tokenTypeUsed, setTokenTypeUsed] = useState<"line" | "nuke" | null>(null)

  const useTokenCallback = useCallback(
    (tokenType: "line" | "nuke") => {
      useToken(tokenType)
    },
    [useToken],
  )

  // Validate session exists
  useEffect(() => {
    if (!sessionId) return

    const validateSession = async () => {
      console.log("Validating session:", sessionId)

      // Check if session exists in the database
      const sessionData = await getSession(sessionId)
      if (sessionData) {
        setSessionExists(true)
        setIsLoading(false)
        return
      }

      // Check if session exists in any user's sessions or has a wallet configured
      const sessionWallet = localStorage.getItem(`session-wallet-${sessionId}`)
      if (sessionWallet) {
        setSessionExists(true)
        setIsLoading(false)
        return
      }

      // Check in all user sessions
      const allKeys = Object.keys(localStorage)
      let sessionFound = false

      for (const key of allKeys) {
        if (key.startsWith("sessions-")) {
          try {
            const sessions = JSON.parse(localStorage.getItem(key) || "[]")
            const session = sessions.find((s: any) => s.id === sessionId)
            if (session) {
              sessionFound = true

              // Try to get the wallet for this session's owner
              const userId = key.replace("sessions-", "")
              const userWallet = localStorage.getItem(`wallet-${userId}`)

              if (userWallet) {
                localStorage.setItem(`session-wallet-${sessionId}`, userWallet)
              }
              break
            }
          } catch (error) {
            console.error("Error parsing sessions from", key, ":", error)
          }
        }
      }

      // Fallback to default wallet or create demo session
      if (!sessionFound) {
        const defaultWallet = localStorage.getItem("whiteboard-recipient-wallet") || "DemoWallet123456789"
        localStorage.setItem(`session-wallet-${sessionId}`, defaultWallet)
        sessionFound = true

        toast({
          title: "demo session",
          description: "this is a demo session. tokens purchased here are for testing only.",
        })
      }

      setSessionExists(sessionFound)
      setIsLoading(false)
    }

    validateSession()
  }, [sessionId, toast])

  // Check for session deletion
  useEffect(() => {
    if (!sessionId) return

    const checkSessionStatus = () => {
      const deletedData = localStorage.getItem(`session-deleted-${sessionId}`)
      if (deletedData) {
        setSessionDeleted(true)
      }
    }

    checkSessionStatus()
    const interval = setInterval(checkSessionStatus, 2000)
    return () => clearInterval(interval)
  }, [sessionId])

  const handleWalletConnected = (address: string, balance: number) => {
    setWalletAddress(address)
    setWalletBalance(balance)
    toast({
      title: "wallet connected!",
      description: "you can now purchase tokens and start drawing.",
    })
  }

  const handleWalletDisconnected = () => {
    setWalletAddress(null)
    setWalletBalance(0)
  }

  const handleBalanceUpdate = (balance: number) => {
    setWalletBalance(balance)
  }

  const handlePurchaseSuccess = (type: string, quantity: number) => {
    addTokens(type, quantity)

    toast({
      title: "tokens added!",
      description: `${quantity} ${type === "nuke" ? "nuke" : "line"} token${quantity > 1 ? "s" : ""} added to your account.`,
    })
  }

  const handleTokenUsed = (tokenType: "line" | "nuke") => {
    setTokenTypeUsed(tokenType)
  }

  useEffect(() => {
    if (tokenTypeUsed) {
      useTokenCallback(tokenTypeUsed)
      setTokenTypeUsed(null)
    }
  }, [tokenTypeUsed, useTokenCallback])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00ff88]" />
          <p className="text-gray-400">Loading drawing session...</p>
        </div>
      </div>
    )
  }

  if (!sessionExists) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-white">session not found</h1>
        <p className="text-gray-400 mb-6">
          session ID: <span className="font-mono">{sessionId}</span>
        </p>
        <p className="text-gray-400 mb-6">this drawing session doesn't exist or has been deleted.</p>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            make sure you have the correct session ID from the streamer. session IDs are case-sensitive.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (sessionDeleted) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-white">session ended</h1>
        <p className="text-gray-400 mb-6">
          session ID: <span className="font-mono">{sessionId}</span>
        </p>
        <p className="text-gray-400 mb-6">this drawing session has been ended by the streamer.</p>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-400">
            no more token purchases or drawing actions are allowed for this session.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <DrawingBackground density={10} speed={0.2} />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">token-based drawing</h1>
        <p className="text-gray-400">
          session: <span className="pump-text-gradient font-mono">{sessionId}</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">
          purchase tokens to draw lines or nuke the board. 50% goes to streamer, 50% to D3vCav3.
        </p>
      </div>

      {/* Pricing Info */}
      <Card className="mb-6 pump-card border-[#00ff88]/50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <Zap className="h-5 w-5 text-[#00ff88]" />
            token pricing
          </CardTitle>
          <CardDescription className="text-gray-400">choose your interaction level with the whiteboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-[#00ff88]" />
                <span className="text-white">single line</span>
              </div>
              <span className="text-[#00ff88] font-bold">0.005 SOL</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-[#00ff88]/30">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#00ff88]" />
                <span className="text-white">10-line bundle</span>
              </div>
              <span className="text-[#00ff88] font-bold">0.02 SOL</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-red-500/30">
              <div className="flex items-center gap-2">
                <Bomb className="h-4 w-4 text-red-400" />
                <span className="text-white">nuke board</span>
              </div>
              <span className="text-red-400 font-bold">0.03 SOL</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Wallet & Purchase */}
        <div className="lg:col-span-1 space-y-6">
          {/* Wallet Connection */}
          <Card className="pump-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">connect wallet</CardTitle>
              <CardDescription className="text-gray-400">
                connect your phantom wallet to purchase tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WalletConnection
                onWalletConnected={handleWalletConnected}
                onWalletDisconnected={handleWalletDisconnected}
                onBalanceUpdate={handleBalanceUpdate}
              />
            </CardContent>
          </Card>

          {/* Token Status */}
          {walletAddress && (
            <Card className="pump-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">your tokens</CardTitle>
                <CardDescription className="text-gray-400">current token balance for this session</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Timer className="h-4 w-4 text-[#00ff88]" />
                      <span className="text-white">line tokens</span>
                    </div>
                    <span className="text-[#00ff88] font-bold">{tokens?.lines}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bomb className="h-4 w-4 text-red-400" />
                      <span className="text-white">nuke tokens</span>
                    </div>
                    <span className="text-red-400 font-bold">{tokens?.nukes}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Purchase Options */}
          {walletAddress && (
            <Card className="pump-card border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">purchase tokens</CardTitle>
                <CardDescription className="text-gray-400">buy tokens to interact with the whiteboard</CardDescription>
              </CardHeader>
              <CardContent>
                <PurchaseOptions
                  sessionId={sessionId}
                  walletAddress={walletAddress}
                  walletBalance={walletBalance}
                  onPurchaseSuccess={handlePurchaseSuccess}
                  onBalanceUpdate={handleBalanceUpdate}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Drawing Canvas */}
        <div className="lg:col-span-2">
          <Card className="pump-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">interactive whiteboard</CardTitle>
              <CardDescription className="text-gray-400">
                use your tokens to draw lines (5s limit) or nuke the entire board
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DrawingCanvas
                isReadOnly={false}
                sessionId={sessionId}
                walletAddress={walletAddress}
                userTokens={tokens}
                onTokenUsed={handleTokenUsed}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          💡 <strong>how it works:</strong> purchase tokens above, then click and drag on the canvas to draw. each line
          token gives you 5 seconds of drawing time.
        </p>
        <p className="text-gray-600 text-xs mt-2">
          made with ❤️ by <span className="pump-text-gradient">D3vCav3</span> • powered by draw.fun • 50/50 revenue split
        </p>
      </div>
    </div>
  )
}
