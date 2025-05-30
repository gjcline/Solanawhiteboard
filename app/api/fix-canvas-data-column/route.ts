import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET() {
  try {
    console.log("[Fix Canvas Data Column] Starting migration")

    // First, check if the sessions table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sessions'
      )
    `

    console.log("[Fix Canvas Data Column] Table exists:", tableExists[0].exists)

    if (!tableExists[0].exists) {
      return NextResponse.json({
        success: false,
        error: "Sessions table does not exist",
      })
    }

    // Check current column info
    const columnInfo = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sessions'
      AND column_name = 'canvas_data'
    `

    console.log("[Fix Canvas Data Column] Current column info:", columnInfo)

    if (columnInfo.length === 0) {
      // Column doesn't exist, add it as TEXT
      await sql`
        ALTER TABLE sessions 
        ADD COLUMN canvas_data TEXT
      `
      console.log("[Fix Canvas Data Column] Added canvas_data column as TEXT")
    } else if (columnInfo[0].data_type === "json") {
      // Column exists as JSON, convert to TEXT
      await sql`
        ALTER TABLE sessions 
        ALTER COLUMN canvas_data TYPE TEXT 
        USING canvas_data::TEXT
      `
      console.log("[Fix Canvas Data Column] Converted canvas_data from JSON to TEXT")
    } else {
      console.log("[Fix Canvas Data Column] Column is already TEXT type")
    }

    // Get updated column info
    const updatedColumnInfo = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sessions'
      AND column_name = 'canvas_data'
    `

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      before: columnInfo[0] || "Column did not exist",
      after: updatedColumnInfo[0],
    })
  } catch (error) {
    console.error("[Fix Canvas Data Column] Detailed error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    })

    return NextResponse.json(
      {
        success: false,
        error: "Migration failed",
        details: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error,
      },
      { status: 500 },
    )
  }
}
