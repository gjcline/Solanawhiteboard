import { type NextRequest, NextResponse } from "next/server"
import { UserTokenService } from "@/lib/services/user-tokens"
import { EarningsService } from "@/lib/services/earnings-service"
import { getTokenValue } from "@/lib/pricing"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userWallet, tokenType } = await request.json()

    if (!sessionId || !userWallet || !tokenType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("🎯 Token usage request:", { sessionId, userWallet, tokenType })

    // Use the token from user's balance
    const result = await UserTokenService.useToken(sessionId, userWallet, tokenType)

    if (!result.success) {
      return NextResponse.json({ error: "No tokens available" }, { status: 400 })
    }

    // Get session info to find streamer wallet
    const sessionResult = await sql`
      SELECT streamer_wallet FROM sessions WHERE session_id = ${sessionId}
    `
    const session = sessionResult[0]

    if (session) {
      // Add earnings for the streamer (no immediate payout)
      const tokenValue = getTokenValue(tokenType as any)
      await EarningsService.addEarnings(sessionId, session.streamer_wallet, tokenValue)

      console.log("💰 Earnings added for streamer:", {
        streamer_wallet: session.streamer_wallet,
        token_value: tokenValue,
      })
    }

    console.log("✅ Token used successfully:", result)

    return NextResponse.json({
      success: true,
      tokenUsed: result.tokenUsed,
      message: `${tokenType} token used successfully! Earnings added to streamer account.`,
    })
  } catch (error) {
    console.error("Token usage error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
