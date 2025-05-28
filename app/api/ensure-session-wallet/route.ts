import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST() {
  try {
    console.log("Checking sessions table structure for wallet support...")

    // Check if the streamer_wallet column exists
    const columnCheck = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'sessions' 
      AND column_name = 'streamer_wallet'
      AND table_schema = 'public'
    `

    if (columnCheck.length === 0) {
      console.log("streamer_wallet column does not exist, adding it...")

      // Add the column if it doesn't exist
      await sql`
        ALTER TABLE sessions 
        ADD COLUMN streamer_wallet VARCHAR(255) NOT NULL DEFAULT ''
      `

      console.log("streamer_wallet column added successfully")
    } else {
      console.log("streamer_wallet column already exists:", columnCheck[0])
    }

    // Check if we need to make it NOT NULL
    if (columnCheck.length > 0 && columnCheck[0].is_nullable === "YES") {
      console.log("Making streamer_wallet column NOT NULL...")

      // First, update any NULL values to empty string
      await sql`
        UPDATE sessions 
        SET streamer_wallet = '' 
        WHERE streamer_wallet IS NULL
      `

      // Then alter the column to be NOT NULL
      await sql`
        ALTER TABLE sessions 
        ALTER COLUMN streamer_wallet SET NOT NULL
      `
    }

    return NextResponse.json({
      success: true,
      message: "Sessions table updated for wallet support",
    })
  } catch (error) {
    console.error("Error updating sessions table:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
