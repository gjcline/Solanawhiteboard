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

interface NukeEffect {
  isActive: boolean
  user: string
  timeLeft: number
  startTime: number
}

export default function ViewPage() {
  const params = useParams()
  const sessionId = params.sessionId as string
  const [sessionExists, setSessionExists] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [sessionData, setSessionData] = useState<any>(null)
  const [drawUrl, setDrawUrl] = useState("")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [nukeEffect, setNukeEffect] = useState<NukeEffect>({
    isActive: false,
    user: "",
    timeLeft: 0,
    startTime: 0,
  })
  const { toast } = useToast()

  // Add new state for session status
  const [sessionDeleted, setSessionDeleted] = useState(false)

  // Check for nuke effects
  const checkNukeEffect = async () => {
    if (!sessionId) return

    try {
      const response = await fetch(`/api/sessions/${sessionId}/nuke`)
      if (response.ok) {
        const data = await response.json()
        if (data.nukeEffect && data.nukeEffect.isActive) {
          const timeElapsed = Date.now() - data.nukeEffect.startTime
          const timeLeft = 10000 - timeElapsed // 10 second effect

          if (timeLeft > 0) {
            setNukeEffect({
              isActive: true,
              user: data.nukeEffect.user,
              timeLeft: Math.ceil(timeLeft / 1000),
              startTime: data.nukeEffect.startTime,
            })
          } else {
            setNukeEffect({ isActive: false, user: "", timeLeft: 0, startTime: 0 })
          }
        } else {
          setNukeEffect({ isActive: false, user: "", timeLeft: 0, startTime: 0 })
        }
      }
    } catch (error) {
      console.error("Error checking nuke effect:", error)
    }
  }

  // Setup nuke effect checking
  useEffect(() => {
    if (sessionId) {
      // Check immediately
      checkNukeEffect()

      // Check every 500ms for real-time nuke effects
      const interval = setInterval(checkNukeEffect, 500)

      return () => clearInterval(interval)
    }
  }, [sessionId])

  // Update nuke timer
  useEffect(() => {
    if (nukeEffect.isActive && nukeEffect.timeLeft > 0) {
      const timer = setTimeout(() => {
        setNukeEffect((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }))
      }, 1000)

      return () => clearTimeout(timer)
    } else if (nukeEffect.isActive && nukeEffect.timeLeft <= 0) {
      setNukeEffect({ isActive: false, user: "", timeLeft: 0, startTime: 0 })
    }
  }, [nukeEffect])

  useEffect(() => {
    if (!sessionId) return

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
    setDrawUrl(`${baseUrl}/draw/${sessionId}`)

    // Validate session exists via API
    const validateSession = async () => {
      setIsCheckingSession(true)
      console.log("Validating session:", sessionId)

      try {
        const response = await fetch(`/api/sessions/${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          console.log("Session validation response:", data)

          if (data.session && data.session.streamer_wallet) {
            setSessionExists(true)
            setSessionData(data.session)
            setSessionDeleted(!data.session.is_active)
            console.log("Session validated successfully")
          } else {
            console.log("Session validation failed - missing data")
            setSessionExists(false)
          }
        } else if (response.status === 404) {
          console.log("Session not found")
          setSessionExists(false)
        } else {
          console.log("Session validation failed - HTTP error:", response.status)
          setSessionExists(false)
        }
      } catch (error) {
        console.error("Session validation error:", error)
        setSessionExists(false)
      } finally {
        setIsCheckingSession(false)
      }
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
    if (!sessionId || !sessionExists) return

    const checkSessionStatus = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          if (!data.session?.is_active) {
            setSessionDeleted(true)
            if (!sessionDeleted) {
              toast({
                title: "session ended",
                description: "this drawing session has been deactivated.",
                variant: "destructive",
              })
            }
          }
        } else if (response.status === 404) {
          setSessionDeleted(true)
        }
      } catch (error) {
        console.error("Error checking session status:", error)
      }
    }

    // Check immediately
    checkSessionStatus()

    // Check every 10 seconds for real-time updates
    const interval = setInterval(checkSessionStatus, 10000)

    return () => clearInterval(interval)
  }, [sessionId, sessionExists, sessionDeleted, toast])

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
        <p className="text-gray-400 mb-6">this drawing session has been deactivated and is no longer active.</p>
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
        {/* Dramatic Nuke Effect Overlay - FULLSCREEN VERSION */}
        {nukeEffect.isActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Animated background with multiple layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 opacity-80 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/50 to-transparent animate-ping" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/30" />

            {/* Explosion particles effect */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`,
                  }}
                />
              ))}
            </div>

            {/* Main content */}
            <div className="relative text-center z-10">
              <div className="text-8xl mb-6 animate-bounce">💣</div>
              <div className="text-6xl mb-4 animate-pulse">💥</div>
              <div className="text-4xl font-bold text-white mb-4 drop-shadow-lg animate-pulse">NUCLEAR STRIKE!</div>
              <div className="text-2xl font-bold text-yellow-300 mb-2 drop-shadow-lg">
                BOARD NUKED BY {nukeEffect.user}
              </div>
              <div className="text-xl text-white drop-shadow-lg">Devastation ends in {nukeEffect.timeLeft}s</div>

              {/* Countdown circle */}
              <div className="mt-6 relative">
                <div className="w-20 h-20 border-4 border-white/30 rounded-full mx-auto relative">
                  <div
                    className="absolute inset-0 border-4 border-yellow-400 rounded-full transition-all duration-1000"
                    style={{
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + (nukeEffect.timeLeft / 10) * 50}% 0%, ${50 + (nukeEffect.timeLeft / 10) * 50}% 100%, 50% 100%)`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl">
                    {nukeEffect.timeLeft}
                  </div>
                </div>
              </div>
            </div>

            {/* Screen shake effect */}
            <style jsx>{`
          @keyframes screenShake {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            10% { transform: translate(-2px, -1px) rotate(-0.5deg); }
            20% { transform: translate(2px, 1px) rotate(0.5deg); }
            30% { transform: translate(-1px, 2px) rotate(-0.5deg); }
            40% { transform: translate(1px, -2px) rotate(0.5deg); }
            50% { transform: translate(-2px, 1px) rotate(-0.5deg); }
            60% { transform: translate(2px, -1px) rotate(0.5deg); }
            70% { transform: translate(-1px, -2px) rotate(-0.5deg); }
            80% { transform: translate(1px, 2px) rotate(0.5deg); }
            90% { transform: translate(-2px, -1px) rotate(-0.5deg); }
          }
          .fixed {
            animation: screenShake 0.5s infinite;
          }
        `}</style>
          </div>
        )}

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
        <div className="flex-1 px-4 pb-4 pt-20 flex items-center justify-center">
          {" "}
          {/* Adjusted padding, added flex centering */}
          <DrawingCanvas key={isFullscreen.toString()} isReadOnly={true} sessionId={sessionId} isFullscreen={true} />{" "}
          {/* Added key */}
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

      {/* Dramatic Nuke Effect Overlay - NORMAL VERSION */}
      {nukeEffect.isActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Animated background with multiple layers */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 opacity-80 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/50 to-transparent animate-ping" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/30" />

          {/* Explosion particles effect */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
          </div>

          {/* Main content */}
          <div className="relative text-center z-10">
            <div className="text-8xl mb-6 animate-bounce">💣</div>
            <div className="text-6xl mb-4 animate-pulse">💥</div>
            <div className="text-4xl font-bold text-white mb-4 drop-shadow-lg animate-pulse">NUCLEAR STRIKE!</div>
            <div className="text-2xl font-bold text-yellow-300 mb-2 drop-shadow-lg">
              BOARD NUKED BY {nukeEffect.user}
            </div>
            <div className="text-xl text-white drop-shadow-lg">Devastation ends in {nukeEffect.timeLeft}s</div>

            {/* Countdown circle */}
            <div className="mt-6 relative">
              <div className="w-20 h-20 border-4 border-white/30 rounded-full mx-auto relative">
                <div
                  className="absolute inset-0 border-4 border-yellow-400 rounded-full transition-all duration-1000"
                  style={{
                    clipPath: `polygon(50% 50%, 50% 0%, ${50 + (nukeEffect.timeLeft / 10) * 50}% 0%, ${50 + (nukeEffect.timeLeft / 10) * 50}% 100%, 50% 100%)`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl">
                  {nukeEffect.timeLeft}
                </div>
              </div>
            </div>
          </div>

          {/* Screen shake effect */}
          <style jsx>{`
        @keyframes screenShake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-2px, -1px) rotate(-0.5deg); }
          20% { transform: translate(2px, 1px) rotate(0.5deg); }
          30% { transform: translate(-1px, 2px) rotate(-0.5deg); }
          40% { transform: translate(1px, -2px) rotate(0.5deg); }
          50% { transform: translate(-2px, 1px) rotate(-0.5deg); }
          60% { transform: translate(2px, -1px) rotate(0.5deg); }
          70% { transform: translate(-1px, -2px) rotate(-0.5deg); }
          80% { transform: translate(1px, 2px) rotate(0.5deg); }
          90% { transform: translate(-2px, -1px) rotate(-0.5deg); }
        }
        .fixed {
          animation: screenShake 0.5s infinite;
        }
      `}</style>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">stream view</h1>
          <p className="text-gray-400">
            session: <span className="pump-text-gradient">{sessionId}</span>
          </p>
          {sessionData?.streamer_wallet && (
            <p className="text-xs text-gray-500 mt-1">
              streamer wallet: {sessionData.streamer_wallet.slice(0, 8)}...{sessionData.streamer_wallet.slice(-4)}
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
          this whiteboard syncs in real-time with the database. drawings from viewers appear here automatically!
        </p>
        <p className="text-gray-600 text-xs mt-2">
          made with ❤️ by <span className="pump-text-gradient">D3vCav3</span> • powered by draw.fun • 50/50 revenue split
        </p>
      </div>
    </div>
  )
}
