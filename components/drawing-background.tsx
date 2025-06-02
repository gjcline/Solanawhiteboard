"use client"

import { useEffect, useRef } from "react"

interface DrawingBackgroundProps {
  density?: number
  speed?: number
}

export default function DrawingBackground({ density = 20, speed = 0.5 }: DrawingBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Drawing elements
    interface DrawingElement {
      x: number
      y: number
      size: number
      color: string
      type: "pencil" | "brush" | "eraser" | "line"
      rotation: number
      speed: number
      opacity: number
    }

    // Create initial elements
    const elements: DrawingElement[] = []
    for (let i = 0; i < density; i++) {
      elements.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 20 + 10,
        color: getRandomColor(),
        type: getRandomType(),
        rotation: Math.random() * Math.PI * 2,
        speed: (Math.random() + 0.5) * speed,
        opacity: Math.random() * 0.15 + 0.05, // Lower opacity for subtle effect
      })
    }

    function getRandomColor() {
      const colors = ["#00ff88", "#00cc6a", "#ffffff", "#aaffcc"]
      return colors[Math.floor(Math.random() * colors.length)]
    }

    function getRandomType() {
      const types = ["pencil", "brush", "eraser", "line"] as const
      return types[Math.floor(Math.random() * types.length)]
    }

    function drawPencil(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      rotation: number,
      color: string,
      opacity: number,
    ) {
      ctx.save()
      ctx.globalAlpha = opacity
      ctx.translate(x, y)
      ctx.rotate(rotation)

      // Pencil body
      ctx.fillStyle = "#555"
      ctx.beginPath()
      ctx.moveTo(-size, -size / 5)
      ctx.lineTo(size / 2, -size / 5)
      ctx.lineTo(size / 2, size / 5)
      ctx.lineTo(-size, size / 5)
      ctx.closePath()
      ctx.fill()

      // Pencil tip
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(size / 2, -size / 5)
      ctx.lineTo(size, 0)
      ctx.lineTo(size / 2, size / 5)
      ctx.closePath()
      ctx.fill()

      ctx.restore()
    }

    function drawBrush(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      rotation: number,
      color: string,
      opacity: number,
    ) {
      ctx.save()
      ctx.globalAlpha = opacity
      ctx.translate(x, y)
      ctx.rotate(rotation)

      // Brush handle
      ctx.fillStyle = "#8B4513"
      ctx.fillRect(-size, -size / 8, size * 1.5, size / 4)

      // Brush head
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.ellipse(size * 0.6, 0, size / 3, size / 2, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    function drawEraser(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      rotation: number,
      opacity: number,
    ) {
      ctx.save()
      ctx.globalAlpha = opacity
      ctx.translate(x, y)
      ctx.rotate(rotation)

      // Eraser body
      ctx.fillStyle = "#ff6b6b"
      ctx.fillRect(-size / 2, -size / 3, size, size / 1.5)

      // Eraser top
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(-size / 2, -size / 3, size, size / 6)

      ctx.restore()
    }

    function drawLine(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      rotation: number,
      color: string,
      opacity: number,
    ) {
      ctx.save()
      ctx.globalAlpha = opacity
      ctx.translate(x, y)
      ctx.rotate(rotation)

      // Line
      ctx.strokeStyle = color
      ctx.lineWidth = size / 10
      ctx.beginPath()
      ctx.moveTo(-size, 0)
      ctx.lineTo(size, 0)
      ctx.stroke()

      // Small dots at ends
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(-size, 0, size / 15, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(size, 0, size / 15, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    // Animation loop
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw elements
      elements.forEach((element) => {
        // Move element
        element.x += Math.cos(element.rotation) * element.speed
        element.y += Math.sin(element.rotation) * element.speed

        // Bounce off edges
        if (element.x < 0 || element.x > canvas.width) {
          element.rotation = Math.PI - element.rotation
        }
        if (element.y < 0 || element.y > canvas.height) {
          element.rotation = -element.rotation
        }

        // Slowly change rotation
        element.rotation += (Math.random() - 0.5) * 0.05

        // Draw element
        switch (element.type) {
          case "pencil":
            drawPencil(ctx, element.x, element.y, element.size, element.rotation, element.color, element.opacity)
            break
          case "brush":
            drawBrush(ctx, element.x, element.y, element.size, element.rotation, element.color, element.opacity)
            break
          case "eraser":
            drawEraser(ctx, element.x, element.y, element.size, element.rotation, element.opacity)
            break
          case "line":
            drawLine(ctx, element.x, element.y, element.size, element.rotation, element.color, element.opacity)
            break
        }
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [density, speed])

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-15" />
}