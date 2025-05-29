import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST() {
  try {
    console.log("Checking if user_tokens table exists...")

    // First, check if user_tokens table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_tokens'
      );
    `

    if (!tableExists[0].exists) {
      console.log("Creating user_tokens table...")
      // Create the table if it doesn't exist
      await sql`
        CREATE TABLE user_tokens (
          session_id VARCHAR(255) NOT NULL,
          user_wallet VARCHAR(255) NOT NULL,
          line_tokens INTEGER DEFAULT 0,
          nuke_tokens INTEGER DEFAULT 0,
          updated_at TIMESTAMP DEFAULT NOW(),
          PRIMARY KEY (session_id, user_wallet)
        );
      `
      console.log("✅ Created user_tokens table")
    } else {
      console.log("Table exists, checking for user_wallet column...")

      // Check if user_wallet column exists
      const columnExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'user_tokens' 
          AND column_name = 'user_wallet'
        );
      `

      if (!columnExists[0].exists) {
        console.log("Adding user_wallet column...")
        await sql`
          ALTER TABLE user_tokens 
          ADD COLUMN user_wallet VARCHAR(255) NOT NULL DEFAULT '';
        `
        console.log("✅ Added user_wallet column")
      } else {
        console.log("✅ user_wallet column already exists")
      }
    }

    // Show final table structure
    const tableInfo = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'user_tokens'
      ORDER BY ordinal_position;
    `

    return NextResponse.json({
      success: true,
      message: "Database schema updated successfully",
      tableStructure: tableInfo,
    })
  } catch (error) {
    console.error("Error updating database schema:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update database schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
