"use client"

import type React from "react"

import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Paintbrush, AlertCircle, Bomb, Timer, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DRAWING_TIME_LIMIT } from "@/lib/pricing"

// How often to save/update the canvas (in milliseconds)
const UPDATE_INTERVAL = 500

interface UserTokens {
  lines: number
  nukes: number
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
  // Storage keys for the canvas data
  const STORAGE_KEY = sessionId ? `whiteboard-canvas-data-${sessionId}` : "whiteboard-canvas-data"
  const LOCAL_STORAGE_KEY = sessionId
    ? `whiteboard-local-canvas-${sessionId}-${walletAddress?.slice(0, 8)}`
    : "whiteboard-local-canvas"
  const NUKE_STORAGE_KEY = sessionId ? `whiteboard-nuke-${sessionId}` : "whiteboard-nuke"

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
  const { toast } = useToast()

  // Add new props and state for session validation
  const [sessionDeleted, setSessionDeleted] = useState(false)

  // Initialize canvas and handle resizing
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const updateCanvasSize = () => {
      // Store current drawing before resizing
      const currentImageData = ctx ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null

      // Get container dimensions
      const containerRect = container.getBoundingClientRect()
      const newWidth = containerRect.width
      const newHeight = isFullscreen ? containerRect.height : Math.max(500, containerRect.height)

      // Set canvas size
      canvas.width = newWidth
      canvas.height = newHeight

      // Restore context properties
      const context = canvas.getContext("2d")
      if (context) {
        context.lineCap = "round"
        context.lineJoin = "round"
        context.strokeStyle = color
        context.lineWidth = brushSize[0]
        setCtx(context)

        // Restore previous drawing if it exists
        if (currentImageData) {
          // Scale the previous drawing to fit new canvas size
          const tempCanvas = document.createElement("canvas")
          const tempCtx = tempCanvas.getContext("2d")
          if (tempCtx) {
            tempCanvas.width = currentImageData.width
            tempCanvas.height = currentImageData.height
            tempCtx.putImageData(currentImageData, 0, 0)

            // Draw scaled image to new canvas
            context.drawImage(tempCanvas, 0, 0, newWidth, newHeight)
          }
        } else {
          // Load from storage if no current image
          if (isReadOnly) {
            loadCanvasFromStorage(canvas, context, STORAGE_KEY)
          } else {
            // For draw page, load from local storage first
            loadCanvasFromStorage(canvas, context, LOCAL_STORAGE_KEY)
          }
        }
      }
    }

    // Initial setup
    updateCanvasSize()

    // Handle window resize
    const handleResize = () => {
      updateCanvasSize()
    }

    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      // Small delay to ensure DOM has updated
      setTimeout(updateCanvasSize, 100)
    }

    window.addEventListener("resize", handleResize)
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    return () => {
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [isFullscreen, color, brushSize, isReadOnly, LOCAL_STORAGE_KEY, STORAGE_KEY])

  // Update canvas size when fullscreen prop changes
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // Force canvas resize when fullscreen state changes
    setTimeout(() => {
      const containerRect = container.getBoundingClientRect()
      const newWidth = containerRect.width
      const newHeight = isFullscreen ? containerRect.height : Math.max(500, containerRect.height)

      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        const currentImageData = ctx ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null

        canvas.width = newWidth
        canvas.height = newHeight

        if (ctx) {
          ctx.lineCap = "round"
          ctx.lineJoin = "round"
          ctx.strokeStyle = color
          ctx.lineWidth = brushSize[0]

          if (currentImageData) {
            const tempCanvas = document.createElement("canvas")
            const tempCtx = tempCanvas.getContext("2d")
            if (tempCtx) {
              tempCanvas.width = currentImageData.width
              tempCanvas.height = currentImageData.height
              tempCtx.putImageData(currentImageData, 0, 0)
              ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight)
            }
          } else {
            if (isReadOnly) {
              loadCanvasFromStorage(canvas, ctx, STORAGE_KEY)
            } else {
              loadCanvasFromStorage(canvas, ctx, LOCAL_STORAGE_KEY)
            }
          }
        }
      }
    }, 100)
  }, [isFullscreen, isReadOnly, LOCAL_STORAGE_KEY, STORAGE_KEY])

  // Check for nuke effects
  useEffect(() => {
    if (isReadOnly) {
      const checkForNuke = setInterval(() => {
        const nukeData = localStorage.getItem(NUKE_STORAGE_KEY)
        if (nukeData) {
          const nuke = JSON.parse(nukeData)
          const timeElapsed = Date.now() - nuke.timestamp
          const timeLeft = 10000 - timeElapsed // 10 seconds

          if (timeLeft > 0) {
            setNukeEffect({
              isActive: true,
              user: nuke.user,
              timeLeft: Math.ceil(timeLeft / 1000),
            })
          } else {
            setNukeEffect({ isActive: false, user: "", timeLeft: 0 })
            localStorage.removeItem(NUKE_STORAGE_KEY)
          }
        }
      }, 100)

      return () => clearInterval(checkForNuke)
    }
  }, [isReadOnly, NUKE_STORAGE_KEY])

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

  // Update context when color or brush size changes
  useEffect(() => {
    if (ctx) {
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize[0]
    }
  }, [color, brushSize, ctx])

  // Set up periodic saving of canvas data
  useEffect(() => {
    if (isReadOnly) {
      const checkForUpdates = setInterval(() => {
        if (canvasRef.current && ctx) {
          loadCanvasFromStorage(canvasRef.current, ctx, STORAGE_KEY)
        }
      }, UPDATE_INTERVAL)

      return () => clearInterval(checkForUpdates)
    }
  }, [isReadOnly, ctx, STORAGE_KEY])

  // Modified to specify which storage key to use
  const loadCanvasFromStorage = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, storageKey: string) => {
    const savedData = localStorage.getItem(storageKey)
    if (savedData) {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height)
        context.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      img.src = savedData
    }
  }

  // Save to both local and shared storage
  const saveDrawing = (lineOnly = false) => {
    if (!canvasRef.current) return

    // Get the current drawing as data URL
    const dataUrl = canvasRef.current.toDataURL("image/png")

    // Always save to local storage to maintain the user's local state
    localStorage.setItem(LOCAL_STORAGE_KEY, dataUrl)

    if (!lineOnly) {
      // For nukes, we save directly to shared storage
      localStorage.setItem(STORAGE_KEY, dataUrl)
      return
    }

    // For lines, we need to merge with the shared state
    const savedData = localStorage.getItem(STORAGE_KEY)

    if (savedData) {
      // Create a temporary canvas for merging
      const tempCanvas = document.createElement("canvas")
      tempCanvas.width = canvasRef.current.width
      tempCanvas.height = canvasRef.current.height
      const tempCtx = tempCanvas.getContext("2d")

      if (tempCtx) {
        // Load the shared state
        const sharedImg = new Image()
        sharedImg.crossOrigin = "anonymous"
        sharedImg.onload = () => {
          // Draw the shared state
          tempCtx.drawImage(sharedImg, 0, 0, tempCanvas.width, tempCanvas.height)

          // Get the current line as a separate image
          const currentImg = new Image()
          currentImg.crossOrigin = "anonymous"
          currentImg.onload = () => {
            // Draw the current line on top
            tempCtx.drawImage(currentImg, 0, 0)

            // Save the merged result to shared storage
            const mergedDataUrl = tempCanvas.toDataURL("image/png")
            localStorage.setItem(STORAGE_KEY, mergedDataUrl)
          }
          currentImg.src = dataUrl
        }
        sharedImg.src = savedData
      }
    } else {
      // If no shared state exists yet, just save the current drawing
      localStorage.setItem(STORAGE_KEY, dataUrl)
    }
  }

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

  // Add useEffect to check for session deletion
  useEffect(() => {
    if (!sessionId || isReadOnly) return

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
  }, [sessionId, isReadOnly])

  // Update the startDrawing function to check session status
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isReadOnly || !ctx || !canvasRef.current) return

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

    if (userTokens.lines <= 0) {
      toast({
        title: "no line tokens",
        description: "purchase line tokens to start drawing.",
        variant: "destructive",
      })
      return
    }

    setIsDrawing(true)
    setDrawingStartTime(Date.now())
    setTimeLeft(DRAWING_TIME_LIMIT)

    // Start the drawing timer
    drawingTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 100
        if (newTime <= 0) {
          // Force stop drawing when time is up
          if (isDrawing) {
            stopDrawing(true)
          }
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
    if (isReadOnly || !isDrawing || !ctx || !canvasRef.current) return

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

    // Only proceed if we were actually drawing
    if (!isDrawing) return

    setIsDrawing(false)
    setDrawingStartTime(null)
    setTimeLeft(DRAWING_TIME_LIMIT)

    if (drawingTimerRef.current) {
      clearInterval(drawingTimerRef.current)
      drawingTimerRef.current = null
    }

    ctx.closePath()

    // Save the drawing to both local and shared storage
    saveDrawing(true) // true means it's a line (not a nuke)

    // Use setTimeout to defer the token usage callback to avoid setState during render
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

    // Save the cleared state to local storage only
    localStorage.setItem(LOCAL_STORAGE_KEY, canvas.toDataURL("image/png"))

    toast({
      title: "canvas cleared",
      description: "your local canvas has been cleared. this doesn't affect the shared view.",
    })
  }

  // Update the nukeBoard function to check session status
  const nukeBoard = () => {
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

    const canvas = canvasRef.current
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Save nuke effect data
    const nukeData = {
      user: walletAddress.slice(0, 8) + "..." + walletAddress.slice(-4),
      timestamp: Date.now(),
    }
    localStorage.setItem(NUKE_STORAGE_KEY, JSON.stringify(nukeData))

    // Save the cleared canvas to both local and shared storage
    saveDrawing(false) // false means it's a nuke (not a line)

    // Use setTimeout to defer the token usage callback to avoid setState during render
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

  // Update canDraw and canNuke to consider session status
  const canDraw = walletAddress && userTokens.lines > 0 && !sessionDeleted
  const canNuke = walletAddress && userTokens.nukes > 0 && !sessionDeleted

  return (
    <div className="flex flex-col relative h-full">
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

      {/* Fixed Timer Progress Bar - Only visible when drawing */}
      {!isReadOnly && isDrawing && (
        <div className="absolute top-0 left-0 right-0 z-10 p-2 bg-black/80 backdrop-blur-sm rounded-t-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-white text-sm">
              <Timer className="h-4 w-4 text-[#00ff88]" />
              <span>Drawing Time: {(timeLeft / 1000).toFixed(1)}s</span>
            </div>
            <div className="text-xs text-gray-400">{userTokens.lines - 1} tokens remaining after this line</div>
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
                  ready to draw! you have {userTokens.lines} line tokens and {userTokens.nukes} nuke tokens.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Drawing Tools - With Clear Button */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex gap-2">
              <Button
                variant="default"
                size="icon"
                title="Draw"
                disabled={!canDraw || isDrawing}
                className="pump-button text-black"
              >
                <Paintbrush className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={clearLocalCanvas}
                title="Clear Local Canvas"
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nukeBoard}
                disabled={!canNuke || isDrawing}
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
                disabled={!canDraw || isDrawing}
              />
              <div className="w-32">
                <Slider
                  value={brushSize}
                  min={1}
                  max={30}
                  step={1}
                  onValueChange={setBrushSize}
                  disabled={!canDraw || isDrawing}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div
        ref={containerRef}
        className={`border rounded-md bg-white relative flex-1 ${
          isReadOnly ? "cursor-not-allowed" : canDraw && !isDrawing ? "cursor-crosshair" : "cursor-not-allowed"
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

      {/* Only show this text in non-fullscreen read-only mode */}
      {isReadOnly && !isFullscreen && (
        <div className="mt-4 text-center text-sm text-gray-500">
          this is a view-only mirror of the drawing board. viewers can draw by visiting the draw URL.
        </div>
      )}
    </div>
  )
}
