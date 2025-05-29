import { type NextRequest, NextResponse } from "next/server"
import { UserTokenService } from "@/lib/services/user-tokens"

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userWallet, tokenType } = await request.json()

    if (!sessionId || !userWallet || !tokenType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("🎯 Token usage request:", { sessionId, userWallet, tokenType })

    // Simplified approach: directly use the token from user_tokens
    // This bypasses the escrow system for now
    const result = await UserTokenService.useToken(sessionId, userWallet, tokenType)

    if (!result.success) {
      return NextResponse.json({ error: "No tokens available" }, { status: 400 })
    }

    console.log("✅ Token used successfully:", result)

    return NextResponse.json({
      success: true,
      tokenUsed: result.tokenUsed,
      message: `${tokenType} token used successfully!`,
    })
  } catch (error) {
    console.error("Token usage error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
