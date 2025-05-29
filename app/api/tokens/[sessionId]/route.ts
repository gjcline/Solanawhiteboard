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
      tokens: tokens || { line_tokens: 0, nuke_tokens: 0 },
    })
  } catch (error) {
    console.error("Error fetching tokens:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const { user_wallet, action, token_type, line_tokens = 0, nuke_tokens = 0 } = await request.json()

    if (!user_wallet) {
      return NextResponse.json({ error: "Wallet address required" }, { status: 400 })
    }

    let tokens = null
    let useTokenResult = null

    if (action === "use") {
      useTokenResult = await UserTokenService.useToken(params.sessionId, user_wallet, token_type)

      if (!useTokenResult) {
        return NextResponse.json({ error: "No tokens available" }, { status: 400 })
      }

      tokens = useTokenResult
    } else if (action === "add") {
      tokens = await UserTokenService.addTokens(params.sessionId, user_wallet, line_tokens, nuke_tokens)
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ tokens })
  } catch (error) {
    console.error("Error updating tokens:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
