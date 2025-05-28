"use client"

import { createContext, useState, useEffect, type ReactNode, useContext } from "react"

interface User {
  id: number // Change to number to match database
  username: string
  email: string
  wallet_address?: string
  created_at?: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => void
  updateProfile: (updateData: Partial<User>) => Promise<User>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("whiteboard-user")
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        // Ensure id is a number
        if (parsedUser.id) {
          parsedUser.id = Number.parseInt(parsedUser.id, 10)
        }
        setUser(parsedUser)
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("whiteboard-user")
      }
    }
  }, [])

  const login = async (email: string, password: string) => {
    console.log("🔐 Attempting login for:", email)

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Login failed")
    }

    console.log("✅ Login successful:", data.user)

    // Ensure id is a number
    if (data.user.id) {
      data.user.id = Number.parseInt(data.user.id, 10)
    }

    setUser(data.user)
    localStorage.setItem("whiteboard-user", JSON.stringify(data.user))
  }

  const register = async (username: string, email: string, password: string) => {
    console.log("📝 Attempting registration for:", email)

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Registration failed")
    }

    console.log("✅ Registration successful:", data.user)

    // Ensure id is a number
    if (data.user.id) {
      data.user.id = Number.parseInt(data.user.id, 10)
    }

    setUser(data.user)
    localStorage.setItem("whiteboard-user", JSON.stringify(data.user))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("whiteboard-user")
  }

  const updateProfile = async (updateData: Partial<User>) => {
    if (!user) throw new Error("No user logged in")

    console.log("Updating user profile:", updateData)

    try {
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
        console.error("Profile update failed:", data)
        throw new Error(data.error || "Profile update failed")
      }

      console.log("Profile updated successfully:", data.user)

      // Ensure id is a number
      if (data.user.id) {
        data.user.id = Number.parseInt(data.user.id, 10)
      }

      // Update the user state with the new data
      setUser(data.user)
      localStorage.setItem("whiteboard-user", JSON.stringify(data.user))

      return data.user
    } catch (error) {
      console.error("Profile update error:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
