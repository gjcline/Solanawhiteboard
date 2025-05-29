import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST() {
  try {
    console.log("Checking user_tokens table structure...")

    // Check if user_tokens table exists
    const tableExists = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'user_tokens' 
      AND table_schema = 'public'
    `

    if (tableExists.length === 0) {
      console.log("Creating user_tokens table...")

      // Create the table with correct column names
      await sql`
        CREATE TABLE user_tokens (
          session_id VARCHAR(255) NOT NULL,
          wallet_address VARCHAR(255) NOT NULL,
          line_tokens INTEGER DEFAULT 0,
          nuke_tokens INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (session_id, wallet_address)
        )
      `

      console.log("user_tokens table created successfully")

      return NextResponse.json({
        success: true,
        message: "user_tokens table created with correct schema",
      })
    }

    // Check current columns
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_tokens' 
      AND table_schema = 'public'
    `

    const columnNames = columns.map((col) => col.column_name)
    console.log("Current columns:", columnNames)

    // Check if we need to rename user_wallet to wallet_address
    if (columnNames.includes("user_wallet") && !columnNames.includes("wallet_address")) {
      console.log("Renaming user_wallet column to wallet_address...")

      await sql`
        ALTER TABLE user_tokens 
        RENAME COLUMN user_wallet TO wallet_address
      `

      console.log("Column renamed successfully")

      return NextResponse.json({
        success: true,
        message: "user_wallet column renamed to wallet_address",
      })
    }

    // If wallet_address doesn't exist but user_wallet doesn't either, add wallet_address
    if (!columnNames.includes("wallet_address")) {
      console.log("Adding wallet_address column...")

      await sql`
        ALTER TABLE user_tokens 
        ADD COLUMN wallet_address VARCHAR(255)
      `

      console.log("wallet_address column added")

      return NextResponse.json({
        success: true,
        message: "wallet_address column added to user_tokens table",
      })
    }

    console.log("user_tokens table structure is correct")

    return NextResponse.json({
      success: true,
      message: "user_tokens table structure is already correct",
      columns: columnNames,
    })
  } catch (error) {
    console.error("Error fixing user_tokens table:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
