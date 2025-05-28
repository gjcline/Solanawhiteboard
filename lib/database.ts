import { neon } from "@neondatabase/serverless"

// Use the environment variable for the connection string
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

// Create the SQL client
const sql = neon(DATABASE_URL)

export { sql }

// Simple query helper
export async function query(text: string, params: any[] = []) {
  try {
    if (params.length > 0) {
      return await sql.query(text, params)
    } else {
      // For simple queries, use template literal
      return await sql([text] as any)
    }
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// Execute SQL helper function
export async function executeSQL(queryFn: (sql: any) => Promise<any>) {
  try {
    const result = await queryFn(sql)
    return { success: true, data: result }
  } catch (error) {
    console.error("Database execution error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Health check function
export async function healthCheck() {
  try {
    const result = await sql`SELECT NOW() as now`
    return {
      status: "healthy",
      timestamp: result[0].now,
      serverTime: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Health check failed:", error)
    return {
      status: "unhealthy",
      error: error instanceof Error ? error.message : String(error),
      serverTime: new Date().toISOString(),
    }
  }
}
