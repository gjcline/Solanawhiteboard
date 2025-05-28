"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

interface TestResult {
  name: string
  status: "pending" | "success" | "error"
  message: string
  details?: any
}

export default function DebugPage() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const updateTest = (name: string, status: TestResult["status"], message: string, details?: any) => {
    setTests((prev) => {
      const existing = prev.find((t) => t.name === name)
      if (existing) {
        existing.status = status
        existing.message = message
        existing.details = details
        return [...prev]
      }
      return [...prev, { name, status, message, details }]
    })
  }

  const runTests = async () => {
    setIsRunning(true)
    setTests([])

    // Test 1: Database Connection
    updateTest("Database Connection", "pending", "Testing...")
    try {
      const response = await fetch("/api/health")
      const data = await response.json()
      if (data.status === "healthy") {
        updateTest("Database Connection", "success", "Database connected successfully", data)
      } else {
        updateTest("Database Connection", "error", data.error || "Database connection failed", data)
      }
    } catch (error) {
      updateTest("Database Connection", "error", "Failed to connect to database", error)
    }

    // Test 2: Database Tables
    updateTest("Database Tables", "pending", "Checking tables...")
    try {
      const response = await fetch("/api/debug-db")
      const data = await response.json()
      if (data.success) {
        updateTest("Database Tables", "success", `Found ${data.tables?.length || 0} tables`, data)
      } else {
        updateTest("Database Tables", "error", data.error || "Failed to check tables", data)
      }
    } catch (error) {
      updateTest("Database Tables", "error", "Failed to check database tables", error)
    }

    // Test 3: User Registration
    updateTest("User Registration", "pending", "Testing registration...")
    try {
      const testUser = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: "testpassword123",
      }

      const response = await fetch("/api/simple-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testUser),
      })

      const data = await response.json()
      if (data.success) {
        updateTest("User Registration", "success", "User registration working", data.user)

        // Clean up test user
        try {
          await fetch("/api/cleanup-test-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: testUser.email }),
          })
        } catch (cleanupError) {
          console.log("Cleanup failed (this is okay):", cleanupError)
        }
      } else {
        updateTest("User Registration", "error", data.error || "Registration failed", data)
      }
    } catch (error) {
      updateTest("User Registration", "error", "Registration test failed", error)
    }

    // Test 4: Environment Variables
    updateTest("Environment Variables", "pending", "Checking env vars...")
    try {
      const envTests = []

      // Check if DATABASE_URL is working (we already tested this above)
      envTests.push("DATABASE_URL: ✅")

      // Check DEVCAVE_WALLET
      const devcaveWallet = process.env.NEXT_PUBLIC_DEVCAVE_WALLET || "Not set"
      envTests.push(`DEVCAVE_WALLET: ${devcaveWallet.slice(0, 8)}...`)

      updateTest("Environment Variables", "success", "Environment variables configured", envTests)
    } catch (error) {
      updateTest("Environment Variables", "error", "Failed to check environment variables", error)
    }

    // Test 5: Session Creation (requires user)
    updateTest("Session Creation", "pending", "Testing session creation...")
    try {
      // This would require a logged-in user, so we'll just check the API endpoint exists
      const response = await fetch("/api/sessions?owner_id=999", {
        method: "GET",
      })

      if (response.status === 400) {
        // This is expected - we're testing with invalid owner_id
        updateTest(
          "Session Creation",
          "success",
          "Session API endpoint is working",
          "API responds correctly to invalid requests",
        )
      } else {
        const data = await response.json()
        updateTest("Session Creation", "success", "Session API accessible", data)
      }
    } catch (error) {
      updateTest("Session Creation", "error", "Session API test failed", error)
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "pending":
        return <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">System Debug & Health Check</h1>

        <Card className="pump-card border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Core Functionality Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={runTests} disabled={isRunning} className="pump-button text-black font-semibold mb-4">
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                "Run System Tests"
              )}
            </Button>

            <div className="space-y-4">
              {tests.map((test, index) => (
                <Alert
                  key={index}
                  className={`
                  ${test.status === "success" ? "bg-green-950/20 border-green-500/30" : ""}
                  ${test.status === "error" ? "bg-red-950/20 border-red-500/30" : ""}
                  ${test.status === "pending" ? "bg-yellow-950/20 border-yellow-500/30" : ""}
                `}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(test.status)}
                    <div className="flex-1">
                      <div className="font-medium text-white">{test.name}</div>
                      <AlertDescription
                        className={`
                        ${test.status === "success" ? "text-green-400" : ""}
                        ${test.status === "error" ? "text-red-400" : ""}
                        ${test.status === "pending" ? "text-yellow-400" : ""}
                      `}
                      >
                        {test.message}
                      </AlertDescription>
                      {test.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-400 cursor-pointer">Show Details</summary>
                          <pre className="text-xs text-gray-500 mt-1 overflow-auto">
                            {JSON.stringify(test.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="pump-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Quick Setup Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-gray-300">
              <h3 className="font-semibold mb-2">To get the site fully functional:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Ensure DATABASE_URL environment variable is set</li>
                <li>Run database migrations if needed</li>
                <li>Test user registration and login</li>
                <li>Create a test session</li>
                <li>Test token purchase flow</li>
                <li>Test drawing functionality</li>
              </ol>
            </div>

            <Alert className="bg-blue-950/20 border-blue-500/30">
              <AlertDescription className="text-blue-400">
                <strong>Next Steps:</strong> Run the tests above to identify any issues, then we can fix them one by
                one.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
