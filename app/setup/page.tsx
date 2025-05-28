"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SetupPage() {
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const setupDatabase = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/setup-db", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: `Setup failed: ${error}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-20">
      <div className="container mx-auto">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">🚀 Production Database Setup</CardTitle>
            <p className="text-gray-600">Set up your Solana Whiteboard database</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button onClick={setupDatabase} disabled={isLoading} className="w-full h-12 text-lg" size="lg">
              {isLoading ? "🔄 Setting up database..." : "🎯 Setup Database Now"}
            </Button>

            {result && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <div className="font-semibold text-lg">{result.success ? "✅ Success!" : "❌ Setup Failed"}</div>
                  <p className="mt-1">{result.message || result.error}</p>
                </div>

                {result.success && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2">Database Details:</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>
                        <strong>Database:</strong> {result.database}
                      </div>
                      <div>
                        <strong>Tables:</strong> {result.tables?.join(", ")}
                      </div>
                      <div>
                        <strong>Setup Time:</strong> {new Date(result.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}

                {result.success && (
                  <div className="text-center">
                    <Button onClick={() => (window.location.href = "/")} className="bg-green-600 hover:bg-green-700">
                      🎨 Go to Whiteboard App
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
