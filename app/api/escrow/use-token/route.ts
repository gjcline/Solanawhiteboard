import { type NextRequest, NextResponse } from "next/server"
import { EscrowService } from "@/lib/services/escrow-service"
import { UserTokenService } from "@/lib/services/user-tokens"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userWallet, tokenType } = await request.json()

    if (!sessionId || !userWallet || !tokenType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get active escrow
    const escrow = await EscrowService.getActiveEscrow(sessionId, userWallet)

    if (!escrow || escrow.tokens_remaining <= 0) {
      return NextResponse.json({ error: "No tokens available" }, { status: 400 })
    }

    // Queue the token usage for batch processing
    await EscrowService.queueTokenUsage(escrow.id, sessionId, userWallet, tokenType)

    // Update user's token balance immediately
    // The original code had a linting error here because it was calling a hook conditionally.
    // Since this is a server component, we can just call the service directly.
    const updatedTokens = await UserTokenService.useToken(sessionId, userWallet, tokenType)

    console.log("⏳ Token usage queued for batch processing:", {
      escrowId: escrow.id,
      tokenType,
      remainingTokens: escrow.tokens_remaining - 1,
    })

    return NextResponse.json({
      success: true,
      tokens: updatedTokens,
      message: "Token used! Payment will be processed in the next batch (within 30 seconds).",
    })
  } catch (error) {
    console.error("Token usage error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
