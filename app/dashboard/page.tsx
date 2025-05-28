"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
} from "lucide-react"
import DrawingBackground from "@/components/drawing-background"
import { useSessions } from "@/hooks/use-sessions"
import WalletAddressInput from "@/components/wallet-address-input"
import { isValidSolanaAddress, formatWalletAddress } from "@/lib/wallet-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DashboardPage() {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const { sessions, loading, createSession, deleteSession, updateSession } = useSessions()
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
      toast({
        title: "failed to create session",
        description: "try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteSession(sessionId)

      toast({
        title: "session deleted",
        description: "the drawing session has been removed and is now inactive.",
      })
    } catch (error) {
      toast({
        title: "failed to delete session",
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

        {/* Default Wallet Settings */}
        <Card className="mb-8 pump-card border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="h-5 w-5 text-[#00ff88]" />
              default wallet settings
            </CardTitle>
            <CardDescription className="text-gray-400">
              set a default wallet address that will be pre-filled when creating new sessions. you can override this for
              each individual session.
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
              <strong>Revenue Split:</strong> 50% to session wallet • 50% to D3vCav3 • Instant payments on Solana
            </div>
          </CardContent>
        </Card>

        {/* Create New Session */}
        <Card className="mb-8 pump-card border-gray-800 glow-effect">
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
            <Alert className="bg-yellow-950/20 border-yellow-500/30">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-yellow-400">
                <strong>Important:</strong> You must provide your own Solana wallet address to receive 50% of token
                sales. Sessions cannot be created without a valid receiving wallet.
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
                  your receiving wallet <span className="text-red-400">*</span>
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
                <p className="text-xs text-red-400 mt-1">
                  Required: This wallet will receive 50% of all token purchases
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
                <p className="text-gray-400">no sessions yet. create your first token-based drawing session above!</p>
              </CardContent>
            </Card>
          ) : (
            sessions?.map((session) => (
              <Card key={session.id} className="pump-card border-gray-800">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">{session.name}</CardTitle>
                      <CardDescription className="text-gray-400">
                        created {new Date(session.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(`${window.location.origin}/view/${session.id}`, "view")}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSession(session.id)}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
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
                        <h4 className="font-medium text-gray-300 text-sm">receiving wallet (50% revenue)</h4>
                        {editingWallet === session.id ? (
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
                              onClick={() => handleUpdateSessionWallet(session.id, editWalletValue)}
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
                              onClick={() => startEditingWallet(session.id, session.streamer_wallet)}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
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
                          value={`${window.location.origin}/view/${session.id}`}
                          readOnly
                          className="text-xs bg-gray-800 border-gray-700 text-gray-400"
                        />
                        <Link href={`/view/${session.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`${window.location.origin}/view/${session.id}`, "view")}
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
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
                          value={`${window.location.origin}/draw/${session.id}`}
                          readOnly
                          className="text-xs bg-gray-800 border-gray-700 text-gray-400"
                        />
                        <Link href={`/draw/${session.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`${window.location.origin}/draw/${session.id}`, "draw")}
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
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
                      <div className="text-[#00ff88] font-bold">{(session.total_earnings || 0).toFixed(5)} SOL</div>
                      <div className="text-gray-400">earnings (50%)</div>
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
                      <div className="text-white font-bold">{session.active_viewers || 0}</div>
                      <div className="text-gray-400">active viewers</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
