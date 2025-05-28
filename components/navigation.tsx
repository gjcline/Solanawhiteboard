"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Zap, User, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function Navigation() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const publicNavItems = [
    { href: "/", label: "home" },
    { href: "/login", label: "connect" },
  ]

  const authenticatedNavItems = [
    { href: "/", label: "home" },
    { href: "/dashboard", label: "dashboard" },
  ]

  const navItems = user ? authenticatedNavItems : publicNavItems

  return (
    <header className="border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="container flex h-16 items-center px-4">
        <Link href="/" className="flex items-center gap-3 font-bold text-xl">
          <div className="pump-gradient p-2 rounded-lg">
            <Zap className="h-6 w-6 text-black" />
          </div>
          <span className="pump-text-gradient">draw.fun</span>
          <span className="text-xs text-gray-500 font-normal">by D3vCav3</span>
        </Link>
        <nav className="ml-auto flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-[#00ff88] lowercase",
                pathname === item.href ? "text-[#00ff88]" : "text-gray-400",
              )}
            >
              {item.label}
            </Link>
          ))}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#00ff88]">
                  <User className="h-4 w-4 mr-2" />
                  {user.username}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
                <DropdownMenuItem onClick={logout} className="text-gray-300 hover:text-white hover:bg-gray-800">
                  <LogOut className="h-4 w-4 mr-2" />
                  disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>
    </header>
  )
}
