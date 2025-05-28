"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, Zap, Timer, Bomb, DollarSign, Wallet, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import WalletConnection from "@/components/wallet-connection"
import PurchaseOptions from "@/components/purchase-options"
import DrawingCanvas from "@/components/drawing-canvas"
import { useToast } from "@/hooks/use-toast"
import DrawingBackground from "@/components/drawing-background"
import { useUserTokens } from "@/hooks/use-user-tokens"

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
  const [sessionData, setSessionData] = useState<any>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const { tokens, useToken, addTokens } = useUserTokens(sessionId, walletAddress)
  const [sessionDeleted, setSessionDeleted] = useState(false)
  const [tokenTypeUsed, setTokenTypeUsed] = useState<"line" | "nuke" | null>(null)

  // Validate session exists
  useEffect(() => {
    if (!sessionId) return

    const validateSession = async () => {
      console.log("Validating session:", sessionId)

      try {
        const response = await fetch(`/api/sessions/${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.session && data.session.streamer_wallet && data.session.is_active) {
            setSessionExists(true)
            setSessionData(data.session)
            setIsLoading(false)
            return
          }
        }
      } catch (error) {
        console.log("Session API check failed:", error)
      }

      setSessionExists(false)
      setIsLoading(false)
    }

    validateSession()
  }, [sessionId])

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
      description: `${type === "nuke" ? "nuke" : "line"} token${quantity > 1 ? "s" : ""} added to your account.`,
    })
  }

  const handleTokenUsed = (tokenType: "line" | "nuke") => {
    setTokenTypeUsed(tokenType)
  }

  const useTheToken = useCallback(
    (tokenType: "line" | "nuke") => {
      useToken(tokenType)
    },
    [useToken],
  )

  useEffect(() => {
    if (tokenTypeUsed) {
      useTheToken(tokenTypeUsed)
      setTokenTypeUsed(null)
    }
  }, [tokenTypeUsed, useTheToken])

  const openViewPage = () => {
    window.open(`/view/${sessionId}`, "_blank")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00ff88]" />
          <p className="text-gray-400">Loading drawing session...</p>
        </div>
      </div>
    )
  }

  if (!sessionExists) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-white">session not found</h1>
          <p className="text-gray-400 mb-6">
            session ID: <span className="font-mono">{sessionId}</span>
          </p>
          <p className="text-gray-400 mb-6">
            this drawing session doesn't exist, has been deleted, or doesn't have a valid receiving wallet configured.
          </p>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              make sure you have the correct session ID from the streamer. sessions require a valid wallet address to
              accept payments.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (sessionDeleted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
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
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      <DrawingBackground density={10} speed={0.2} />

      {/* Top Header Bar */}
      <div className="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">{sessionData?.name || "Drawing Session"}</h1>
              <p className="text-sm text-gray-400">
                ID: <span className="pump-text-gradient font-mono">{sessionId}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={openViewPage}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Eye className="h-4 w-4 mr-2" />
                view mode
              </Button>
              {walletAddress && (
                <div className="text-right">
                  <div className="text-sm text-gray-400">your tokens</div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-[#00ff88]">{tokens?.lines} lines</span>
                    <span className="text-red-400">{tokens?.nukes} nukes</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
          {/* Left Sidebar - Wallet & Purchase */}
          <div className="xl:col-span-1 space-y-4 xl:max-h-full xl:overflow-y-auto">
            {/* Wallet Connection */}
            <Card className="pump-card border-gray-700 bg-gray-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-[#00ff88]" />
                  phantom wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WalletConnection
                  onWalletConnected={handleWalletConnected}
                  onWalletDisconnected={handleWalletDisconnected}
                  onBalanceUpdate={handleBalanceUpdate}
                />
              </CardContent>
            </Card>

            {/* Token Pricing */}
            <Card className="pump-card border-gray-700 bg-gray-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-[#00ff88]" />
                  token prices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-[#00ff88]" />
                    <span className="text-white text-sm">single line</span>
                  </div>
                  <span className="text-[#00ff88] font-bold text-sm">0.005 SOL</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-700/50 rounded border border-[#00ff88]/30">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#00ff88]" />
                    <span className="text-white text-sm">10-pack</span>
                  </div>
                  <span className="text-[#00ff88] font-bold text-sm">0.02 SOL</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-700/50 rounded border border-red-500/30">
                  <div className="flex items-center gap-2">
                    <Bomb className="h-4 w-4 text-red-400" />
                    <span className="text-white text-sm">nuke board</span>
                  </div>
                  <span className="text-red-400 font-bold text-sm">0.03 SOL</span>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Options */}
            {walletAddress && (
              <Card className="pump-card border-gray-700 bg-gray-800/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg">buy tokens</CardTitle>
                  <CardDescription className="text-gray-400 text-sm">50% to streamer • 50% to D3vCav3</CardDescription>
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

          {/* Main Canvas Area */}
          <div className="xl:col-span-3">
            <Card className="pump-card border-gray-700 bg-gray-800/50 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg">interactive whiteboard</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  use tokens to draw lines (5s limit) or nuke the entire board
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)]">
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
      </div>
    </div>
  )
}
