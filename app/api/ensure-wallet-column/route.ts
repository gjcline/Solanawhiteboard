import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST() {
  try {
    console.log("Checking if wallet_address column exists in users table...")

    // Check if the column exists
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'wallet_address'
      AND table_schema = 'public'
    `

    if (columnCheck.length === 0) {
      console.log("wallet_address column does not exist, adding it...")

      // Add the column if it doesn't exist
      await sql`
        ALTER TABLE users 
        ADD COLUMN wallet_address VARCHAR(255)
      `

      console.log("wallet_address column added successfully")

      return NextResponse.json({
        success: true,
        message: "wallet_address column added to users table",
      })
    }

    console.log("wallet_address column already exists")

    return NextResponse.json({
      success: true,
      message: "wallet_address column already exists in users table",
    })
  } catch (error) {
    console.error("Error ensuring wallet_address column:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
