// Canvas aspect ratio and sizing utilities
export const CANVAS_ASPECT_RATIO = 16 / 9 // 16:9 aspect ratio
export const MIN_CANVAS_HEIGHT = 400
export const MAX_CANVAS_HEIGHT = 800

export interface CanvasDimensions {
  width: number
  height: number
}

export function calculateCanvasDimensions(
  containerWidth: number,
  containerHeight: number,
  isFullscreen = false,
): CanvasDimensions {
  if (isFullscreen) {
    // In fullscreen, use the full container dimensions
    return {
      width: containerWidth,
      height: containerHeight,
    }
  }

  // Calculate dimensions based on aspect ratio
  let width = containerWidth
  let height = width / CANVAS_ASPECT_RATIO

  // Ensure minimum height
  if (height < MIN_CANVAS_HEIGHT) {
    height = MIN_CANVAS_HEIGHT
    width = height * CANVAS_ASPECT_RATIO
  }

  // Ensure maximum height on large screens
  if (height > MAX_CANVAS_HEIGHT) {
    height = MAX_CANVAS_HEIGHT
    width = height * CANVAS_ASPECT_RATIO
  }

  // If calculated width exceeds container, scale down
  if (width > containerWidth) {
    width = containerWidth
    height = width / CANVAS_ASPECT_RATIO
  }

  return {
    width: Math.floor(width),
    height: Math.floor(height),
  }
}

export function getResponsiveCanvasClass(isFullscreen: boolean): string {
  if (isFullscreen) {
    return "w-full h-full"
  }

  return "w-full mx-auto" // Center the canvas horizontally
}
