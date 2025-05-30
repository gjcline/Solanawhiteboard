"use client"

import type React from "react"

import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Paintbrush, AlertCircle, Bomb, Timer, Trash2, Wifi, WifiOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DRAWING_TIME_LIMIT } from "@/lib/pricing"

// Sync settings
const SYNC_INTERVAL = 2000 // 2 seconds
const SAVE_DELAY = 500 // 0.5 seconds after drawing stops

interface UserTokens {
  lines: number
  nukes: number
  bundle_tokens?: number
}

interface DrawingCanvasProps {
  isReadOnly: boolean
  sessionId?: string
  walletAddress?: string | null
  userTokens?: UserTokens
  onTokenUsed?: (type: "line" | "nuke") => void
  isFullscreen?: boolean
}

interface NukeEffect {
  isActive: boolean
  user: string
  timeLeft: number
}

export default function DrawingCanvas({
  isReadOnly,
  sessionId,
  walletAddress,
  userTokens = { lines: 0, nukes: 0 },
  onTokenUsed,
  isFullscreen = false,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [color, setColor] = useState("#000000")
  const [brushSize, setBrushSize] = useState([5])
  const [drawingStartTime, setDrawingStartTime] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(DRAWING_TIME_LIMIT)
  const [nukeEffect, setNukeEffect] = useState<NukeEffect>({ isActive: false, user: "", timeLeft: 0 })
  const lastPositionRef = useRef({ x: 0, y: 0 })
  const drawingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const nukeTimerRef = useRef<NodeJS.Timeout | null>(null)
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastCanvasDataRef = useRef<string>("")
  const isCanvasReadyRef = useRef(false)
  const { toast } = useToast()

  // Sync status
  const [syncStatus, setSyncStatus] = useState<"connected" | "disconnected" | "syncing">("disconnected")
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [sessionDeleted, setSessionDeleted] = useState(false)
  const [tokenValidated, setTokenValidated] = useState(false)

  // Debug info
  const [debugInfo, setDebugInfo] = useState<{
    lastSaveAttempt: string | null
    lastSaveResult: string | null
    lastLoadAttempt: string | null
    lastLoadResult: string | null
  }>({
    lastSaveAttempt: null,
    lastSaveResult: null,
    lastLoadAttempt: null,
    lastLoadResult: null,
  })

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const setupCanvas = () => {
      console.log(`[Canvas] Setting up canvas`)

      const containerRect = container.getBoundingClientRect()
      const newWidth = containerRect.width
      const newHeight = isFullscreen ? containerRect.height : Math.max(500, containerRect.height)

      canvas.width = newWidth
      canvas.height = newHeight

      const context = canvas.getContext("2d")
      if (context) {
        context.lineCap = "round"
        context.lineJoin = "round"
        context.strokeStyle = color
        context.lineWidth = brushSize[0]
        setCtx(context)
        isCanvasReadyRef.current = true
        console.log(`[Canvas] Canvas ready - ${newWidth}x${newHeight}`)
      }
    }

    setupCanvas()

    const handleResize = () => setupCanvas()
    const handleFullscreenChange = () => setTimeout(setupCanvas, 100)

    window.addEventListener("resize", handleResize)
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [isFullscreen, color, brushSize])

  // Load canvas from server
  const loadCanvasFromServer = useCallback(async () => {
    if (!sessionId || !isCanvasReadyRef.current || !canvasRef.current || !ctx) {
      console.log(`[Canvas Load] Skipping - not ready`)
      return
    }

    try {
      setSyncStatus("syncing")
      const timestamp = Date.now()
      setDebugInfo((prev) => ({ ...prev, lastLoadAttempt: new Date().toISOString() }))
      console.log(`[Canvas Load] Loading for session: ${sessionId}`)

      const response = await fetch(`/api/sessions/${sessionId}/canvas?t=${timestamp}`)

      if (!response.ok) {
        console.error(`[Canvas Load] HTTP error: ${response.status}`)
        setSyncStatus("disconnected")
        setDebugInfo((prev) => ({ ...prev, lastLoadResult: `Error: ${response.status}` }))
        if (response.status === 404) {
          setSessionDeleted(true)
        }
        return
      }

      const data = await response.json()
      console.log(`[Canvas Load] Response:`, {
        hasData: !!data.canvasData,
        dataLength: data.canvasData?.length || 0,
        lastUpdated: data.lastUpdated,
      })

      setDebugInfo((prev) => ({
        ...prev,
        lastLoadResult: `Success: ${data.canvasData ? "Has data" : "No data"} (${data.canvasData?.length || 0} bytes)`,
      }))

      if (data.canvasData && data.canvasData !== lastCanvasDataRef.current) {
        console.log(`[Canvas Load] New data detected, updating canvas`)

        const img = new Image()
        img.crossOrigin = "anonymous"

        img.onload = () => {
          if (ctx && canvasRef.current) {
            console.log(`[Canvas Load] Drawing image to canvas`)
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
            ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height)
            lastCanvasDataRef.current = data.canvasData
            setSyncStatus("connected")
            setLastSyncTime(new Date())
          }
        }

        img.onerror = (error) => {
          console.error("[Canvas Load] Image load error:", error)
          setSyncStatus("disconnected")
          setDebugInfo((prev) => ({ ...prev, lastLoadResult: `Image error: ${error}` }))
        }

        img.src = data.canvasData
      } else {
        console.log(`[Canvas Load] No new data`)
        setSyncStatus("connected")
        setLastSyncTime(new Date())
      }
    } catch (error) {
      console.error("[Canvas Load] Error:", error)
      setSyncStatus("disconnected")
      setDebugInfo((prev) => ({ ...prev, lastLoadResult: `Exception: ${error}` }))
    }
  }, [sessionId, ctx])

  // Save canvas to server with better error handling
  const saveCanvasToServer = useCallback(async () => {
    if (!sessionId || !canvasRef.current || isReadOnly || !isCanvasReadyRef.current) {
      console.log(`[Canvas Save] Skipping - not ready or read-only`)
      return
    }

    try {
      console.log(`[Canvas Save] Saving for session: ${sessionId}`)
      setDebugInfo((prev) => ({ ...prev, lastSaveAttempt: new Date().toISOString() }))

      // Get canvas data as data URL
      const dataUrl = canvasRef.current.toDataURL("image/png", 0.8) // Add compression

      // Only save if data has changed
      if (dataUrl === lastCanvasDataRef.current) {
        console.log(`[Canvas Save] No changes, skipping save`)
        return
      }

      console.log(`[Canvas Save] Data changed, saving to server - Length: ${dataUrl.length}`)

      // Use the test endpoint first to verify we can write to the database
      const testResponse = await fetch(`/api/test-db-write?sessionId=${sessionId}`)
      const testResult = await testResponse.json()

      console.log(`[Canvas Save] Test write result:`, testResult)

      if (!testResult.success) {
        console.error(`[Canvas Save] Test write failed:`, testResult.error)
        setDebugInfo((prev) => ({ ...prev, lastSaveResult: `Test failed: ${testResult.error}` }))
        return
      }

      // Now try the actual save
      const response = await fetch(`/api/sessions/${sessionId}/canvas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ canvasData: dataUrl }),
      })

      const responseText = await response.text()
      console.log(`[Canvas Save] Response status: ${response.status}`)
      console.log(`[Canvas Save] Response text: ${responseText}`)

      setDebugInfo((prev) => ({
        ...prev,
        lastSaveResult: `Status: ${response.status}, Response: ${responseText.substring(0, 50)}...`,
      }))

      if (response.ok) {
        try {
          const result = JSON.parse(responseText)
          console.log(`[Canvas Save] SUCCESS:`, result)
          lastCanvasDataRef.current = dataUrl
          setSyncStatus("connected")
          setLastSyncTime(new Date())
        } catch (parseError) {
          console.error(`[Canvas Save] Response parse error:`, parseError)
        }
      } else {
        console.error(`[Canvas Save] HTTP error: ${response.status} - ${responseText}`)
        setSyncStatus("disconnected")
        if (response.status === 404) {
          setSessionDeleted(true)
        }
      }
    } catch (error) {
      console.error("[Canvas Save] Error:", error)
      setSyncStatus("disconnected")
      setDebugInfo((prev) => ({ ...prev, lastSaveResult: `Exception: ${error}` }))
    }
  }, [sessionId, isReadOnly])

  // Initial load when canvas is ready
  useEffect(() => {
    if (isCanvasReadyRef.current && sessionId && ctx) {
      console.log(`[Canvas] Initial load triggered`)
      setTimeout(() => {
        loadCanvasFromServer()
      }, 500) // Increased delay
    }
  }, [sessionId, ctx, loadCanvasFromServer])

  // Setup sync timer for read-only views
  useEffect(() => {
    if (isReadOnly && sessionId && isCanvasReadyRef.current) {
      console.log(`[Canvas] Setting up sync timer (${SYNC_INTERVAL}ms)`)

      syncTimerRef.current = setInterval(() => {
        console.log(`[Canvas] Sync timer tick`)
        loadCanvasFromServer()
      }, SYNC_INTERVAL)

      return () => {
        console.log(`[Canvas] Cleaning up sync timer`)
        if (syncTimerRef.current) {
          clearInterval(syncTimerRef.current)
        }
      }
    }
  }, [isReadOnly, sessionId, loadCanvasFromServer])

  // Update context when color or brush size changes
  useEffect(() => {
    if (ctx) {
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize[0]
    }
  }, [color, brushSize, ctx])

  // Check for nuke effects
  useEffect(() => {
    if (isReadOnly && sessionId) {
      const checkForNuke = setInterval(() => {
        try {
          const nukeData = localStorage.getItem(`whiteboard-nuke-${sessionId}`)
          if (nukeData) {
            const nuke = JSON.parse(nukeData)
            const timeElapsed = Date.now() - nuke.timestamp
            const timeLeft = 10000 - timeElapsed

            if (timeLeft > 0) {
              setNukeEffect({
                isActive: true,
                user: nuke.user,
                timeLeft: Math.ceil(timeLeft / 1000),
              })
            } else {
              setNukeEffect({ isActive: false, user: "", timeLeft: 0 })
              localStorage.removeItem(`whiteboard-nuke-${sessionId}`)
            }
          }
        } catch (error) {
          console.error("Error checking for nuke effects:", error)
        }
      }, 100)

      return () => clearInterval(checkForNuke)
    }
  }, [isReadOnly, sessionId])

  // Update nuke timer
  useEffect(() => {
    if (nukeEffect.isActive && nukeEffect.timeLeft > 0) {
      nukeTimerRef.current = setTimeout(() => {
        setNukeEffect((prev) => ({ ...prev, timeLeft: prev.timeLeft - 1 }))
      }, 1000)
    }

    return () => {
      if (nukeTimerRef.current) {
        clearTimeout(nukeTimerRef.current)
      }
    }
  }, [nukeEffect])

  const getPointerPosition = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement,
  ) => {
    const rect = canvas.getBoundingClientRect()
    let x, y

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    x = (x * canvas.width) / rect.width
    y = (y * canvas.height) / rect.height

    return { x, y }
  }

  // Token validation
  const validateTokenBeforeDrawing = async (): Promise<boolean> => {
    if (!sessionId || !walletAddress) {
      toast({
        title: "validation failed",
        description: "session ID and wallet required for drawing.",
        variant: "destructive",
      })
      return false
    }

    try {
      const response = await fetch(`/api/tokens/${sessionId}?wallet=${walletAddress}`)
      if (!response.ok) {
        toast({
          title: "token check failed",
          description: "unable to verify token balance.",
          variant: "destructive",
        })
        return false
      }

      const data = await response.json()
      const serverTokens = data.tokens

      if (!serverTokens || (serverTokens.line_tokens <= 0 && serverTokens.bundle_tokens <= 0)) {
        toast({
          title: "no line tokens",
          description: "purchase line tokens to start drawing.",
          variant: "destructive",
        })
        return false
      }

      setTokenValidated(true)
      return true
    } catch (error) {
      console.error("Token validation error:", error)
      toast({
        title: "validation error",
        description: "failed to validate tokens. please try again.",
        variant: "destructive",
      })
      return false
    }
  }

  const startDrawing = async (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isReadOnly || !ctx || !canvasRef.current || !isCanvasReadyRef.current) return

    e.preventDefault()

    if (sessionDeleted) {
      toast({
        title: "session ended",
        description: "this session has been deleted. no more drawing allowed.",
        variant: "destructive",
      })
      return
    }

    if (!walletAddress) {
      toast({
        title: "wallet required",
        description: "connect your wallet to start drawing.",
        variant: "destructive",
      })
      return
    }

    const clientHasTokens =
      userTokens.lines > 0 || (userTokens && "bundle_tokens" in userTokens && (userTokens as any).bundle_tokens > 0)
    if (!clientHasTokens) {
      toast({
        title: "no line tokens",
        description: "purchase line tokens to start drawing.",
        variant: "destructive",
      })
      return
    }

    const isValid = await validateTokenBeforeDrawing()
    if (!isValid) {
      return
    }

    console.log(`[Canvas] Starting drawing`)
    setIsDrawing(true)
    setDrawingStartTime(Date.now())
    setTimeLeft(DRAWING_TIME_LIMIT)

    drawingTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 100
        if (newTime <= 0) {
          stopDrawing(true)
          return 0
        }
        return newTime
      })
    }, 100)

    const canvas = canvasRef.current
    const { x, y } = getPointerPosition(e, canvas)
    lastPositionRef.current = { x, y }

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isReadOnly || !isDrawing || !ctx || !canvasRef.current || !tokenValidated) return

    e.preventDefault()

    const canvas = canvasRef.current
    const { x, y } = getPointerPosition(e, canvas)

    ctx.beginPath()
    ctx.moveTo(lastPositionRef.current.x, lastPositionRef.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()

    lastPositionRef.current = { x, y }
  }

  const stopDrawing = (timeExpired = false) => {
    if (isReadOnly || !ctx || !canvasRef.current) return

    if (!isDrawing || !tokenValidated) return

    console.log(`[Canvas] Stopping drawing`)
    setIsDrawing(false)
    setDrawingStartTime(null)
    setTimeLeft(DRAWING_TIME_LIMIT)
    setTokenValidated(false)

    if (drawingTimerRef.current) {
      clearInterval(drawingTimerRef.current)
      drawingTimerRef.current = null
    }

    ctx.closePath()

    // Save with a delay to ensure drawing is complete
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      console.log(`[Canvas] Saving after drawing completion`)
      saveCanvasToServer()
    }, SAVE_DELAY)

    setTimeout(() => {
      if (onTokenUsed) {
        onTokenUsed("line")
      }

      if (timeExpired) {
        toast({
          title: "time's up!",
          description: "your 5-second drawing time has expired. 1 line token used.",
        })
      } else {
        toast({
          title: "line completed!",
          description: "1 line token used. great drawing!",
        })
      }
    }, 0)
  }

  const clearLocalCanvas = () => {
    if (isReadOnly || !ctx || !canvasRef.current) return

    const canvas = canvasRef.current
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    toast({
      title: "canvas cleared",
      description: "your local view has been cleared. this doesn't affect the shared canvas.",
    })
  }

  const validateNukeToken = async (): Promise<boolean> => {
    if (!sessionId || !walletAddress) return false

    try {
      const response = await fetch(`/api/tokens/${sessionId}?wallet=${walletAddress}`)
      if (!response.ok) return false

      const data = await response.json()
      const serverTokens = data.tokens

      return serverTokens && serverTokens.nuke_tokens > 0
    } catch (error) {
      console.error("Nuke validation error:", error)
      return false
    }
  }

  const nukeBoard = async () => {
    if (isReadOnly || !ctx || !canvasRef.current) return

    if (sessionDeleted) {
      toast({
        title: "session ended",
        description: "this session has been deleted. no more actions allowed.",
        variant: "destructive",
      })
      return
    }

    if (!walletAddress) {
      toast({
        title: "wallet required",
        description: "connect your wallet to nuke the board.",
        variant: "destructive",
      })
      return
    }

    if (userTokens.nukes <= 0) {
      toast({
        title: "no nuke tokens",
        description: "purchase a nuke token to clear the board.",
        variant: "destructive",
      })
      return
    }

    const isValid = await validateNukeToken()
    if (!isValid) {
      toast({
        title: "nuke validation failed",
        description: "unable to verify nuke tokens on server.",
        variant: "destructive",
      })
      return
    }

    console.log(`[Canvas] Nuking board`)
    const canvas = canvasRef.current
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const nukeData = {
      user: walletAddress.slice(0, 8) + "..." + walletAddress.slice(-4),
      timestamp: Date.now(),
    }
    if (sessionId) {
      localStorage.setItem(`whiteboard-nuke-${sessionId}`, JSON.stringify(nukeData))
    }

    // Save immediately
    await saveCanvasToServer()

    setTimeout(() => {
      if (onTokenUsed) {
        onTokenUsed("nuke")
      }

      toast({
        title: "💥 board nuked!",
        description: "the canvas has been wiped clean with dramatic effect!",
      })
    }, 0)
  }

  // Manual sync button handler
  const handleManualSync = async () => {
    if (isReadOnly) {
      toast({
        title: "Manual sync",
        description: "Fetching latest canvas data...",
      })
      await loadCanvasFromServer()
    } else {
      toast({
        title: "Manual sync",
        description: "Saving and syncing canvas data...",
      })
      await saveCanvasToServer()
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      if (drawingTimerRef.current) clearInterval(drawingTimerRef.current)
      if (nukeTimerRef.current) clearTimeout(nukeTimerRef.current)
      if (syncTimerRef.current) clearInterval(syncTimerRef.current)
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  const hasLineTokens =
    userTokens.lines > 0 || (userTokens && "bundle_tokens" in userTokens && (userTokens as any).bundle_tokens > 0)
  const canDraw = walletAddress && hasLineTokens && !sessionDeleted && !isDrawing
  const canNuke = walletAddress && userTokens.nukes > 0 && !sessionDeleted

  return (
    <div className="flex flex-col relative h-full">
      {/* Sync Status Indicator */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
        {syncStatus === "connected" && <Wifi className="h-3 w-3 text-green-400" />}
        {syncStatus === "disconnected" && <WifiOff className="h-3 w-3 text-red-400" />}
        {syncStatus === "syncing" && (
          <div className="h-3 w-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
        )}
        <span className="text-gray-300">
          {syncStatus === "connected" && lastSyncTime && `synced ${lastSyncTime.toLocaleTimeString()}`}
          {syncStatus === "disconnected" && "disconnected"}
          {syncStatus === "syncing" && "syncing..."}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1 text-xs text-gray-300 hover:text-white"
          onClick={handleManualSync}
        >
          Sync
        </Button>
      </div>

      {/* Nuke Effect Overlay */}
      {nukeEffect.isActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-500/20 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-6xl mb-4">💣</div>
            <div className="text-2xl font-bold text-white mb-2">NUKED BY {nukeEffect.user}</div>
            <div className="text-lg text-gray-300">Effect ends in {nukeEffect.timeLeft}s</div>
          </div>
        </div>
      )}

      {/* Timer Progress Bar */}
      {!isReadOnly && isDrawing && (
        <div className="absolute top-0 left-0 right-0 z-10 p-2 bg-black/80 backdrop-blur-sm rounded-t-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-white text-sm">
              <Timer className="h-4 w-4 text-[#00ff88]" />
              <span>Drawing Time: {(timeLeft / 1000).toFixed(1)}s</span>
            </div>
            <div className="text-xs text-gray-400">
              {hasLineTokens
                ? `${userTokens.lines + ((userTokens as any).bundle_tokens || 0) - 1} tokens remaining after this line`
                : "0 tokens remaining"}
            </div>
          </div>
          <Progress value={(timeLeft / DRAWING_TIME_LIMIT) * 100} className="h-2" />
        </div>
      )}

      {!isReadOnly && (
        <>
          {/* Token Status */}
          <div className="mb-4">
            {sessionDeleted ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">
                  this session has been ended by the streamer. no more drawing or token purchases allowed.
                </AlertDescription>
              </Alert>
            ) : !walletAddress ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>connect your wallet above to start drawing.</AlertDescription>
              </Alert>
            ) : !canDraw && !canNuke ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  no tokens available. purchase line tokens or nuke tokens to interact with the board.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ready to draw! you have {userTokens.lines} line tokens, {(userTokens as any).bundle_tokens || 0}{" "}
                  bundle tokens, and {userTokens.nukes} nuke tokens.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Drawing Tools */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex gap-2">
              <Button variant="default" size="icon" title="Draw" disabled={!canDraw} className="pump-button text-black">
                <Paintbrush className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={clearLocalCanvas}
                title="Clear Local View"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nukeBoard}
                disabled={!canNuke}
                title="Nuke Board"
                className="border-red-500 text-red-400 hover:bg-red-500/20"
              >
                <Bomb className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
                title="Color Picker"
                disabled={!canDraw}
              />
              <div className="w-32">
                <Slider value={brushSize} min={1} max={30} step={1} onValueChange={setBrushSize} disabled={!canDraw} />
              </div>
            </div>
          </div>
        </>
      )}

      <div
        ref={containerRef}
        className={`border rounded-md bg-white relative flex-1 ${
          isReadOnly ? "cursor-not-allowed" : canDraw ? "cursor-crosshair" : "cursor-not-allowed"
        } ${isFullscreen ? "h-full" : "min-h-[500px]"}`}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={() => stopDrawing(false)}
          onMouseLeave={() => stopDrawing(false)}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={() => stopDrawing(false)}
        />
      </div>

      {/* Debug info */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <div>canvas syncs every {SYNC_INTERVAL / 1000} seconds with the database.</div>
        <div className="text-xs text-gray-600 mt-1">
          status: {syncStatus} | last sync: {lastSyncTime?.toLocaleTimeString() || "never"} | session:{" "}
          {sessionId?.slice(-6)}
        </div>

        {/* Extended debug info */}
        <div className="mt-2 p-2 bg-gray-800 rounded text-left text-xs text-gray-400 overflow-auto max-h-32">
          <div>
            <strong>Last Save Attempt:</strong> {debugInfo.lastSaveAttempt || "None"}
          </div>
          <div>
            <strong>Last Save Result:</strong> {debugInfo.lastSaveResult || "None"}
          </div>
          <div>
            <strong>Last Load Attempt:</strong> {debugInfo.lastLoadAttempt || "None"}
          </div>
          <div>
            <strong>Last Load Result:</strong> {debugInfo.lastLoadResult || "None"}
          </div>
        </div>
      </div>
    </div>
  )
}
