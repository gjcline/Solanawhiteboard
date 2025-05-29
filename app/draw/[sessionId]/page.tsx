"use client"

import { useState, useEffect } from "react"
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

  // const useTheToken = useCallback(
  //   (tokenType: "line" | "nuke") => {
  //     useToken(tokenType)
  //   },
  //   [useToken],
  // )

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
    useToken(tokenType)
  }

  // useEffect(() => {
  //   if (tokenTypeUsed) {
  //     useTheToken(tokenTypeUsed)
  //     setTokenTypeUsed(null)
  //   }
  // }, [tokenTypeUsed, useTheToken])

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
        {/* Wallet Connection & Token Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Wallet Connection */}
          <Card className="pump-card border-gray-700 bg-gray-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Wallet className="h-4 w-4 text-[#00ff88]" />
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
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#00ff88]" />
                token prices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 bg-gray-700/50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Timer className="h-3 w-3 text-[#00ff88]" />
                    <span className="text-white">line</span>
                  </div>
                  <div className="text-[#00ff88] font-bold">0.005 SOL</div>
                </div>
                <div className="text-center p-2 bg-gray-700/50 rounded border border-[#00ff88]/30">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="h-3 w-3 text-[#00ff88]" />
                    <span className="text-white">10-pack</span>
                  </div>
                  <div className="text-[#00ff88] font-bold">0.02 SOL</div>
                </div>
                <div className="text-center p-2 bg-gray-700/50 rounded border border-red-500/30">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Bomb className="h-3 w-3 text-red-400" />
                    <span className="text-white">nuke</span>
                  </div>
                  <div className="text-red-400 font-bold">0.03 SOL</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Split Info */}
          <Card className="pump-card border-gray-700 bg-gray-800/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-[#00ff88]" />
                revenue split
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">streamer:</span>
                  <span className="text-[#00ff88] font-semibold">50%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">d3vcav3:</span>
                  <span className="text-[#00ff88] font-semibold">50%</span>
                </div>
                <div className="text-center text-gray-500 text-xs mt-2">funds held in escrow until tokens are used</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Options Section */}
        {walletAddress && (
          <div className="mb-6">
            <Card className="pump-card border-gray-700 bg-gray-800/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">purchase tokens</CardTitle>
                <CardDescription className="text-gray-400 text-sm">
                  buy tokens to interact with the whiteboard
                </CardDescription>
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
          </div>
        )}

        {/* Main Canvas Area - Full Width */}
        <Card className="pump-card border-gray-700 bg-gray-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-lg">interactive whiteboard</CardTitle>
            <CardDescription className="text-gray-400 text-sm">
              use tokens to draw lines (5s limit) or nuke the entire board
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[600px]">
              <DrawingCanvas
                isReadOnly={false}
                sessionId={sessionId}
                walletAddress={walletAddress}
                userTokens={tokens}
                onTokenUsed={handleTokenUsed}
              />
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            💡 <strong>how it works:</strong> purchase tokens above, then click and drag on the canvas to draw. each
            line token gives you 5 seconds of drawing time.
          </p>
          <p className="text-gray-600 text-xs mt-2">
            made with ❤️ by <span className="pump-text-gradient">D3vCav3</span> • powered by draw.fun • 50/50 revenue
            split
          </p>
        </div>
      </div>
    </div>
  )
}
