import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add session helper function
export async function getSession(sessionId: string) {
  try {
    const response = await fetch(`/api/sessions/${sessionId}`)
    if (response.ok) {
      const data = await response.json()
      return data.session
    }
    return null
  } catch (error) {
    console.error("Error fetching session:", error)
    return null
  }
}
