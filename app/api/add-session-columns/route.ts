import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST() {
  try {
    console.log("Adding missing columns to sessions table...")

    // Add is_active column
    await sql`
      ALTER TABLE sessions 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
    `

    // Add total_earnings column
    await sql`
      ALTER TABLE sessions 
      ADD COLUMN IF NOT EXISTS total_earnings DECIMAL(12, 9) DEFAULT 0
    `

    // Add viewer_count column
    await sql`
      ALTER TABLE sessions 
      ADD COLUMN IF NOT EXISTS viewer_count INTEGER DEFAULT 0
    `

    // Update existing sessions to be active
    await sql`
      UPDATE sessions SET is_active = true WHERE is_active IS NULL
    `

    // Add indexes for performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_sessions_owner_active ON sessions(owner_id, is_active)
    `

    console.log("Successfully added missing columns to sessions table")

    return NextResponse.json({
      success: true,
      message: "Successfully added is_active, total_earnings, and viewer_count columns to sessions table",
    })
  } catch (error) {
    console.error("Error adding columns to sessions table:", error)
    return NextResponse.json(
      {
        error: "Failed to add columns",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
