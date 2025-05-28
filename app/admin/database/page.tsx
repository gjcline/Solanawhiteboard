"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2, CheckCircle, AlertCircle, Database, RefreshCw, TestTube } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function DatabasePage() {
  const [dbUrl, setDbUrl] = useState("")
  const [isCheckingConnection, setIsCheckingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle")
  const [connectionDetails, setConnectionDetails] = useState<any>(null)
  const [isRunningMigrations, setIsRunningMigrations] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<"idle" | "success" | "error">("idle")
  const [migrationDetails, setMigrationDetails] = useState<any>(null)

  const [isTestingDb, setIsTestingDb] = useState(false)
  const [dbTestStatus, setDbTestStatus] = useState<"idle" | "success" | "error">("idle")
  const [dbTestDetails, setDbTestDetails] = useState<any>(null)

  useEffect(() => {
    // Load from local storage on mount
    const storedDbUrl = localStorage.getItem("dbUrl")
    if (storedDbUrl) {
      setDbUrl(storedDbUrl)
    }
  }, [])

  useEffect(() => {
    // Save to local storage whenever dbUrl changes
    localStorage.setItem("dbUrl", dbUrl)
  }, [dbUrl])

  const checkConnection = async () => {
    setIsCheckingConnection(true)
    setConnectionStatus("idle")

    try {
      const response = await fetch("/api/check-db-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dbUrl }),
      })
      const data = await response.json()

      if (data.success) {
        setConnectionStatus("success")
        setConnectionDetails(data)
        toast({
          title: "Database connection successful",
          description: "Database is reachable and responding",
        })
      } else {
        setConnectionStatus("error")
        setConnectionDetails(data)
        toast({
          title: "Database connection failed",
          description: data.message || "Unknown error",
          variant: "destructive",
        })
      }
    } catch (error) {
      setConnectionStatus("error")
      setConnectionDetails({
        error: error instanceof Error ? error.message : "Unknown error",
      })
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
      const response = await fetch("/api/migrate-db", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dbUrl }),
      })
      const data = await response.json()

      if (data.success) {
        setMigrationStatus("success")
        setMigrationDetails(data)
        toast({
          title: "Database migration successful",
          description: "Database schema has been updated",
        })
      } else {
        setMigrationStatus("error")
        setMigrationDetails(data)
        toast({
          title: "Database migration failed",
          description: data.message || "Unknown error",
          variant: "destructive",
        })
      }
    } catch (error) {
      setMigrationStatus("error")
      setMigrationDetails({
        error: error instanceof Error ? error.message : "Unknown error",
      })
      toast({
        title: "Database migration failed",
        description: "Could not run database migrations. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsRunningMigrations(false)
    }
  }

  const testDatabase = async () => {
    setIsTestingDb(true)
    setDbTestStatus("idle")

    try {
      const response = await fetch("/api/test-db")
      const data = await response.json()

      if (data.success) {
        setDbTestStatus("success")
        setDbTestDetails(data)
        toast({
          title: "Database test successful",
          description: "Database queries are working correctly",
        })
      } else {
        setDbTestStatus("error")
        setDbTestDetails(data)
        toast({
          title: "Database test failed",
          description: data.message || "Unknown error",
          variant: "destructive",
        })
      }
    } catch (error) {
      setDbTestStatus("error")
      setDbTestDetails({ error: error instanceof Error ? error.message : "Unknown error" })
      toast({
        title: "Database test failed",
        description: "Could not test database queries. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsTestingDb(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-5">Database Management</h1>

      <Card className="pump-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-[#00ff88]" />
            database connection
          </CardTitle>
          <CardDescription className="text-gray-400">Manage your database connection settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="dbUrl">Database URL</Label>
            <Input
              type="text"
              id="dbUrl"
              placeholder="Enter your database connection URL"
              value={dbUrl}
              onChange={(e) => setDbUrl(e.target.value)}
            />
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={checkConnection}
            disabled={isCheckingConnection}
            className="pump-button text-black font-semibold"
          >
            {isCheckingConnection ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                checking...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                test connection
              </>
            )}
          </Button>
          <Button
            onClick={testDatabase}
            disabled={isTestingDb}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            {isTestingDb ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                testing...
              </>
            ) : (
              <>
                <TestTube className="mr-2 h-4 w-4" />
                test queries
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Database Test Results */}
      {dbTestStatus !== "idle" && (
        <Card className="pump-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TestTube className="h-5 w-5 text-[#00ff88]" />
              database query test
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dbTestStatus === "success" && (
              <Alert className="bg-green-950/20 border-green-500/30">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400">
                  Database queries are working correctly!
                  {dbTestDetails?.result && (
                    <div className="mt-2 text-xs font-mono">Test result: {JSON.stringify(dbTestDetails.result)}</div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {dbTestStatus === "error" && (
              <Alert className="bg-red-950/20 border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400">
                  Database query test failed: {dbTestDetails?.message || dbTestDetails?.error || "Unknown error"}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Connection Status */}
      {connectionStatus !== "idle" && (
        <Card className="pump-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {connectionStatus === "success" ? (
                <CheckCircle className="h-5 w-5 text-[#00ff88]" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              database connection status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {connectionStatus === "success" && (
              <Alert className="bg-green-950/20 border-green-500/30">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-400">
                  Database connection is successful!
                  {connectionDetails?.version && (
                    <div className="mt-2 text-xs font-mono">Database version: {connectionDetails.version}</div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {connectionStatus === "error" && (
              <Alert className="bg-red-950/20 border-red-500/30">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-red-400">
                  Database connection failed:{" "}
                  {connectionDetails?.message || connectionDetails?.error || "Unknown error"}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Migration Status */}
      <Card className="pump-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            {migrationStatus === "success" ? (
              <CheckCircle className="h-5 w-5 text-[#00ff88]" />
            ) : (
              <Database className="h-5 w-5 text-[#00ff88]" />
            )}
            database migrations
          </CardTitle>
          <CardDescription className="text-gray-400">Run database migrations to update the schema.</CardDescription>
        </CardHeader>
        <CardContent>
          {migrationStatus === "success" && (
            <Alert className="bg-green-950/20 border-green-500/30">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-400">
                Database migration is successful!
                {migrationDetails?.message && <div className="mt-2 text-xs font-mono">{migrationDetails.message}</div>}
              </AlertDescription>
            </Alert>
          )}

          {migrationStatus === "error" && (
            <Alert className="bg-red-950/20 border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-red-400">
                Database migration failed: {migrationDetails?.message || migrationDetails?.error || "Unknown error"}
              </AlertDescription>
            </Alert>
          )}

          {migrationStatus === "idle" && (
            <Alert className="bg-gray-950/20 border-gray-500/30">
              <Database className="h-4 w-4 text-gray-500" />
              <AlertDescription className="text-gray-400">No migrations have been run yet.</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={runMigrations}
            disabled={isRunningMigrations || (connectionStatus !== "success" && dbTestStatus !== "success")}
            className="pump-button text-black font-semibold"
          >
            {isRunningMigrations ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                running migrations...
              </>
            ) : (
              "run migrations"
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Final Success */}
      {(connectionStatus === "success" || dbTestStatus === "success") && migrationStatus === "success" && (
        <Alert className="mt-5 bg-green-950/20 border-green-500/30">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-400">Database is fully configured and up to date!</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
