"use client"

import { useState, useEffect } from "react"

interface Point {
  x: number
  y: number
  timestamp: number
}

export default function AnimatedCursor() {
  const [points, setPoints] = useState<Point[]>([])
  const [isVisible, setIsVisible] = useState(true)
  const [isActive, setIsActive] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Trail length in pixels (approximately 10cm at 96 DPI)
  const TRAIL_LENGTH = 378
  // Maximum number of points to store
  const MAX_POINTS = 50
  // How long points stay visible (ms)
  const POINT_LIFETIME = 1000

  useEffect(() => {
    // Set initial dimensions
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    const handleMouseMove = (e: MouseEvent) => {
      // Add new point
      const newPoint = {
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
      }

      setPoints((prevPoints) => {
        // Keep only the most recent points
        const updatedPoints = [...prevPoints, newPoint].slice(-MAX_POINTS)
        return updatedPoints
      })

      setIsActive(true)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
    }

    const handleMouseEnter = () => {
      setIsVisible(true)
    }

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Clean up old points periodically
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      setPoints((prevPoints) => prevPoints.filter((point) => now - point.timestamp < POINT_LIFETIME))

      // If no points have been added recently, set inactive
      if (points.length > 0) {
        const lastPoint = points[points.length - 1]
        if (now - lastPoint.timestamp > 1000) {
          setIsActive(false)
        }
      }
    }, 100)

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseleave", handleMouseLeave)
    window.addEventListener("mouseenter", handleMouseEnter)
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseleave", handleMouseLeave)
      window.removeEventListener("mouseenter", handleMouseEnter)
      window.removeEventListener("resize", handleResize)
      clearInterval(cleanupInterval)
    }
  }, [points])

  // Don't render if no points or not visible
  if (points.length === 0 || !isVisible) {
    return null
  }

  // Filter points for the trail (only recent ones)
  const now = Date.now()
  const trailPoints = points
    .filter((point) => now - point.timestamp < POINT_LIFETIME)
    .filter((_, index, array) => {
      // Keep fewer points for better performance
      return index % Math.max(1, Math.floor(array.length / 20)) === 0 || index === array.length - 1
    })

  // Create SVG path for the trail
  let pathData = ""
  if (trailPoints.length > 1) {
    pathData = `M ${trailPoints[0].x} ${trailPoints[0].y}`
    for (let i = 1; i < trailPoints.length; i++) {
      // Use curve for smoother line
      const xc = (trailPoints[i].x + trailPoints[i - 1].x) / 2
      const yc = (trailPoints[i].y + trailPoints[i - 1].y) / 2
      pathData += ` Q ${trailPoints[i - 1].x} ${trailPoints[i - 1].y}, ${xc} ${yc}`
    }
    // Add the last point
    pathData += ` L ${trailPoints[trailPoints.length - 1].x} ${trailPoints[trailPoints.length - 1].y}`
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      {/* SVG for the trail */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00ff88" stopOpacity="0" />
            <stop offset="100%" stopColor="#00ff88" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <path
          d={pathData}
          fill="none"
          stroke="url(#trailGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-0"}`}
        />
      </svg>
    </div>
  )
}
