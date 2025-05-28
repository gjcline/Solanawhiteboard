"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Zap, Package, Bomb, AlertCircle } from "lucide-react"
import { PURCHASE_OPTIONS, REVENUE_SPLIT, DEVCAVE_WALLET, type PurchaseType } from "@/lib/pricing"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface PurchaseOptionsProps {
  sessionId: string
  walletAddress: string | null
  walletBalance: number
  onPurchaseSuccess: (type: string, quantity: number) => void
  onBalanceUpdate: (balance: number) => void
}

export default function PurchaseOptions({
  sessionId,
  walletAddress,
  walletBalance,
  onPurchaseSuccess,
  onBalanceUpdate,
}: PurchaseOptionsProps) {
  const [processingType, setProcessingType] = useState<PurchaseType | null>(null)
  const { toast } = useToast()
  // Add new state for session validation
  const [sessionDeleted, setSessionDeleted] = useState(false)

  // Add useEffect to check for session deletion
  useEffect(() => {
    if (!sessionId) return

    const checkSessionStatus = () => {
      const deletedData = localStorage.getItem(`session-deleted-${sessionId}`)
      if (deletedData) {
        setSessionDeleted(true)
      }
    }

    // Check immediately
    checkSessionStatus()

    // Check every 2 seconds for real-time updates
    const interval = setInterval(checkSessionStatus, 2000)

    return () => clearInterval(interval)
  }, [sessionId])

  const getIcon = (type: PurchaseType) => {
    switch (type) {
      case "single":
        return <Zap className="h-5 w-5" />
      case "bundle":
        return <Package className="h-5 w-5" />
      case "nuke":
        return <Bomb className="h-5 w-5" />
    }
  }

  // Update the processPurchase function to check session status
  const processPurchase = async (option: (typeof PURCHASE_OPTIONS)[0]) => {
    if (sessionDeleted) {
      toast({
        title: "session ended",
        description: "this session has been deleted. no more token purchases allowed.",
        variant: "destructive",
      })
      return
    }

    if (!walletAddress) {
      toast({
        title: "wallet not connected",
        description: "connect your wallet to make purchases.",
        variant: "destructive",
      })
      return
    }

    if (walletBalance < option.price) {
      toast({
        title: "insufficient balance",
        description: `you need ${option.price} SOL but only have ${walletBalance.toFixed(4)} SOL.`,
        variant: "destructive",
      })
      return
    }

    setProcessingType(option.type)

    try {
      // Get streamer wallet for this session
      const streamerWallet = localStorage.getItem(`session-wallet-${sessionId}`)
      if (!streamerWallet) {
        throw new Error("streamer wallet not configured")
      }

      // Calculate revenue split
      const streamerAmount = option.price * REVENUE_SPLIT.STREAMER_PERCENTAGE
      const devcaveAmount = option.price * REVENUE_SPLIT.DEVCAVE_PERCENTAGE

      // In production, you would create real Solana transactions here
      console.log("Processing purchase:", {
        type: option.type,
        totalAmount: option.price,
        streamerAmount,
        devcaveAmount,
        from: walletAddress,
        toStreamer: streamerWallet,
        toDevcave: DEVCAVE_WALLET,
      })

      // Simulate transaction processing
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update balance
      const newBalance = walletBalance - option.price
      onBalanceUpdate(newBalance)

      // Determine quantity based on purchase type
      let quantity = 1
      if (option.type === "bundle") {
        quantity = 10 // 10 lines in bundle
      }

      // Update user tokens
      onPurchaseSuccess(option.type, quantity)

      toast({
        title: "purchase successful!",
        description: `${option.title} purchased for ${option.price} SOL`,
      })
    } catch (error) {
      toast({
        title: "purchase failed",
        description: error instanceof Error ? error.message : "failed to process payment",
        variant: "destructive",
      })
    } finally {
      setProcessingType(null)
    }
  }

  // Add session deleted message to the purchase options
  if (sessionDeleted) {
    return (
      <div className="text-center p-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-400">
            this session has been ended by the streamer. token purchases are no longer available.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {PURCHASE_OPTIONS.map((option) => (
        <Card
          key={option.type}
          className={`pump-card border-gray-800 transition-all hover:border-[#00ff88]/50 ${
            option.type === "nuke" ? "border-red-500/30" : ""
          }`}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${option.type === "nuke" ? "bg-red-500/20" : "bg-[#00ff88]/20"}`}>
                {getIcon(option.type)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-sm">{option.title}</h3>
                {option.discount && (
                  <Badge variant="secondary" className="bg-[#00ff88]/20 text-[#00ff88] text-xs">
                    {option.discount}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-4">{option.description}</p>

            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm">value:</span>
              <span className="text-white font-medium">{option.value}</span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm">price:</span>
              <span className="text-[#00ff88] font-bold">{option.price} SOL</span>
            </div>

            <Button
              onClick={() => processPurchase(option)}
              disabled={processingType !== null || walletBalance < option.price || sessionDeleted}
              className={`w-full font-semibold ${
                option.type === "nuke" ? "bg-red-500 hover:bg-red-600 text-white" : "pump-button text-black"
              }`}
            >
              {sessionDeleted ? (
                "session ended"
              ) : processingType === option.type ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  processing...
                </>
              ) : walletBalance < option.price ? (
                "insufficient balance"
              ) : (
                `buy ${option.type === "nuke" ? "nuke" : option.type === "bundle" ? "bundle" : "line"}`
              )}
            </Button>

            {/* Revenue split info */}
            <div className="mt-3 text-xs text-gray-500 text-center">50% to streamer • 50% to D3vCav3</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
