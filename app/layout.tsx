import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import Navigation from "@/components/navigation"
import AnimatedCursor from "@/components/animated-cursor"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Solana Whiteboard for Streamers",
  description: "Interactive whiteboard for streamers with Solana payments",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="min-h-screen flex flex-col">
              <Navigation />
              <main className="flex-1 w-full">{children}</main>
            </div>
            <Toaster />
            <AnimatedCursor />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
