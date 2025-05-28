import { type NextRequest, NextResponse } from "next/server"
import { EscrowService } from "@/lib/services/escrow-service"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const userWallet = searchParams.get("userWallet")

    if (!sessionId || !userWallet) {
      return NextResponse.json({ error: "Missing sessionId or userWallet" }, { status: 400 })
    }

    // Get escrow status
    const escrow = await EscrowService.getActiveEscrow(sessionId, userWallet)

    if (!escrow) {
      return NextResponse.json({
        hasEscrow: false,
        message: "No active escrow found",
      })
    }

    // Get pending releases count
    const pendingReleases = await sql`
      SELECT COUNT(*) as count 
      FROM pending_releases 
      WHERE escrow_id = ${escrow.id}
    `

    const pricePerToken = escrow.total_amount_paid / escrow.total_tokens_purchased
    const refundableAmount = escrow.tokens_remaining * pricePerToken

    return NextResponse.json({
      hasEscrow: true,
      escrow: {
        id: escrow.id,
        totalTokens: escrow.total_tokens_purchased,
        tokensUsed: escrow.tokens_used,
        tokensRemaining: escrow.tokens_remaining,
        totalPaid: escrow.total_amount_paid,
        amountReleased: escrow.amount_released,
        refundableAmount,
        status: escrow.status,
      },
      pendingReleases: Number.parseInt(pendingReleases[0].count),
      pricePerToken,
    })
  } catch (error) {
    console.error("Escrow status error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
