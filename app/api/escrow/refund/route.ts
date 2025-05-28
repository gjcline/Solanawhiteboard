import { type NextRequest, NextResponse } from "next/server"
import { EscrowService } from "@/lib/services/escrow-service"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userWallet } = await request.json()

    if (!sessionId || !userWallet) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get active escrow
    const escrow = await EscrowService.getActiveEscrow(sessionId, userWallet)

    if (!escrow) {
      return NextResponse.json({ error: "No active escrow found" }, { status: 404 })
    }

    if (escrow.tokens_remaining <= 0) {
      return NextResponse.json({ error: "No tokens to refund" }, { status: 400 })
    }

    // Process refund
    const refundAmount = await EscrowService.processRefund(escrow.id)

    console.log("💰 Refund processed:", {
      user: userWallet,
      amount: refundAmount,
      tokens: escrow.tokens_remaining,
    })

    return NextResponse.json({
      success: true,
      refundAmount,
      tokensRefunded: escrow.tokens_remaining,
      message: `Refunded ${refundAmount} SOL for ${escrow.tokens_remaining} unused tokens.`,
    })
  } catch (error) {
    console.error("Refund error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
