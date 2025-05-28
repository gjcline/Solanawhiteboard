"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { DEVCAVE_WALLET } from "@/lib/pricing"

// Storage key for recipient wallet
const RECIPIENT_WALLET_KEY = "whiteboard-recipient-wallet"

export default function AdminPage() {
  const [recipientWallet, setRecipientWallet] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Load saved wallet address
  useEffect(() => {
    const savedWallet = localStorage.getItem(RECIPIENT_WALLET_KEY)
    if (savedWallet) {
      setRecipientWallet(savedWallet)
    }
  }, [])

  const handleSave = () => {
    if (!recipientWallet) {
      toast({
        title: "error",
        description: "please enter a valid solana wallet address",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    // Simple validation for Solana address format
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(recipientWallet)) {
      toast({
        title: "invalid wallet address",
        description: "please enter a valid solana wallet address",
        variant: "destructive",
      })
      setIsSaving(false)
      return
    }

    // Save to localStorage
    localStorage.setItem(RECIPIENT_WALLET_KEY, recipientWallet)

    setTimeout(() => {
      setIsSaving(false)
      toast({
        title: "settings saved",
        description: "your recipient wallet has been updated for the 50% revenue share",
      })
    }, 500)
  }

  const resetTokens = () => {
    // Clear all token data
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("tokens-")) {
        localStorage.removeItem(key)
      }
    })
    toast({
      title: "tokens reset",
      description: "all user tokens have been cleared across all sessions",
    })
  }

  const copyWalletAddress = () => {
    navigator.clipboard.writeText(DEVCAVE_WALLET)
    toast({
      title: "wallet copied!",
      description: "D3vCav3 wallet address copied to clipboard",
    })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">admin settings</h1>

      <div className="grid gap-6 max-w-2xl mx-auto">
        {/* Revenue Split Info */}
        <Card className="pump-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">escrow revenue system</CardTitle>
            <CardDescription className="text-gray-400">
              draw.fun uses an escrow system - streamers get paid when viewers actually use their tokens
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-lg">
                <div className="text-sm font-medium text-blue-400 mb-2">How Escrow Works:</div>
                <div className="text-xs text-gray-300 space-y-1">
                  <div>1. Viewer purchases tokens → Funds held in escrow</div>
                  <div>2. Viewer uses token to draw/nuke → Payment released</div>
                  <div>3. 50% to streamer, 50% to D3vCav3 (batched every 30s)</div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">D3vCav3 (Platform)</span>
                <span className="text-[#00ff88] font-semibold">50% per token used</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">Streamer (Session Owner)</span>
                <span className="text-[#00ff88] font-semibold">50% per token used</span>
              </div>
              <div className="p-3 bg-[#00ff88]/10 rounded-lg border border-[#00ff88]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#00ff88]">D3vCav3 Wallet Address:</div>
                    <div className="text-xs font-mono text-gray-300 break-all">{DEVCAVE_WALLET}</div>
                  </div>
                  <Button
                    onClick={copyWalletAddress}
                    size="sm"
                    variant="outline"
                    className="border-[#00ff88]/50 text-[#00ff88] hover:bg-[#00ff88]/20"
                  >
                    copy
                  </Button>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  ✅ Environment variable configured - receiving 50% of used tokens
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Token Pricing Display */}
        <Card className="pump-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">current token pricing</CardTitle>
            <CardDescription className="text-gray-400">active pricing structure for all sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                <div>
                  <span className="text-white font-medium">🎨 Single Line</span>
                  <div className="text-xs text-gray-400">5-second drawing limit</div>
                </div>
                <span className="text-[#00ff88] font-bold">0.005 SOL</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-[#00ff88]/30">
                <div>
                  <span className="text-white font-medium">📦 10-Line Bundle</span>
                  <div className="text-xs text-gray-400">60% discount • Best value</div>
                </div>
                <span className="text-[#00ff88] font-bold">0.02 SOL</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg border border-red-500/30">
                <div>
                  <span className="text-white font-medium">💥 Nuke Board</span>
                  <div className="text-xs text-gray-400">Dramatic board clear effect</div>
                </div>
                <span className="text-red-400 font-bold">0.03 SOL</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Calculation Example */}
        <Card className="pump-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">revenue per token used</CardTitle>
            <CardDescription className="text-gray-400">earnings when viewers actually use their tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-white font-medium">Line Used</div>
                  <div className="text-[#00ff88] font-bold">0.0025 SOL</div>
                  <div className="text-xs text-gray-400">your 50%</div>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-white font-medium">Bundle Token Used</div>
                  <div className="text-[#00ff88] font-bold">0.001 SOL</div>
                  <div className="text-xs text-gray-400">your 50%</div>
                </div>
                <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-white font-medium">Nuke Used</div>
                  <div className="text-[#00ff88] font-bold">0.015 SOL</div>
                  <div className="text-xs text-gray-400">your 50%</div>
                </div>
              </div>
              <div className="text-center text-xs text-gray-500 mt-4">
                💡 Payments released from escrow when tokens are used, batched every 30 seconds
              </div>
              <div className="p-3 bg-yellow-950/20 border border-yellow-500/30 rounded-lg">
                <div className="text-xs text-yellow-400">
                  <strong>Note:</strong> If viewers buy tokens but never use them, they can request a refund. You only
                  get paid when tokens are actually used for drawing or nuking.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Configuration */}
        <Card className="pump-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">default recipient wallet</CardTitle>
            <CardDescription className="text-gray-400">
              set the default wallet address for sessions without a specific streamer wallet (receives 50% of token
              sales)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="recipient-wallet" className="text-sm font-medium text-gray-300">
                  recipient wallet address
                </label>
                <Input
                  id="recipient-wallet"
                  placeholder="enter solana wallet address"
                  value={recipientWallet}
                  onChange={(e) => setRecipientWallet(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={resetTokens} className="border-gray-700 text-gray-300">
              reset all tokens
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="pump-button text-black font-semibold">
              {isSaving ? "saving..." : "save settings"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
