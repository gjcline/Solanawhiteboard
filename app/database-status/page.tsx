"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DatabaseStatusPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [createResult, setCreateResult] = useState<any>(null)

  const checkDatabase = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/simple-db-check")
      const data = await response.json()
      setStatus(data)
      console.log("Database status:", data)
    } catch (error) {
      console.error("Error checking database:", error)
      setStatus({
        success: false,
        error: "Failed to fetch database status",
        details: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setLoading(false)
    }
  }

  const createTables = async () => {
    setCreateLoading(true)
    try {
      const response = await fetch("/api/create-tables", {
        method: "POST",
      })
      const data = await response.json()
      setCreateResult(data)
      console.log("Create tables result:", data)

      // Refresh database status after creating tables
      if (data.success) {
        await checkDatabase()
      }
    } catch (error) {
      console.error("Error creating tables:", error)
      setCreateResult({
        success: false,
        error: "Failed to create tables",
        details: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Database Status</h1>
        <p className="text-gray-600">Check the current state of your database tables and connections</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <Button onClick={checkDatabase} disabled={loading} className="w-full sm:w-auto">
          {loading ? "Checking Database..." : "Check Database Status"}
        </Button>

        <Button onClick={createTables} disabled={createLoading} variant="outline" className="w-full sm:w-auto">
          {createLoading ? "Creating Tables..." : "Create Missing Tables"}
        </Button>
      </div>

      {createResult && (
        <Card className="mb-6 border border-gray-300">
          <CardHeader className="bg-gray-50">
            <CardTitle className={createResult.success ? "text-green-600" : "text-red-600"}>
              {createResult.success ? "✅ Tables Created" : "❌ Table Creation Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{createResult.message || createResult.error}</p>
            {createResult.details && <p className="text-sm text-gray-600 mt-2">{createResult.details}</p>}
          </CardContent>
        </Card>
      )}

      {status && (
        <div className="space-y-4">
          {/* Connection Status */}
          <Card className="border border-gray-300">
            <CardHeader className="bg-gray-50">
              <CardTitle className={status.success ? "text-green-600" : "text-red-600"}>
                {status.success ? "✅ Connection Status" : "❌ Connection Failed"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {status.success ? (
                <div className="space-y-2">
                  <p>
                    <strong>Database Time:</strong> {status.connection?.now}
                  </p>
                  <p>
                    <strong>Version:</strong> {status.connection?.version}
                  </p>
                  <p>
                    <strong>Environment:</strong> {status.environment?.NODE_ENV}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-red-600">
                    <strong>Error:</strong> {status.error}
                  </p>
                  <p>
                    <strong>Details:</strong> {status.details || status.errorDetails?.message}
                  </p>
                  {status.errorDetails?.stack && (
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">{status.errorDetails.stack}</pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tables Overview */}
          {status.success && status.tables && (
            <Card className="border border-gray-300">
              <CardHeader className="bg-gray-50">
                <CardTitle>📋 Tables ({status.tables.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {status.tables.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {status.tables.map((table: any, index: number) => (
                      <div key={index} className="bg-gray-100 p-2 rounded border border-gray-300 text-gray-800">
                        {table.name}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-700">No tables found</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Table Details */}
          {status.success && status.tableDetails && (
            <div className="space-y-4">
              {Object.entries(status.tableDetails).map(([tableName, info]: [string, any]) => (
                <Card key={tableName} className="border border-gray-300">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className={info.exists ? "text-green-600" : "text-red-600"}>
                      {info.exists ? "✅" : "❌"} {tableName} Table
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {info.exists ? (
                      <div className="space-y-3">
                        <p>
                          <strong>Records:</strong> {info.count}
                        </p>

                        {info.structure && info.structure.length > 0 && (
                          <div>
                            <strong>Columns:</strong>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {info.structure.map((col: any, index: number) => (
                                <div
                                  key={index}
                                  className="bg-gray-100 p-2 rounded border border-gray-300 text-gray-800"
                                >
                                  <strong>{col.column_name}</strong> ({col.data_type})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {info.sample && info.sample.length > 0 && (
                          <div>
                            <strong>Sample Data:</strong>
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto mt-2 border border-gray-300 text-gray-800">
                              {JSON.stringify(info.sample, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-red-600">Table does not exist</p>
                        {info.error && <p className="text-sm text-gray-600 mt-2">Error: {info.error}</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
