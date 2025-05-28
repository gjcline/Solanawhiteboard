"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Plus, ExternalLink, Eye, Trash2, Copy, Wallet, Zap, TrendingUp, Timer, Bomb, Loader2 } from "lucide-react"
import DrawingBackground from "@/components/drawing-background"
import { useSessions } from "@/hooks/use-sessions"

export default function DashboardPage() {
  const { user, updateProfile } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const { sessions, loading, createSession, deleteSession } = useSessions()
  const [newSessionName, setNewSessionName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    // Load wallet address from user profile
    if (user.wallet_address) {
      setWalletAddress(user.wallet_address)
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

    if (!walletAddress) {
      toast({
        title: "wallet address required",
        description: "set your wallet address first.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const session = await createSession(newSessionName, walletAddress)

      setNewSessionName("")
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

  const saveWalletAddress = async () => {
    if (!user) return

    try {
      await updateProfile({ wallet_address: walletAddress })
      toast({
        title: "wallet address saved",
        description: "your solana wallet has been updated for 50% revenue share.",
      })
    } catch (error) {
      toast({
        title: "failed to save wallet",
        description: "please try again.",
        variant: "destructive",
      })
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
                <span className="text-[#00ff88] font-semibold">{sessions?.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#00ff88]" />
                <span className="text-gray-400">ready to pump!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Settings */}
        <Card className="mb-8 pump-card border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Wallet className="h-5 w-5 text-[#00ff88]" />
              wallet settings
            </CardTitle>
            <CardDescription className="text-gray-400">
              set your solana wallet address to receive 50% of all token purchases (D3vCav3 gets 50% for platform
              maintenance)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="enter your solana wallet address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
              <Button onClick={saveWalletAddress} className="pump-button text-black font-semibold">
                save
              </Button>
            </div>
            <div className="mt-3 text-sm text-gray-500">
              <strong>Revenue Split:</strong> 50% to you • 50% to D3vCav3 • Instant payments on Solana
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
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="session name (e.g., 'token drawing madness')"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
              />
              <Button
                onClick={handleCreateSession}
                disabled={isCreating || !walletAddress}
                className="pump-button text-black font-semibold"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    pump it
                  </>
                )}
              </Button>
            </div>
            {!walletAddress && <p className="text-sm text-red-400 mt-2">set your wallet address first</p>}
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
                        created {new Date(session.createdAt).toLocaleDateString()}
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
                      <div className="text-[#00ff88] font-bold">{session.totalEarnings.toFixed(5)} SOL</div>
                      <div className="text-gray-400">earnings (50%)</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center justify-center gap-1">
                        <Timer className="h-4 w-4" />
                        <span className="text-white font-bold">{session.linesDrawn}</span>
                      </div>
                      <div className="text-gray-400">lines drawn</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="flex items-center justify-center gap-1">
                        <Bomb className="h-4 w-4 text-red-400" />
                        <span className="text-white font-bold">{session.nukesUsed}</span>
                      </div>
                      <div className="text-gray-400">nukes used</div>
                    </div>
                    <div className="text-center p-3 bg-gray-800/50 rounded-lg">
                      <div className="text-white font-bold">{session.activeViewers}</div>
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
