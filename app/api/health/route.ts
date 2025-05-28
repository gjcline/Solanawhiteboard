import { NextResponse } from "next/server"
import { healthCheck } from "@/lib/database"

export async function GET() {
  try {
    const health = await healthCheck()
    return NextResponse.json(health)
  } catch (error) {
    return NextResponse.json({ status: "unhealthy", error: error.message }, { status: 500 })
  }
}
