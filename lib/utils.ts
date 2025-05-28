import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Session management utility
export function getSession(): string | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return localStorage.getItem("session") || null
  } catch (error) {
    console.error("Error getting session:", error)
    return null
  }
}

export function setSession(sessionId: string): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem("session", sessionId)
  } catch (error) {
    console.error("Error setting session:", error)
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.removeItem("session")
  } catch (error) {
    console.error("Error clearing session:", error)
  }
}

// Generate random session ID
export function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Format date utility
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}
