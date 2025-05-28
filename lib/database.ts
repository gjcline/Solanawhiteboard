import { neon } from "@neondatabase/serverless"

// Create a serverless connection
const sql = neon(process.env.DATABASE_URL!)

// Database query function with error handling
export async function query(text: string, params?: any[]) {
  const start = Date.now()
  try {
    const res = await sql(text, params)
    const duration = Date.now() - start
    console.log("Executed query", { text, duration, rows: res.length })
    return { rows: res, rowCount: res.length }
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Transaction wrapper (simplified for serverless)
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  // Note: Neon serverless doesn't support traditional transactions
  // For simple operations, we'll execute them directly
  // For complex transactions, consider using Neon's transaction API
  const mockClient = {
    query: (text: string, params?: any[]) => sql(text, params),
  }
  return await callback(mockClient)
}

// Health check function
export async function healthCheck() {
  try {
    const result = await sql`SELECT NOW() as now`
    return { status: "healthy", timestamp: result[0].now }
  } catch (error) {
    return { status: "unhealthy", error: error.message }
  }
}

// No need for closePool with serverless
export async function closePool() {
  // No-op for serverless
}
