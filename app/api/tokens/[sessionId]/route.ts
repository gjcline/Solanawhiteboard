import { type NextRequest, NextResponse } from "next/server"
import { UserTokenService } from "@/lib/services/user-tokens"

export async function GET(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const user_wallet = searchParams.get("wallet")

    if (!user_wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    const tokens = await UserTokenService.getTokens(params.sessionId, user_wallet)

    return NextResponse.json({
      tokens: tokens
        ? {
            line_tokens: tokens.line_tokens,
            bundle_tokens: tokens.bundle_tokens,
            nuke_tokens: tokens.nuke_tokens,
            total_line_tokens: tokens.line_tokens + tokens.bundle_tokens,
          }
        : {
            line_tokens: 0,
            bundle_tokens: 0,
            nuke_tokens: 0,
            total_line_tokens: 0,
          },
    })
  } catch (error) {
    console.error("Error fetching tokens:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { user_wallet, token_type } = await request.json()

    if (!user_wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    if (!token_type || !["line", "nuke"].includes(token_type)) {
      return NextResponse.json({ error: "Valid token_type required (line or nuke)" }, { status: 400 })
    }

    // Get updated tokens before potentially using one
    const tokensBeforeUse = await UserTokenService.getTokens(params.sessionId, user_wallet)

    const result = await UserTokenService.useToken(params.sessionId, user_wallet, token_type as "line" | "nuke")

    if (!result.success) {
      return NextResponse.json({ error: "No tokens available" }, { status: 400 })
    }

    // Get updated tokens
    const tokens = await UserTokenService.getTokens(params.sessionId, user_wallet)

    return NextResponse.json({
      success: true,
      tokenUsed: result.tokenUsed,
      tokens: tokens
        ? {
            line_tokens: tokens.line_tokens,
            bundle_tokens: tokens.bundle_tokens,
            nuke_tokens: tokens.nuke_tokens,
            total_line_tokens: tokens.line_tokens + tokens.bundle_tokens,
          }
        : {
            line_tokens: 0,
            bundle_tokens: 0,
            nuke_tokens: 0,
            total_line_tokens: 0,
          },
    })
  } catch (error) {
    console.error("Error using token:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
