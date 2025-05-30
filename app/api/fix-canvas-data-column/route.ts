import { NextResponse } from "next/server"
import { sql } from "@/lib/database"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    console.log("[Fix Canvas Data Column] Starting migration")

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), "migrations", "fix-canvas-data-column.sql")
    const sqlQuery = fs.readFileSync(sqlFilePath, "utf8")

    // Execute the SQL query
    const result = await sql.query(sqlQuery)

    console.log("[Fix Canvas Data Column] Migration completed:", result)

    // Check the current column type
    const columnInfo = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'sessions'
      AND column_name = 'canvas_data'
    `

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      columnInfo: columnInfo[0],
    })
  } catch (error) {
    console.error("[Fix Canvas Data Column] Error:", error)
    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
