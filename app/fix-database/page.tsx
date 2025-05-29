"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function FixDatabasePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fixDatabase = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/fix-user-tokens-table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
      } else {
        setError(data.error || "Failed to fix database")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Fix Database Schema</CardTitle>
            <CardDescription>This will fix the user_tokens table to use the correct column names.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={fixDatabase} disabled={isLoading} className="w-full">
              {isLoading ? "Fixing Database..." : "Fix Database Schema"}
            </Button>

            {result && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-semibold text-green-800">Success!</h3>
                <p className="text-green-700">{result.message}</p>
                {result.columns && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600">Current columns:</p>
                    <ul className="list-disc list-inside text-sm text-green-600">
                      {result.columns.map((col: string) => (
                        <li key={col}>{col}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="font-semibold text-red-800">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="text-sm text-gray-600">
              <p>
                <strong>What this does:</strong>
              </p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Checks if the user_tokens table exists</li>
                <li>Creates it with correct schema if missing</li>
                <li>Renames user_wallet column to wallet_address if needed</li>
                <li>Adds wallet_address column if missing</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
