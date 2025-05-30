import { type NextRequest, NextResponse } from "next/server"
import { EarningsService } from "@/lib/services/earnings-service"

export async function GET(request: NextRequest, { params }: { params: { wallet: string } }) {
  try {
    const streamerWallet = params.wallet

    if (!streamerWallet) {
      return NextResponse.json({ error: "Wallet address is required" }, { status: 400 })
    }

    console.log("📊 Getting earnings for wallet:", streamerWallet)

    const [earnings, summary] = await Promise.all([
      EarningsService.getStreamerEarnings(streamerWallet),
      EarningsService.getEarningsSummary(streamerWallet),
    ])

    return NextResponse.json({
      earnings,
      summary,
    })
  } catch (error) {
    console.error("❌ Error getting earnings:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
