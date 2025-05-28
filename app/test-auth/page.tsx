"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestAuthPage() {
  const [debugResult, setDebugResult] = useState<any>(null)
  const [registerData, setRegisterData] = useState({ username: "", email: "", password: "" })
  const [registerResult, setRegisterResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/debug-db")
      const result = await response.json()
      setDebugResult(result)
    } catch (error) {
      setDebugResult({ error: "Failed to test database" })
    }
    setLoading(false)
  }

  const testRegister = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/simple-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      })
      const result = await response.json()
      setRegisterResult(result)
    } catch (error) {
      setRegisterResult({ error: "Failed to register" })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Database & Auth Testing</h1>

        {/* Database Debug */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Database Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testDatabase} disabled={loading} className="pump-button">
              Test Database Connection
            </Button>
            {debugResult && (
              <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(debugResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        {/* Simple Registration Test */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Simple Registration Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Username"
                value={registerData.username}
                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
              <Input
                placeholder="Email"
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
              <Input
                placeholder="Password"
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <Button onClick={testRegister} disabled={loading} className="pump-button">
              Test Registration
            </Button>
            {registerResult && (
              <pre className="bg-gray-900 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(registerResult, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
