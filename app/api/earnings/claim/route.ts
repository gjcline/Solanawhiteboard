import { type NextRequest, NextResponse } from "next/server"
import { EarningsService } from "@/lib/services/earnings-service"

export async function POST(request: NextRequest) {
  try {
    const { streamerWallet, sessionIds } = await request.json()

    if (!streamerWallet) {
      return NextResponse.json({ error: "Streamer wallet address is required" }, { status: 400 })
    }

    console.log("💸 Processing earnings claim request:", { streamerWallet, sessionIds })

    const result = await EarningsService.claimEarnings(streamerWallet, sessionIds)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      amount_claimed: result.amount_claimed,
      transaction_signature: result.transaction_signature,
      message: `Successfully claimed ${result.amount_claimed} SOL`,
    })
  } catch (error) {
    console.error("❌ Earnings claim error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
