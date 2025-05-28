import { type NextRequest, NextResponse } from "next/server"
import { EscrowService } from "@/lib/services/escrow-service"
import { UserTokenService } from "@/lib/services/user-tokens"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userWallet, tokenType, quantity, totalAmount } = await request.json()

    if (!sessionId || !userWallet || !tokenType || !quantity || !totalAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate escrow wallet address (in production, this would be a PDA)
    const escrowWallet = `escrow_${sessionId}_${userWallet}_${Date.now()}`

    // Create escrow record
    const escrow = await EscrowService.createEscrow({
      session_id: sessionId,
      user_wallet: userWallet,
      total_tokens_purchased: quantity,
      total_amount_paid: totalAmount,
      escrow_wallet: escrowWallet,
    })

    // Add tokens to user's balance (they can use them immediately)
    const tokenField = tokenType === "nuke" ? "nuke_tokens" : "line_tokens"
    await UserTokenService.addTokens(
      sessionId,
      userWallet,
      tokenType === "nuke" ? 0 : quantity,
      tokenType === "nuke" ? quantity : 0,
    )

    console.log("✅ Escrow purchase created:", {
      escrowId: escrow.id,
      tokens: quantity,
      amount: totalAmount,
    })

    return NextResponse.json({
      success: true,
      escrow,
      message: `${quantity} tokens purchased and held in escrow. Streamer gets paid as you use them.`,
    })
  } catch (error) {
    console.error("Escrow purchase error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
