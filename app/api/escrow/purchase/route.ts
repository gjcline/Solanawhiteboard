import { type NextRequest, NextResponse } from "next/server"
import { EscrowService } from "@/lib/services/escrow-service"
import { UserTokenService } from "@/lib/services/user-tokens"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userWallet, tokenType, quantity, totalAmount } = await request.json()

    console.log("🛒 Purchase request:", { sessionId, userWallet, tokenType, quantity, totalAmount })

    if (!sessionId || !userWallet || !tokenType || !quantity || !totalAmount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate escrow wallet address (in production, this would be a PDA)
    const escrowWallet = `escrow_${sessionId}_${userWallet}_${Date.now()}`

    // Create escrow record with purchase type
    const escrow = await EscrowService.createEscrow({
      session_id: sessionId,
      user_wallet: userWallet,
      total_tokens_purchased: quantity,
      total_amount_paid: totalAmount,
      escrow_wallet: escrowWallet,
      purchase_type: tokenType, // Track the purchase type for proper payouts
    })

    console.log("✅ Escrow created:", escrow)

    // Add tokens to user's balance based on purchase type
    await UserTokenService.addTokens(sessionId, userWallet, tokenType, quantity)

    console.log("✅ Tokens added to user balance")

    // Verify tokens were added
    const userTokens = await UserTokenService.getTokens(sessionId, userWallet)
    console.log("📊 User tokens after purchase:", userTokens)

    return NextResponse.json({
      success: true,
      escrow,
      userTokens,
      message: `${quantity} ${tokenType} tokens purchased and held in escrow. Streamer gets paid as you use them.`,
    })
  } catch (error) {
    console.error("❌ Escrow purchase error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
