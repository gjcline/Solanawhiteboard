"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle, Database, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function DatabaseSetupPage() {
  const [isCheckingConnection, setIsCheckingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")
  const [connectionDetails, setConnectionDetails] = useState<any>(null)

  const [isRunningMigrations, setIsRunningMigrations] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<"idle" | "success" | "error">("idle")
  const [migrationDetails, setMigrationDetails] = useState<any>(null)

  const { toast } = useToast()

  const checkConnection = async () => {
    setIsCheckingConnection(true)
    setConnectionStatus("idle")

    try {
      const response = await fetch("/api/health")
      const data = await response.json()

      if (data.status === "healthy") {
        setConnectionStatus("success")
        setConnectionDetails(data)
        toast({
          title: "Database connection successful",
          description: `Connected to Neon database at ${new Date(data.timestamp).toLocaleString()}`,
        })
      } else {
        setConnectionStatus("error")
        setConnectionDetails(data)
        toast({
          title: "Database connection failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        })
      }
    } catch (error) {
      setConnectionStatus("error")
      setConnectionDetails({ error: error instanceof Error ? error.message : "Unknown error" })
      toast({
        title: "Database connection failed",
        description: "Could not connect to the database. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsCheckingConnection(false)
    }
  }

  const runMigrations = async () => {
    setIsRunningMigrations(true)
    setMigrationStatus("idle")

    try {
      const response = await fetch("/api/migrate", {
        method: "POST",
      })
      const data = await response.json()

      if (response.ok) {
        setMigrationStatus("success")
        setMigrationDetails(data)
        toast({
          title: "Migrations completed successfully",
          description: "All database tables have been created",
        })
      } else {
        setMigrationStatus("error")
        setMigrationDetails(data)
        toast({
          title: "Migrations failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        })
      }
    } catch (error) {
      setMigrationStatus("error")
      setMigrationDetails({ error: error instanceof Error ? error.message : "Unknown error" })
      toast({
        title: "Migrations failed",
        description: "Could not run migrations. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsRunningMigrations(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">database setup</h1>

      <div className="grid gap-6 max-w-2xl mx-auto">
        {/* Database Connection */}
        <Card className="pump-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-[#00ff88]" />
              database connection
            </CardTitle>
            <CardDescription className="text-gray-400">
              check if your application can connect to the neon database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connectionStatus === "success" && (
              <Alert className="bg-green-950/20 border-green-500/30 mb-4">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400">
                  Successfully connected to the database at {new Date(connectionDetails.timestamp).toLocaleString()}
                </AlertDescription>
              </Alert>
            )}

            {connectionStatus === "error" && (
              <Alert className="bg-red-950/20 border-red-500/30 mb-4">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400">
                  Failed to connect to the database: {connectionDetails?.error || "Unknown error"}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-gray-400 mb-4">
              <p>This will test the connection to your Neon database using the DATABASE_URL environment variable.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={checkConnection}
              disabled={isCheckingConnection}
              className="pump-button text-black font-semibold"
            >
              {isCheckingConnection ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  checking connection...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  test database connection
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Run Migrations */}
        <Card className="pump-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5 text-[#00ff88]" />
              database migrations
            </CardTitle>
            <CardDescription className="text-gray-400">
              create all required tables in your neon database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {migrationStatus === "success" && (
              <Alert className="bg-green-950/20 border-green-500/30 mb-4">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400">
                  Migrations completed successfully! All database tables have been created.
                </AlertDescription>
              </Alert>
            )}

            {migrationStatus === "error" && (
              <Alert className="bg-red-950/20 border-red-500/30 mb-4">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400">
                  Failed to run migrations: {migrationDetails?.error || "Unknown error"}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-gray-400 mb-4">
              <p>This will create the following tables in your database:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>sessions - Stores drawing session information</li>
                <li>session_stats - Tracks statistics for each session</li>
                <li>user_tokens - Manages user token balances</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={runMigrations}
              disabled={isRunningMigrations}
              className="pump-button text-black font-semibold"
            >
              {isRunningMigrations ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  running migrations...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  run database migrations
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Next Steps */}
        {connectionStatus === "success" && migrationStatus === "success" && (
          <Card className="pump-card border-[#00ff88]/30 bg-[#00ff88]/5">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-[#00ff88] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Database Setup Complete!</h3>
                <p className="text-gray-400">
                  Your database is connected and all tables have been created. You're ready to start using the
                  application!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
