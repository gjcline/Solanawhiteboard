"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Wallet, TrendingUp, Clock, CheckCircle, DollarSign } from "lucide-react"
import { formatWalletAddress } from "@/lib/wallet-utils"

interface EarningsData {
  earnings: Array<{
    id: number
    session_id: string
    session_name: string
    total_earned: number
    total_claimed: number
    pending_amount: number
    last_claim_at: string | null
    updated_at: string
  }>
  summary: {
    total_earned: number
    total_claimed: number
    total_pending: number
    session_count: number
    last_claim_at: string | null
  }
}

interface EarningsDashboardProps {
  streamerWallet: string
}

export default function EarningsDashboard({ streamerWallet }: EarningsDashboardProps) {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [selectedSessions, setSelectedSessions] = useState<string[]>([])
  const { toast } = useToast()

  const fetchEarnings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/earnings/${streamerWallet}`)

      if (!response.ok) {
        throw new Error("Failed to fetch earnings")
      }

      const data = await response.json()
      setEarningsData(data)
    } catch (error) {
      console.error("Error fetching earnings:", error)
      toast({
        title: "Failed to load earnings",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const claimEarnings = async (sessionIds?: string[]) => {
    try {
      setClaiming(true)

      const response = await fetch("/api/earnings/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          streamerWallet,
          sessionIds,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to claim earnings")
      }

      const result = await response.json()

      toast({
        title: "Earnings claimed successfully!",
        description: `${result.amount_claimed} SOL has been sent to your wallet.`,
      })

      // Refresh earnings data
      await fetchEarnings()
      setSelectedSessions([])
    } catch (error) {
      console.error("Error claiming earnings:", error)
      toast({
        title: "Failed to claim earnings",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setClaiming(false)
    }
  }

  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId],
    )
  }

  const getSelectedAmount = () => {
    if (!earningsData) return 0
    return earningsData.earnings
      .filter((earning) => selectedSessions.includes(earning.session_id))
      .reduce((sum, earning) => sum + earning.pending_amount, 0)
  }

  useEffect(() => {
    if (streamerWallet) {
      fetchEarnings()
    }
  }, [streamerWallet])

  if (loading) {
    return (
      <Card className="pump-card border-gray-800">
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00ff88]" />
          <p className="text-gray-400">Loading earnings...</p>
        </CardContent>
      </Card>
    )
  }

  if (!earningsData) {
    return (
      <Card className="pump-card border-gray-800">
        <CardContent className="py-12 text-center">
          <p className="text-gray-400">Failed to load earnings data.</p>
          <Button onClick={fetchEarnings} className="mt-4 pump-button text-black">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const { earnings, summary } = earningsData

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="pump-card border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#00ff88]/20">
                <DollarSign className="h-5 w-5 text-[#00ff88]" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Earned</p>
                <p className="text-xl font-bold text-white">{summary.total_earned.toFixed(5)} SOL</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="pump-card border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-xl font-bold text-yellow-500">{summary.total_pending.toFixed(5)} SOL</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="pump-card border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Claimed</p>
                <p className="text-xl font-bold text-green-500">{summary.total_claimed.toFixed(5)} SOL</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="pump-card border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Sessions</p>
                <p className="text-xl font-bold text-white">{summary.session_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Claim Actions */}
      {summary.total_pending > 0 && (
        <Card className="pump-card border-gray-800 glow-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="h-5 w-5 text-[#00ff88]" />
              Claim Your Earnings
            </CardTitle>
            <CardDescription className="text-gray-400">
              Withdraw your accumulated earnings to your wallet: {formatWalletAddress(streamerWallet, 6, 6)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button
                onClick={() => claimEarnings()}
                disabled={claiming || summary.total_pending <= 0}
                className="pump-button text-black font-semibold"
              >
                {claiming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  `Claim All (${summary.total_pending.toFixed(5)} SOL)`
                )}
              </Button>

              {selectedSessions.length > 0 && (
                <Button
                  onClick={() => claimEarnings(selectedSessions)}
                  disabled={claiming}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  {claiming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    `Claim Selected (${getSelectedAmount().toFixed(5)} SOL)`
                  )}
                </Button>
              )}
            </div>

            <p className="text-xs text-gray-500">
              Note: This is currently in simulation mode. Real Solana transactions will be implemented in production.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Earnings by Session */}
      <Card className="pump-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Earnings by Session</CardTitle>
          <CardDescription className="text-gray-400">Track earnings from each of your drawing sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No earnings yet. Start a session and get viewers to purchase tokens!
            </p>
          ) : (
            <div className="space-y-4">
              {earnings.map((earning) => (
                <div
                  key={earning.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedSessions.includes(earning.session_id)
                      ? "border-[#00ff88] bg-[#00ff88]/10"
                      : "border-gray-700 hover:border-gray-600"
                  }`}
                  onClick={() => toggleSessionSelection(earning.session_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{earning.session_name}</h4>
                      <p className="text-sm text-gray-400">Session ID: {earning.session_id}</p>
                      <p className="text-xs text-gray-500">
                        Last updated: {new Date(earning.updated_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Total Earned</p>
                        <p className="font-semibold text-white">{earning.total_earned.toFixed(5)} SOL</p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-400">Pending</p>
                        <p className="font-semibold text-yellow-500">{earning.pending_amount.toFixed(5)} SOL</p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-400">Claimed</p>
                        <p className="font-semibold text-green-500">{earning.total_claimed.toFixed(5)} SOL</p>
                      </div>

                      {earning.pending_amount > 0 && (
                        <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">
                          Claimable
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
