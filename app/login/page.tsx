"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/components/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Zap } from "lucide-react"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [registerData, setRegisterData] = useState({ username: "", email: "", password: "" })
  const { login, register } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await login(loginData.email, loginData.password)
      toast({
        title: "welcome back to draw.fun!",
        description: "you're now connected and ready to pump some draws.",
      })
      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "connection failed",
        description: "check your credentials and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await register(registerData.username, registerData.email, registerData.password)
      toast({
        title: "account created!",
        description: "welcome to draw.fun. time to start pumping draws!",
      })
      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "registration failed",
        description: "try again with different details.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="pump-gradient p-3 rounded-xl w-fit mx-auto mb-4">
            <Zap className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold pump-text-gradient mb-2">connect to draw.fun</h1>
          <p className="text-gray-400 text-sm">by D3vCav3</p>
        </div>

        <Card className="pump-card glow-effect">
          <CardHeader className="text-center">
            <CardTitle className="text-white">get started</CardTitle>
            <CardDescription className="text-gray-400">
              connect your account to start creating drawing sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
                <TabsTrigger value="login" className="data-[state=active]:bg-[#00ff88] data-[state=active]:text-black">
                  connect
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="data-[state=active]:bg-[#00ff88] data-[state=active]:text-black"
                >
                  create account
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-300">
                      email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="enter your email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-300">
                      password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full pump-button text-black font-semibold" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        connecting...
                      </>
                    ) : (
                      "connect account"
                    )}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium text-gray-300">
                      username
                    </label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="choose a username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="reg-email" className="text-sm font-medium text-gray-300">
                      email
                    </label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="enter your email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="reg-password" className="text-sm font-medium text-gray-300">
                      password
                    </label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="create a password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full pump-button text-black font-semibold" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        creating account...
                      </>
                    ) : (
                      "create account"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">by continuing, you agree to our terms of service and privacy policy</p>
        </div>
      </div>
    </div>
  )
}
