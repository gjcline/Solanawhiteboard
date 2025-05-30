"use client"

import { useEffect, useState, useRef } from "react" // Added useRef
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
  const [sessionDeleted, setSessionDeleted] = useState(false)

  // Ref for the fullscreen canvas container
  const fullscreenCanvasContainerRef = useRef<HTMLDivElement>(null)

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
            if (!nukeEffect.isActive) {
              // Only show toast once per nuke
              toast({
                title: "☢️ NUKE INCOMING! 💣",
                description: `${data.nukeEffect.user} has nuked the board! Brace for impact!`,
                variant: "destructive",
                duration: 5000,
              })
            }
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
    if (sessionId && sessionExists && !sessionDeleted) {
      // Only check if session is active
      checkNukeEffect()
      const interval = setInterval(checkNukeEffect, 1000) // Check more frequently for nuke
      return () => clearInterval(interval)
    }
  }, [sessionId, sessionExists, sessionDeleted]) // Add sessionExists and sessionDeleted

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

    const validateSession = async () => {
      setIsCheckingSession(true)
      try {
        const response = await fetch(`/api/sessions/${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.session && data.session.streamer_wallet) {
            setSessionExists(true)
            setSessionData(data.session)
            setSessionDeleted(!data.session.is_active)
            if (data.session.is_active) {
              toast({
                title: "Stream View Active",
                description: "Showing live drawings and nuke effects. Share the Draw URL!",
              })
            }
          } else {
            setSessionExists(false)
          }
        } else {
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
  }, [sessionId]) // Removed toast from dependencies to avoid re-triggering

  useEffect(() => {
    if (!sessionId || !sessionExists) return
    const checkSessionStatus = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          if (!data.session?.is_active && !sessionDeleted) {
            setSessionDeleted(true)
            toast({
              title: "Session Ended",
              description: "This drawing session has been deactivated.",
              variant: "destructive",
            })
          } else if (data.session?.is_active && sessionDeleted) {
            setSessionDeleted(false) // Session reactivated
            toast({
              title: "Session Reactivated",
              description: "This drawing session is active again.",
            })
          }
        } else if (response.status === 404 && !sessionDeleted) {
          setSessionDeleted(true)
          toast({
            title: "Session Not Found",
            description: "This drawing session may have been deleted.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error checking session status:", error)
      }
    }
    checkSessionStatus()
    const interval = setInterval(checkSessionStatus, 10000)
    return () => clearInterval(interval)
  }, [sessionId, sessionExists, sessionDeleted, toast]) // Added toast back carefully

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
      title: "URL Copied!",
      description: "Draw URL copied. Share this with viewers!",
    })
  }

  const toggleFullscreen = async () => {
    const elem = document.documentElement
    try {
      if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
          await elem.requestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        }
      }
    } catch (error) {
      console.error("Fullscreen toggle error:", error)
      toast({
        title: "Fullscreen Error",
        description: "Unable to toggle fullscreen mode.",
        variant: "destructive",
      })
    }
  }

  const NukeAnimationOverlay = () => (
    <>
      {nukeEffect.isActive && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          {" "}
          {/* Ensure high z-index */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 to-red-600 opacity-80 animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/50 to-transparent animate-ping" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/30" />
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-bounce opacity-70"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1.5}s`,
                  animationDuration: `${0.5 + Math.random() * 1}s`,
                  transform: `scale(${0.5 + Math.random()})`,
                }}
              />
            ))}
          </div>
          <div className="relative text-center z-10 p-4">
            <div className="text-7xl md:text-9xl mb-4 animate-bounce">💣</div>
            <div className="text-5xl md:text-7xl mb-3 animate-pulse">💥</div>
            <div className="text-3xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg animate-pulse">
              NUCLEAR STRIKE!
            </div>
            <div className="text-xl md:text-3xl font-bold text-yellow-300 mb-2 drop-shadow-lg">
              BOARD NUKED BY <span className="font-mono">{nukeEffect.user.slice(0, 8)}...</span>
            </div>
            <div className="text-lg md:text-2xl text-white drop-shadow-lg">Clearing in {nukeEffect.timeLeft}s</div>
            <div className="mt-5 relative">
              <div className="w-24 h-24 border-4 border-white/30 rounded-full mx-auto relative">
                <div
                  className="absolute inset-0 border-4 border-yellow-400 rounded-full transition-all duration-1000 ease-linear"
                  style={{
                    clipPath: `inset(0 ${100 - (nukeEffect.timeLeft / 10) * 100}% 0 0)`, // Right to left wipe
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl">
                  {nukeEffect.timeLeft}
                </div>
              </div>
            </div>
          </div>
          <style jsx>{`
            @keyframes screenShake {
              0%, 100% { transform: translate(0, 0) rotate(0deg); }
              10% { transform: translate(-3px, -2px) rotate(-0.8deg); }
              20% { transform: translate(3px, 2px) rotate(0.8deg); }
              /* ... more steps for smoother shake ... */
              90% { transform: translate(-3px, -2px) rotate(-0.8deg); }
            }
            .fixed.animate-screen-shake { /* Apply class conditionally if needed */
              animation: screenShake 0.3s cubic-bezier(.36,.07,.19,.97) both infinite;
            }
          `}</style>
        </div>
      )}
    </>
  )

  if (isCheckingSession) {
    return <div className="container mx-auto px-4 py-8 text-center text-white">Loading session...</div>
  }

  if (!sessionExists) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-white">Session Not Found</h1>
        <p className="text-gray-400 mb-6">
          Session ID: <span className="font-mono">{sessionId}</span>
        </p>
        <p className="text-gray-400 mb-6">This drawing session doesn't exist or has been deleted.</p>
        <Link href="/">
          <Button className="pump-button text-black font-semibold">Go Home</Button>
        </Link>
      </div>
    )
  }

  if (sessionDeleted) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-white">Session Ended</h1>
        <p className="text-gray-400 mb-6">
          Session ID: <span className="font-mono">{sessionId}</span>
        </p>
        <p className="text-gray-400 mb-6">This drawing session has been deactivated.</p>
        <Link href="/">
          <Button className="pump-button text-black font-semibold">Go Home</Button>
        </Link>
        <div className="mt-8 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-4">Final Artwork</h3>
          <div className="pump-card p-4 rounded-lg border-gray-800">
            <DrawingCanvas isReadOnly={true} sessionId={sessionId} isFullscreen={false} />
          </div>
        </div>
      </div>
    )
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-stretch">
        {" "}
        {/* Ensure children can stretch */}
        <NukeAnimationOverlay />
        {/* Top Bar in Fullscreen */}
        <div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-center bg-black/50 backdrop-blur-sm">
          <div className="pump-card p-2 rounded-lg border-[#00ff88]/50 bg-black/80">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#00ff88]" />
              <span className="text-white font-semibold">
                Session: <span className="pump-text-gradient">{sessionId.slice(0, 12)}...</span>
              </span>
            </div>
          </div>
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="bg-black/80 border-gray-700 text-white hover:bg-gray-700"
          >
            <X className="h-4 w-4 mr-2" /> Exit Fullscreen
          </Button>
        </div>
        {/* Canvas Container - Takes up remaining space */}
        <div
          ref={fullscreenCanvasContainerRef}
          className="flex-1 mt-16 mb-16 p-4 flex items-center justify-center overflow-hidden"
        >
          {" "}
          {/* Added mt and mb for top/bottom bars, overflow-hidden */}
          <DrawingCanvas
            key={`fullscreen-canvas-${sessionId}`} // More specific key
            isReadOnly={true}
            sessionId={sessionId}
            isFullscreen={true}
            containerRef={fullscreenCanvasContainerRef} // Pass the ref
          />
        </div>
        {/* Bottom Info Bar in Fullscreen */}
        <div className="absolute bottom-0 left-0 right-0 p-2 z-50 bg-black/50 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-300">
            <span className="flex items-center gap-1">
              <Timer className="h-3 w-3" /> 0.005 SOL/line
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> 0.02 SOL/bundle
            </span>
            <span className="flex items-center gap-1">
              <Bomb className="h-3 w-3 text-red-400" /> 0.03 SOL/nuke
            </span>
            <span className="text-[#00ff88]">50% revenue share</span>
            <span className="pump-text-gradient font-medium">draw.fun</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <DrawingBackground density={8} speed={0.15} />
      <NukeAnimationOverlay />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Stream View</h1>
          <p className="text-gray-400">
            Session: <span className="pump-text-gradient">{sessionId}</span>
          </p>
          {sessionData?.streamer_wallet && (
            <p className="text-xs text-gray-500 mt-1">
              Streamer: {sessionData.streamer_wallet.slice(0, 6)}...{sessionData.streamer_wallet.slice(-4)}
            </p>
          )}
        </div>
        <Button onClick={toggleFullscreen} className="pump-button text-black font-semibold">
          <Maximize className="h-4 w-4 mr-2" /> Fullscreen
        </Button>
      </div>

      <Card className="mb-4 pump-card border-[#00ff88]/50 bg-gradient-to-r from-[#00ff88]/5 to-[#00cc6a]/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="pump-gradient p-2 rounded-lg">
                <Zap className="h-4 w-4 text-black" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Viewer Token URL</h3>
                <p className="text-xs text-gray-400">Share for token purchases</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="flex-1 p-2 bg-black/50 rounded border border-gray-700 font-mono text-xs text-[#00ff88] truncate">
                {drawUrl}
              </div>
              <Button onClick={copyDrawUrl} size="sm" className="pump-button text-black font-semibold">
                <Copy className="h-3 w-3" />
              </Button>
              <Link href={drawUrl} target="_blank">
                <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Timer className="h-3 w-3" /> 0.005 SOL/line
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> 0.02 SOL/bundle
            </span>
            <span className="flex items-center gap-1">
              <Bomb className="h-3 w-3 text-red-400" /> 0.03 SOL/nuke
            </span>
            <span className="text-[#00ff88]">50% to you</span>
          </div>
        </CardContent>
      </Card>

      <div className="pump-card p-4 rounded-lg border-gray-800">
        <DrawingCanvas
          key={`normal-canvas-${sessionId}`}
          isReadOnly={true}
          sessionId={sessionId}
          isFullscreen={false}
        />
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-500 text-sm">Whiteboard syncs in real-time. Viewer drawings appear automatically!</p>
        <p className="text-gray-600 text-xs mt-2">
          Made by <span className="pump-text-gradient">D3vCav3</span> • Powered by draw.fun • 50/50 revenue split
        </p>
      </div>
    </div>
  )
}
