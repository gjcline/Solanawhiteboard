"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import DrawingCanvas from "@/components/drawing-canvas"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, ExternalLink, Zap, Timer, Bomb, DollarSign, Maximize, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import DrawingBackground from "@/components/drawing-background"

export default function ViewPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const [sessionExists, setSessionExists] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [streamerWallet, setStreamerWallet] = useState<string | null>(null)
  const [drawUrl, setDrawUrl] = useState("")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { toast } = useToast()

  // Add new state for session status
  const [sessionDeleted, setSessionDeleted] = useState(false)
  const [deletedInfo, setDeletedInfo] = useState<{ deletedAt: number; deletedBy: string } | null>(null)

  useEffect(() => {
    if (!sessionId) return

    setDrawUrl(`${window.location.origin}/draw/${sessionId}`)

    // Validate session exists
    const validateSession = () => {
      setIsCheckingSession(true)
      console.log("Validating session:", sessionId)

      // Method 1: Check for session-specific wallet
      const sessionWallet = localStorage.getItem(`session-wallet-${sessionId}`)
      console.log("Session wallet found:", sessionWallet)

      if (sessionWallet) {
        setStreamerWallet(sessionWallet)
        setSessionExists(true)
        setIsCheckingSession(false)
        console.log("Session validated via session-wallet")
        return
      }

      // Method 2: Try to find the session in any user's sessions
      const allKeys = Object.keys(localStorage)
      console.log("All localStorage keys:", allKeys)

      let sessionFound = false
      let foundWallet = null

      for (const key of allKeys) {
        if (key.startsWith("sessions-")) {
          try {
            const sessions = JSON.parse(localStorage.getItem(key) || "[]")
            console.log(`Checking sessions in ${key}:`, sessions)

            const session = sessions.find((s: any) => s.id === sessionId)
            if (session) {
              sessionFound = true
              console.log("Session found in:", key, session)

              // Try to get the wallet for this session's owner
              const userId = key.replace("sessions-", "")
              const userWallet = localStorage.getItem(`wallet-${userId}`)
              console.log("User wallet for", userId, ":", userWallet)

              if (userWallet) {
                foundWallet = userWallet
                // Save it as session-specific wallet for future reference
                localStorage.setItem(`session-wallet-${sessionId}`, userWallet)
              }
              break
            }
          } catch (error) {
            console.error("Error parsing sessions from", key, ":", error)
          }
        }
      }

      // Method 3: Check for default wallet as fallback
      if (!sessionFound) {
        const defaultWallet = localStorage.getItem("whiteboard-recipient-wallet")
        console.log("Default wallet:", defaultWallet)

        if (defaultWallet) {
          foundWallet = defaultWallet
          sessionFound = true
          localStorage.setItem(`session-wallet-${sessionId}`, defaultWallet)
          console.log("Using default wallet for session")
        }
      }

      // Method 4: Create demo session if nothing found
      if (!sessionFound) {
        console.log("Session not found, creating demo session")
        const defaultWallet = localStorage.getItem("whiteboard-recipient-wallet") || "DemoWallet123456789"
        localStorage.setItem(`session-wallet-${sessionId}`, defaultWallet)
        foundWallet = defaultWallet
        sessionFound = true

        toast({
          title: "demo session created",
          description: "this is a demo session. create proper sessions from the dashboard.",
        })
      }

      setStreamerWallet(foundWallet)
      setSessionExists(sessionFound)
      setIsCheckingSession(false)

      console.log("Final session state:", { sessionFound, foundWallet })
    }

    validateSession()

    if (sessionExists) {
      toast({
        title: "stream view active",
        description: "this shows live drawing and nuke effects. share the draw URL with viewers!",
      })
    }
  }, [sessionId, toast])

  // Add useEffect to check for session deletion in real-time
  useEffect(() => {
    if (!sessionId) return

    const checkSessionStatus = () => {
      const deletedData = localStorage.getItem(`session-deleted-${sessionId}`)
      if (deletedData) {
        const deleted = JSON.parse(deletedData)
        setSessionDeleted(true)
        setDeletedInfo(deleted)

        if (!sessionDeleted) {
          toast({
            title: "session ended",
            description: "this drawing session has been deleted.",
            variant: "destructive",
          })
        }
      }
    }

    // Check immediately
    checkSessionStatus()

    // Check every 2 seconds for real-time updates
    const interval = setInterval(checkSessionStatus, 2000)

    return () => clearInterval(interval)
  }, [sessionId, sessionDeleted, toast])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const copyDrawUrl = () => {
    navigator.clipboard.writeText(drawUrl)
    toast({
      title: "URL copied!",
      description: "draw URL copied. share this with viewers to start token sales!",
    })
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch (error) {
      toast({
        title: "fullscreen error",
        description: "unable to toggle fullscreen mode.",
        variant: "destructive",
      })
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch (error) {
      console.error("Error exiting fullscreen:", error)
    }
  }

  // Show loading state while checking session
  if (isCheckingSession) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-white">loading session...</h1>
        <p className="text-gray-400">checking session: {sessionId}</p>
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
        <div className="space-y-4">
          <Link href="/">
            <Button className="pump-button text-black font-semibold">go home</Button>
          </Link>
          <div className="text-xs text-gray-500">
            <p>Debug info:</p>
            <p>Session ID: {sessionId}</p>
            <p>Streamer Wallet: {streamerWallet || "Not found"}</p>
          </div>
        </div>
      </div>
    )
  }

  // Update the return JSX to show deleted session message
  if (sessionDeleted) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-white">session ended</h1>
        <p className="text-gray-400 mb-6">
          session ID: <span className="font-mono">{sessionId}</span>
        </p>
        <p className="text-gray-400 mb-6">this drawing session has been deleted and is no longer active.</p>
        {deletedInfo && (
          <p className="text-xs text-gray-500 mb-6">
            session ended on {new Date(deletedInfo.deletedAt).toLocaleString()}
          </p>
        )}
        <div className="space-y-4">
          <Link href="/">
            <Button className="pump-button text-black font-semibold">go home</Button>
          </Link>
        </div>

        {/* Show final canvas state */}
        <div className="mt-8 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-4">final artwork</h3>
          <div className="pump-card p-4 rounded-lg border-gray-800">
            <DrawingCanvas isReadOnly={true} sessionId={sessionId} isFullscreen={false} />
          </div>
        </div>
      </div>
    )
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col">
        {/* Account for navbar height - typically 64px (h-16) */}
        <div className="h-16 flex-shrink-0"></div>

        {/* Fullscreen Session ID Overlay - positioned below navbar */}
        <div className="absolute top-20 left-4 right-4 z-40 flex items-center justify-between">
          <div className="pump-card p-3 rounded-lg border-[#00ff88]/50 bg-black/90 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="pump-gradient p-2 rounded-lg">
                <Zap className="h-4 w-4 text-black" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Session ID</div>
                <div className="text-lg font-bold pump-text-gradient">{sessionId}</div>
              </div>
              <div className="ml-4 text-xs text-gray-400">
                <div>Viewers: Enter this ID at draw.fun</div>
                <div className="text-[#00ff88]">Live Stream View</div>
              </div>
            </div>
          </div>

          <Button
            onClick={exitFullscreen}
            variant="outline"
            size="sm"
            className="bg-black/90 backdrop-blur-md border-gray-700 text-white hover:bg-gray-800"
          >
            <X className="h-4 w-4 mr-2" />
            Exit Fullscreen
          </Button>
        </div>

        {/* Fullscreen Canvas - takes remaining space below navbar and session ID */}
        <div className="flex-1 p-4 pt-24">
          <DrawingCanvas isReadOnly={true} sessionId={sessionId} isFullscreen={true} />
        </div>

        {/* Bottom Info Bar */}
        <div className="absolute bottom-4 left-4 right-4 z-40">
          <div className="pump-card p-2 rounded-lg bg-black/70 backdrop-blur-md border-[#00ff88]/30">
            <div className="flex items-center justify-center gap-6 text-xs text-gray-300">
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                0.005 SOL/line
              </span>
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                0.02 SOL/bundle
              </span>
              <span className="flex items-center gap-1">
                <Bomb className="h-3 w-3 text-red-400" />
                0.03 SOL/nuke
              </span>
              <span className="text-[#00ff88]">50% revenue share</span>
              <span className="text-gray-500">•</span>
              <span className="pump-text-gradient font-medium">draw.fun by D3vCav3</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <DrawingBackground density={8} speed={0.15} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">stream view</h1>
          <p className="text-gray-400">
            session: <span className="pump-text-gradient">{sessionId}</span>
          </p>
          {streamerWallet && (
            <p className="text-xs text-gray-500 mt-1">
              streamer wallet: {streamerWallet.slice(0, 8)}...{streamerWallet.slice(-4)}
            </p>
          )}
        </div>
        <Button onClick={toggleFullscreen} className="pump-button text-black font-semibold">
          <Maximize className="h-4 w-4 mr-2" />
          fullscreen
        </Button>
      </div>

      {/* Compact URL Display for Stream */}
      <Card className="mb-4 pump-card border-[#00ff88]/50 bg-gradient-to-r from-[#00ff88]/5 to-[#00cc6a]/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="pump-gradient p-2 rounded-lg">
                <Zap className="h-4 w-4 text-black" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Viewer Token URL</h3>
                <p className="text-xs text-gray-400">Share this link for token purchases</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="flex-1 p-2 bg-black/50 rounded border border-gray-700 font-mono text-xs text-[#00ff88] truncate">
                {drawUrl}
              </div>
              <Button onClick={copyDrawUrl} size="sm" className="pump-button text-black font-semibold">
                <Copy className="h-3 w-3" />
              </Button>
              <Link href={drawUrl}>
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Compact pricing info */}
          <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              0.005 SOL/line
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              0.02 SOL/bundle
            </span>
            <span className="flex items-center gap-1">
              <Bomb className="h-3 w-3 text-red-400" />
              0.03 SOL/nuke
            </span>
            <span className="text-[#00ff88]">50% to you</span>
          </div>
        </CardContent>
      </Card>

      {/* Whiteboard Display */}
      <div className="pump-card p-4 rounded-lg border-gray-800">
        <DrawingCanvas isReadOnly={true} sessionId={sessionId} isFullscreen={false} />
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-500 text-sm">
          this whiteboard updates in real-time as viewers purchase tokens and draw. display this view on your stream!
        </p>
        <p className="text-gray-600 text-xs mt-2">
          made with ❤️ by <span className="pump-text-gradient">D3vCav3</span> • powered by draw.fun • 50/50 revenue split
        </p>
      </div>
    </div>
  )
}
