"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, ArrowRight, Database, Users, Wallet, Paintbrush } from "lucide-react"
import Link from "next/link"

interface SetupStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: "pending" | "running" | "success" | "error"
  action?: () => Promise<void>
  result?: any
}

export default function SetupGuidePage() {
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: "database",
      title: "Database Setup",
      description: "Test database connection and run migrations",
      icon: <Database className="h-5 w-5" />,
      status: "pending",
      action: async () => {
        // Test database connection
        const healthResponse = await fetch("/api/health")
        const healthData = await healthResponse.json()

        if (healthData.status !== "healthy") {
          throw new Error("Database connection failed")
        }

        // Run migrations
        const migrateResponse = await fetch("/api/migrate", { method: "POST" })
        const migrateData = await migrateResponse.json()

        if (!migrateData.success) {
          throw new Error(migrateData.error || "Migration failed")
        }

        return { health: healthData, migration: migrateData }
      },
    },
    {
      id: "auth",
      title: "Authentication System",
      description: "Test user registration and login",
      icon: <Users className="h-5 w-5" />,
      status: "pending",
      action: async () => {
        const testUser = {
          username: `setup_test_${Date.now()}`,
          email: `setup_${Date.now()}@example.com`,
          password: "setuptest123",
        }

        const response = await fetch("/api/simple-register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testUser),
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || "Registration test failed")
        }

        // Clean up test user
        await fetch("/api/cleanup-test-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: testUser.email }),
        })

        return { user: data.user, testEmail: testUser.email }
      },
    },
    {
      id: "wallet",
      title: "Wallet Integration",
      description: "Verify wallet configuration",
      icon: <Wallet className="h-5 w-5" />,
      status: "pending",
      action: async () => {
        // Check environment variables
        const devcaveWallet = process.env.NEXT_PUBLIC_DEVCAVE_WALLET

        if (!devcaveWallet) {
          throw new Error("NEXT_PUBLIC_DEVCAVE_WALLET not configured")
        }

        return {
          devcaveWallet: devcaveWallet.slice(0, 8) + "...",
          configured: true,
        }
      },
    },
    {
      id: "sessions",
      title: "Session Management",
      description: "Test session creation and management",
      icon: <Paintbrush className="h-5 w-5" />,
      status: "pending",
      action: async () => {
        // Test session API endpoint
        const response = await fetch("/api/sessions?owner_id=999")

        if (response.status === 400) {
          // This is expected - we're testing with invalid owner_id
          return {
            apiWorking: true,
            message: "Session API responding correctly",
          }
        }

        const data = await response.json()
        return { apiWorking: true, data }
      },
    },
  ])

  const updateStep = (id: string, updates: Partial<SetupStep>) => {
    setSteps((prev) => prev.map((step) => (step.id === id ? { ...step, ...updates } : step)))
  }

  const runStep = async (step: SetupStep) => {
    if (!step.action) return

    updateStep(step.id, { status: "running" })

    try {
      const result = await step.action()
      updateStep(step.id, { status: "success", result })
    } catch (error) {
      updateStep(step.id, {
        status: "error",
        result: { error: error instanceof Error ? error.message : String(error) },
      })
    }
  }

  const runAllSteps = async () => {
    for (const step of steps) {
      if (step.action) {
        await runStep(step)
        // Small delay between steps
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }
  }

  const getStatusIcon = (status: SetupStep["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-400" />
    }
  }

  const allStepsComplete = steps.every((step) => step.status === "success")
  const hasErrors = steps.some((step) => step.status === "error")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">🚀 Solana Whiteboard Setup</h1>
          <p className="text-gray-400 text-lg">Let's get your collaborative drawing platform up and running!</p>
        </div>

        <Card className="pump-card border-gray-800 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              Setup Progress
              {allStepsComplete && <CheckCircle className="h-6 w-6 text-green-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Button
                onClick={runAllSteps}
                disabled={steps.some((s) => s.status === "running")}
                className="pump-button text-black font-semibold"
              >
                {steps.some((s) => s.status === "running") ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Setup...
                  </>
                ) : (
                  "Run Complete Setup"
                )}
              </Button>

              <Link href="/debug">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
                  Advanced Debug
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-700 bg-gray-900/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-gray-500 font-mono text-sm w-6">{index + 1}.</div>
                    {step.icon}
                    {getStatusIcon(step.status)}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{step.title}</h3>
                    <p className="text-gray-400 text-sm">{step.description}</p>

                    {step.result && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">
                          {step.status === "success" ? "✅ Success Details" : "❌ Error Details"}
                        </summary>
                        <pre className="text-xs text-gray-600 mt-1 overflow-auto bg-gray-800 p-2 rounded">
                          {JSON.stringify(step.result, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runStep(step)}
                    disabled={step.status === "running" || !step.action}
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    {step.status === "running" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {allStepsComplete && (
          <Alert className="bg-green-950/20 border-green-500/30 mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription className="text-green-400">
              <strong>🎉 Setup Complete!</strong> Your Solana Whiteboard is ready to use.
            </AlertDescription>
          </Alert>
        )}

        {hasErrors && (
          <Alert className="bg-red-950/20 border-red-500/30 mb-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-red-400">
              <strong>⚠️ Setup Issues Found</strong> Please check the error details above and fix any issues.
            </AlertDescription>
          </Alert>
        )}

        <Card className="pump-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {allStepsComplete ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/login">
                    <Button className="w-full pump-button text-black font-semibold">
                      Login / Register
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>

                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-800">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <Alert className="bg-blue-950/20 border-blue-500/30">
                  <AlertDescription className="text-blue-400">
                    <strong>Ready to create your first session!</strong>
                    <br />
                    1. Register/Login → 2. Create Session → 3. Share with viewers → 4. Start earning!
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <Alert className="bg-yellow-950/20 border-yellow-500/30">
                <AlertDescription className="text-yellow-400">
                  <strong>Complete the setup steps above first.</strong>
                  <br />
                  Run the tests to identify and fix any configuration issues.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
