"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: number
  username: string
  email: string
  wallet_address?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, walletAddress?: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const savedUser = localStorage.getItem("whiteboard-user")
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        // Optionally verify the user still exists in the database
        verifyUser(userData.id)
      } catch (error) {
        console.error("Error parsing saved user:", error)
        localStorage.removeItem("whiteboard-user")
      }
    }
    setIsLoading(false)
  }, [])

  const verifyUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/auth/profile?id=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        localStorage.setItem("whiteboard-user", JSON.stringify(data.user))
      } else {
        // User no longer exists, clear local storage
        logout()
      }
    } catch (error) {
      console.error("Error verifying user:", error)
    }
  }

  const login = async (email: string, password: string) => {
    console.log("Login attempt for:", email)

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    console.log("Login response:", { status: response.status, ok: response.ok })

    if (!response.ok) {
      console.error("Login failed:", data)
      throw new Error(data.error || "Login failed")
    }

    console.log("Login successful")
    setUser(data.user)
    localStorage.setItem("whiteboard-user", JSON.stringify(data.user))
  }

  const register = async (username: string, email: string, password: string, walletAddress?: string) => {
    console.log("Registration attempt for:", { username, email })

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
        wallet_address: walletAddress,
      }),
    })

    const data = await response.json()
    console.log("Registration response:", { status: response.status, ok: response.ok, data })

    if (!response.ok) {
      console.error("Registration failed:", data)
      throw new Error(data.error || data.details || "Registration failed")
    }

    console.log("Registration successful")
    setUser(data.user)
    localStorage.setItem("whiteboard-user", JSON.stringify(data.user))
  }

  const updateProfile = async (updateData: Partial<User>) => {
    if (!user) throw new Error("No user logged in")

    const response = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: user.id,
        ...updateData,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Profile update failed")
    }

    setUser(data.user)
    localStorage.setItem("whiteboard-user", JSON.stringify(data.user))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("whiteboard-user")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateProfile,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
