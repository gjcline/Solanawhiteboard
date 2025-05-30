"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"

interface DrawingCanvasProps {
  isReadOnly?: boolean
  sessionId?: string
  initialDrawingData?: string
  onDrawingChange?: (drawingData: string) => void
  isFullscreen?: boolean
  walletAddress?: string | null
  userTokens?: number
  containerRef?: React.RefObject<HTMLDivElement>
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isReadOnly = false,
  sessionId,
  initialDrawingData,
  onDrawingChange,
  isFullscreen = false,
  walletAddress,
  userTokens,
  containerRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastX, setLastX] = useState(0)
  const [lastY, setLastY] = useState(0)
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 })

  const calculateCanvasDimensions = useCallback(() => {
    if (!canvasRef.current) return { width: 0, height: 0 }

    const parentElement = canvasRef.current.parentElement
    if (!parentElement) return { width: 0, height: 0 }

    const parentWidth = parentElement.clientWidth
    const parentHeight = parentElement.clientHeight

    const aspectRatio = 16 / 9 // Example aspect ratio, adjust as needed

    let calculatedWidth = parentWidth
    let calculatedHeight = parentWidth / aspectRatio

    if (calculatedHeight > parentHeight) {
      calculatedHeight = parentHeight
      calculatedWidth = parentHeight * aspectRatio
    }

    return { width: calculatedWidth, height: calculatedHeight }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      const parentElement =
        isFullscreen && containerRef?.current ? containerRef.current : canvasRef.current?.parentElement
      if (parentElement) {
        const newDimensions = calculateCanvasDimensions()
        setCanvasDimensions(newDimensions)

        if (canvasRef.current) {
          canvasRef.current.width = newDimensions.width
          canvasRef.current.height = newDimensions.height
          redrawCanvas(canvasRef.current, initialDrawingData)
        }
      }
    }

    handleResize() // Initial sizing

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [
    isReadOnly,
    sessionId,
    isFullscreen,
    walletAddress,
    userTokens,
    calculateCanvasDimensions,
    initialDrawingData,
    containerRef,
  ])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineJoin = ctx.lineCap = "round"
    ctx.strokeStyle = "black"
    ctx.lineWidth = 5

    if (initialDrawingData) {
      redrawCanvas(canvas, initialDrawingData)
    }
  }, [initialDrawingData])

  const redrawCanvas = (canvas: HTMLCanvasElement, drawingData: string | undefined) => {
    if (!drawingData) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    try {
      const lines = JSON.parse(drawingData) as { x: number; y: number; lastX: number; lastY: number }[]

      lines.forEach((line) => {
        ctx.beginPath()
        ctx.moveTo(line.lastX, line.lastY)
        ctx.lineTo(line.x, line.y)
        ctx.stroke()
      })
    } catch (error) {
      console.error("Error parsing drawing data:", error)
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isReadOnly) return
    setIsDrawing(true)
    setLastX(e.nativeEvent.offsetX)
    setLastY(e.nativeEvent.offsetY)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isReadOnly) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const x = e.nativeEvent.offsetX
    const y = e.nativeEvent.offsetY

    ctx.beginPath()
    ctx.moveTo(lastX, lastY)
    ctx.lineTo(x, y)
    ctx.stroke()

    setLastX(x)
    setLastY(y)

    // Capture drawing data
    const lineData = { x, y, lastX, lastY }
    captureDrawingData(canvas)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const captureDrawingData = (canvas: HTMLCanvasElement) => {
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const lines: { x: number; y: number; lastX: number; lastY: number }[] = []

    // Iterate through the canvas and extract line data (simplified approach)
    // This is a placeholder and needs to be replaced with a proper implementation
    // that captures all drawing operations.

    // For now, just capture the last drawn line.
    lines.push({ x: lastX, y: lastY, lastX: lastX, lastY: lastY })

    try {
      const drawingData = JSON.stringify(lines)
      onDrawingChange?.(drawingData)
    } catch (error) {
      console.error("Error stringifying drawing data:", error)
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={canvasDimensions.width}
      height={canvasDimensions.height}
      style={{ border: "1px solid black", width: "100%", height: "100%" }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseOut={stopDrawing}
    />
  )
}

export default DrawingCanvas
