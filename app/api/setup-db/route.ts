import { NextResponse } from "next/server"
import { setupDatabase } from "@/scripts/setup-database"

export async function POST() {
  try {
    const result = await setupDatabase()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Setup failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Setup failed",
      },
      { status: 500 },
    )
  }
}
