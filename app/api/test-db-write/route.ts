import { NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: Request) {
  try {
    const { sessionId, canvasData } = await request.json()

    console.log("[Test DB Write] Starting test with:", {
      sessionId,
      canvasDataLength: canvasData?.length || 0,
      canvasDataType: typeof canvasData,
      canvasDataPrefix: canvasData?.substring(0, 50) + "...",
    })

    // Validate input
    if (!sessionId || !canvasData) {
      return NextResponse.json({ error: "Missing sessionId or canvasData" }, { status: 400 })
    }

    // Check if session exists
    const existingSession = await sql`
      SELECT id, canvas_data 
      FROM sessions 
      WHERE id = ${sessionId}
    `

    console.log("[Test DB Write] Existing session:", existingSession.length > 0)

    if (existingSession.length === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Update the canvas data using parameterized query
    const updateResult = await sql`
      UPDATE sessions 
      SET canvas_data = ${canvasData}, 
          updated_at = NOW()
      WHERE id = ${sessionId}
      RETURNING id, updated_at
    `

    console.log("[Test DB Write] Update result:", updateResult)

    // Verify the update
    const verifyResult = await sql`
      SELECT id, 
             LENGTH(canvas_data) as canvas_data_length,
             updated_at
      FROM sessions 
      WHERE id = ${sessionId}
    `

    console.log("[Test DB Write] Verification:", verifyResult[0])

    return NextResponse.json({
      success: true,
      message: "Canvas data saved successfully",
      sessionId,
      canvasDataLength: canvasData.length,
      updatedAt: updateResult[0].updated_at,
      verification: verifyResult[0],
    })
  } catch (error) {
    console.error("[Test DB Write] Detailed error:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.constructor.name : undefined,
      error: error,
    })

    return NextResponse.json(
      {
        success: false,
        error: "Database write failed",
        details: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.constructor.name : typeof error,
      },
      { status: 500 },
    )
  }
}
