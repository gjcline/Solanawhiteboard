"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import {
  Plus,
  ExternalLink,
  Eye,
  Trash2,
  Copy,
  Wallet,
  Zap,
  TrendingUp,
  Timer,
  Bomb,
  Loader2,
  Edit2,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Power,
  PowerOff,
  DollarSign,
} from "lucide-react"
import DrawingBackground from "@/components/drawing-background"
import { useSessions } from "@/hooks/use-sessions"
import WalletAddressInput from "@/components/wallet-address-input"
import { isValidSolanaAddress, formatWalletAddress } from "@/lib/wallet-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import EarningsDashboard from "@/components/earnings-dashboard"

export default function DashboardPage() {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const { sessions, loading, createSession, deleteSession, updateSession, permanentDeleteSession } = useSessions()
  const [newSessionName, setNewSessionName] = useState("")
  const [newSessionWallet, setNewSessionWallet] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [defaultWalletAddress, setDefaultWalletAddress] = useState("")
  const [editingWallet, setEditingWallet] = useState<string | null>(null)
  const [editWalletValue, setEditWalletValue] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    // Load default wallet address from user profile
    if (user.wallet_address) {
      setDefaultWalletAddress(user.wallet_address)
      setNewSessionWallet(user.wallet_address) // Pre-fill new session with default wallet
    }
  }, [user, router])

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) {
      toast({
        title: "session name required",
        description: "enter a name for your drawing session.",
        variant: "destructive",
      })
      return
    }

    if (!newSessionWallet || !isValidSolanaAddress(newSessionWallet)) {
      toast({
        title: "valid wallet address required",
        description: "you must provide a valid Solana wallet address to receive payments. this cannot be empty.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const session = await createSession(newSessionName, newSessionWallet)

      setNewSessionName("")
      // Keep the wallet address for next session (convenience)
      toast({
        title: "session created!",
        description: "your new token-based drawing session is ready to pump.",
      })
    } catch (error) {
      console.error("Error creating session:", error)
      toast({
        title: "failed to create session",
        description: "try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeactivateSession = async (sessionId: string) => {
    try {
      console.log("Deactivating session:", sessionId)
      await deleteSession(sessionId) // This does soft delete (deactivate)

      toast({
        title: "session deactivated",
        description: "the drawing session has been deactivated and is no longer accessible.",
      })
    } catch (error) {
      console.error("Error deactivating session:", error)
      toast({
        title: "failed to deactivate session",
        description: "try again.",
        variant: "destructive",
      })
    }
  }

  const handlePermanentDeleteSession = async (sessionId: string) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this session? This action cannot be undone and will remove all session data.",
      )
    ) {
      return
    }

    try {
      console.log("Permanently deleting session:", sessionId)
      await permanentDeleteSession(sessionId) // This does hard delete

      toast({
        title: "session deleted permanently",
        description: "the session and all its data have been permanently removed.",
      })
    } catch (error) {
      console.error("Error permanently deleting session:", error)
      toast({
        title: "failed to delete session",
        description: "try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleSession = async (sessionId: string, currentStatus: boolean) => {
    try {
      console.log("Toggling session:", sessionId, "from", currentStatus, "to", !currentStatus)
      await updateSession(sessionId, { is_active: !currentStatus })

      toast({
        title: currentStatus ? "session deactivated" : "session reactivated",
        description: currentStatus
          ? "session is now inactive and inaccessible to viewers."
          : "session is now active and accessible to viewers.",
      })
    } catch (error) {
      console.error("Error toggling session:", error)
      toast({
        title: "failed to update session",
        description: "try again.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateSessionWallet = async (sessionId: string, newWallet: string) => {
    if (!isValidSolanaAddress(newWallet)) {
      toast({
        title: "invalid wallet address",
        description: "please enter a valid Solana wallet address.",
        variant: "destructive",
      })
      return
    }

    try {
      await updateSession(sessionId, { streamer_wallet: newWallet })
      setEditingWallet(null)
      toast({
        title: "wallet updated",
        description: "session wallet address has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating wallet:", error)
      toast({
        title: "failed to update wallet",
        description: "please try again.",
        variant: "destructive",
      })
    }
  }

  const startEditingWallet = (sessionId: string, currentWallet: string) => {
    setEditingWallet(sessionId)
    setEditWalletValue(currentWallet)
  }

  const cancelEditingWallet = () => {
    setEditingWallet(null)
    setEditWalletValue("")
  }

  const useDefaultWalletForEdit = () => {
    if (defaultWalletAddress) {
      setEditWalletValue(defaultWalletAddress)
    }
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        if (document.hasFocus && !document.hasFocus()) {
          window.focus()
        }
        await navigator.clipboard.writeText(text)
        toast({
          title: "copied!",
          description: `${type} URL copied to clipboard.`,
        })
      } else {
        const textArea = document.createElement("textarea")
        textArea.value = text
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()

        try {
          const successful = document.execCommand("copy")
          if (successful) {
            toast({
              title: "copied!",
              description: `${type} URL copied to clipboard.`,
            })
          } else {
            throw new Error("Copy command failed")
          }
        } catch (err) {
          prompt(`Copy this ${type} URL:`, text)
        } finally {
          document.body.removeChild(textArea)
        }
      }
    } catch (error) {
      console.error("Copy failed:", error)
      prompt(`Copy this ${type} URL:`, text)
    }
  }

  const saveDefaultWallet = async () => {
    if (!user) return

    try {
      await updateProfile({ wallet_address: defaultWalletAddress })
      toast({
        title: "default wallet saved",
        description: "your default wallet has been updated.",
      })
    } catch (error) {
      console.error("Error saving wallet:", error)
      toast({
        title: "failed to save wallet",
        description: "please try again.",
        variant: "destructive",
      })
    }
  }

  const useDefaultWallet = () => {
    if (defaultWalletAddress) {
      setNewSessionWallet(defaultWalletAddress)
    }
  }

  // Helper function to safely convert earnings to number
  const formatEarnings = (earnings: any): string => {
    const num = typeof earnings === "string" ? Number.parseFloat(earnings) : earnings || 0
    return isNaN(num) ? "0.00000" : num.toFixed(5)
  }

  // Get the session ID consistently
  const getSessionId = (session: any) => session.session_id || session.id

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen w-full relative">
      <DrawingBackground density={10} speed={0.2} />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">dashboard</h1>
            <p className="text-gray-400">
              welcome back, <span className="pump-text-gradient">{user.username}</span>!
            </p>
          </div>
          <div className="pump-card p-4 rounded-lg">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#00ff88]" />
                <span className="text-gray-400">sessions:</span>
                <span className="text-[#00ff88] font-semibold">{sessions?.length || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#00ff88]" />
                <span className="text-gray-400">ready to pump!</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="sessions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
            <TabsTrigger value="sessions" className="data-[state=active]:bg-[#00ff88] data-[state=active]:text-black">
              Sessions & Setup
            </TabsTrigger>
            <TabsTrigger value="earnings" className="data-[state=active]:bg-[#00ff88] data-[state=active]:text-black">
              <DollarSign className="h-4 w-4 mr-2" />
              Earnings & Claims
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-6">
            {/* Default Wallet Settings */}
            <Card className="pump-card border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Wallet className="h-5 w-5 text-[#00ff88]" />
                  default wallet settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  set a default wallet address that will be pre-filled when creating new sessions. you can override this
                  for each individual session.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WalletAddressInput
                  value={defaultWalletAddress}
                  onChange={setDefaultWalletAddress}
                  onSave={saveDefaultWallet}
                  placeholder="enter your default solana wallet address"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                <div className="mt-3 text-sm text-gray-500">
                  <strong>New Revenue Model:</strong> All purchases go to DevCave wallet • Earnings accumulate in your
                  account • Claim rewards when you want
                </div>
              </CardContent>
            </Card>

            {/* Create New Session */}
            <Card className="pump-card border-gray-800 glow-effect">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Zap className="h-5 w-5 text-[#00ff88]" />
                  create new token-based session
                </CardTitle>
                <CardDescription className="text-gray-400">
                  launch a new whiteboard where viewers purchase tokens to draw lines or nuke the board
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-950/20 border-blue-500/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-blue-400">
                    <strong>New System:</strong> Token purchases are held in our secure wallet. Your earnings accumulate
                    automatically and you can claim them anytime from the Earnings tab.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">session name</label>
                    <Input
                      placeholder="session name (e.g., 'token drawing madness')"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      your earnings wallet <span className="text-red-400">*</span>
                    </label>
                    <div className="flex gap-2">
                      <WalletAddressInput
                        value={newSessionWallet}
                        onChange={setNewSessionWallet}
                        placeholder="your solana wallet address (required)"
                        className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      />
                      {defaultWalletAddress && defaultWalletAddress !== newSessionWallet && (
                        <Button
                          onClick={useDefaultWallet}
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-gray-300 hover:bg-gray-800 whitespace-nowrap"
                          title="Use your default wallet address"
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          use default
                        </Button>
                      )}
                    </div>
                    {defaultWalletAddress && (
                      <p className="text-xs text-gray-500 mt-1">
                        Default: {formatWalletAddress(defaultWalletAddress, 6, 6)}
                      </p>
                    )}
                    <p className="text-xs text-blue-400 mt-1">
                      Required: This wallet will receive your claimed earnings (50% of token sales)
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleCreateSession}
                  disabled={isCreating || !newSessionName.trim() || !isValidSolanaAddress(newSessionWallet)}
                  className="w-full pump-button text-black font-semibold"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      creating...
                    </>
                  ) : !isValidSolanaAddress(newSessionWallet) ? (
                    "enter valid wallet address"
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      pump it
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Sessions List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">your token-based sessions</h2>
              {sessions?.length === 0 ? (
                <Card className="pump-card border-gray-800">
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-400">
                      no sessions yet. create your first token-based drawing session above!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                sessions?.map((session) => {
                  const sessionId = getSessionId(session)
                  return (
                    <Card
                      key={sessionId}
                      className={`pump-card border-gray-800 ${!session.is_active ? "opacity-60" : ""}`}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-white">{session.name}</CardTitle>
                              {session.is_active ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-900/30 text-green-400 border border-green-500/30">
                                  <Power className="h-3 w-3" />
                                  active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-900/30 text-red-400 border border-red-500/30">
                                  <PowerOff className="h-3 w-3" />
                                  inactive
                                </span>
                              )}
                            </div>
                            <CardDescription className="text-gray-400">
                              created {new Date(session.created_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleSession(sessionId, session.is_active)}
                              className={`border-gray-700 hover:bg-gray-800 ${
                                session.is_active
                                  ? "text-red-400 hover:text-red-300"
                                  : "text-green-400 hover:text-green-300"
                              }`}
                              title={session.is_active ? "Deactivate session" : "Reactivate session"}
                            >
                              {session.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(`${window.location.origin}/view/${sessionId}`, "view")}
                              className="border-gray-700 text-gray-300 hover:bg-gray-800"
                              disabled={!session.is_active}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivateSession(sessionId)}
                              className="border-gray-700 text-orange-400 hover:bg-gray-800 hover:text-orange-300"
                              title="Deactivate session (soft delete)"
                            >
                              <PowerOff className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePermanentDeleteSession(sessionId)}
                              className="border-gray-700 text-red-400 hover:bg-gray-800 hover:text-red-300"
                              title="Permanently delete session (hard delete)"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* Session Wallet Display/Edit */}
                        <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-300 text-sm">earnings wallet (50% revenue)</h4>
                              {editingWallet === sessionId ? (
                                <div className="flex items-center gap-2 mt-2">
                                  <WalletAddressInput
                                    value={editWalletValue}
                                    onChange={setEditWalletValue}
                                    className="flex-1 bg-gray-700 border-gray-600 text-white text-sm"
                                  />
                                  {defaultWalletAddress && defaultWalletAddress !== editWalletValue && (
                                    <Button
                                      onClick={useDefaultWalletForEdit}
                                      size="sm"
                                      variant="outline"
                                      className="border-gray-600 text-gray-300 hover:bg-gray-700 whitespace-nowrap"
                                      title="Use your default wallet address"
                                    >
                                      <RefreshCw className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    onClick={() => handleUpdateSessionWallet(sessionId, editWalletValue)}
                                    size="sm"
                                    className="pump-button text-black"
                                    disabled={!isValidSolanaAddress(editWalletValue)}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    onClick={cancelEditingWallet}
                                    size="sm"
                                    variant="outline"
                                    className="border-gray-600 text-gray-300"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-mono text-gray-400">
                                    {formatWalletAddress(session.streamer_wallet, 8, 8)}
                                  </span>
                                  <Button
                                    onClick={() => startEditingWallet(sessionId, session.streamer_wallet)}
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                                    disabled={!session.is_active}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium mb-2 text-gray-300">for your stream (view only)</h4>
                            <div className="flex gap-2">
                              <Input
                                value={`${window.location.origin}/view/${sessionId}`}
                                readOnly
                                className="text-xs bg-gray-800 border-gray-700 text-gray-400"
                              />
                              <Link href={`/view/${sessionId}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                  disabled={!session.is_active}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(`${window.location.origin}/view/${sessionId}`, "view")}
                                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                disabled={!session.is_active}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              display this on your stream. shows live drawing and nuke effects.
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2 text-gray-300">for viewers (token purchase & draw)</h4>
                            <div className="flex gap-2">
                              <Input
                                value={`${window.location.origin}/draw/${sessionId}`}
                                readOnly
                                className="text-xs bg-gray-800 border-gray-700 text-gray-400"
                              />
                              <Link href={`/draw/${sessionId}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                  disabled={!session.is_active}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(`${window.location.origin}/draw/${sessionId}`, "draw")}
                                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                disabled={!session.is_active}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              share this URL so viewers can buy tokens and interact with your board.
                            </p>
                          </div>
                        </div>

                        {/* Session Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                            <div className="text-[#00ff88] font-bold">
                              {formatEarnings(session.pending_earnings)} SOL
                            </div>
                            <div className="text-gray-400">pending earnings</div>
                          </div>
                          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center justify-center gap-1">
                              <Timer className="h-4 w-4" />
                              <span className="text-white font-bold">{session.lines_drawn || 0}</span>
                            </div>
                            <div className="text-gray-400">lines drawn</div>
                          </div>
                          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                            <div className="flex items-center justify-center gap-1">
                              <Bomb className="h-4 w-4 text-red-400" />
                              <span className="text-white font-bold">{session.nukes_used || 0}</span>
                            </div>
                            <div className="text-gray-400">nukes used</div>
                          </div>
                          <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                            <div className="text-white font-bold">{session.viewer_count || 0}</div>
                            <div className="text-gray-400">active viewers</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="earnings">
            {defaultWalletAddress ? (
              <EarningsDashboard streamerWallet={defaultWalletAddress} />
            ) : (
              <Card className="pump-card border-gray-800">
                <CardContent className="py-12 text-center">
                  <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-white mb-2">Set Your Default Wallet</h3>
                  <p className="text-gray-400 mb-4">
                    Please set your default wallet address in the Sessions tab to view your earnings.
                  </p>
                  <Button
                    onClick={() => {
                      const tabsList = document.querySelector('[role="tablist"]')
                      const sessionsTab = tabsList?.querySelector('[value="sessions"]') as HTMLElement
                      sessionsTab?.click()
                    }}
                    className="pump-button text-black"
                  >
                    Go to Sessions Tab
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
