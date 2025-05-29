import { NextResponse } from "next/server"
import { EscrowService } from "@/lib/services/escrow-service"
import { UserTokenService } from "@/lib/services/user-tokens"

export async function POST() {
  try {
    console.log("🧪 Testing complete purchase flow...")

    const testData = {
      sessionId: "test_session_123",
      userWallet: "test_wallet_456",
      tokenType: "single",
      quantity: 1,
      totalAmount: 0.005,
    }

    console.log("📝 Test data:", testData)

    // Step 1: Create escrow
    console.log("1️⃣ Creating escrow...")
    const escrow = await EscrowService.createEscrow({
      session_id: testData.sessionId,
      user_wallet: testData.userWallet,
      total_tokens_purchased: testData.quantity,
      total_amount_paid: testData.totalAmount,
      escrow_wallet: `escrow_${testData.sessionId}_${testData.userWallet}_${Date.now()}`,
      purchase_type: testData.tokenType,
    })
    console.log("✅ Escrow created:", escrow)

    // Step 2: Add tokens
    console.log("2️⃣ Adding tokens...")
    const tokens = await UserTokenService.addTokens(
      testData.sessionId,
      testData.userWallet,
      testData.tokenType,
      testData.quantity,
    )
    console.log("✅ Tokens added:", tokens)

    // Step 3: Get tokens to verify
    console.log("3️⃣ Verifying tokens...")
    const verifyTokens = await UserTokenService.getTokens(testData.sessionId, testData.userWallet)
    console.log("✅ Verified tokens:", verifyTokens)

    // Step 4: Test using a token
    console.log("4️⃣ Testing token usage...")
    const useResult = await UserTokenService.useToken(testData.sessionId, testData.userWallet, "line")
    console.log("✅ Token usage result:", useResult)

    // Step 5: Check final token balance
    console.log("5️⃣ Final token check...")
    const finalTokens = await UserTokenService.getTokens(testData.sessionId, testData.userWallet)
    console.log("✅ Final tokens:", finalTokens)

    return NextResponse.json({
      success: true,
      message: "Purchase flow test completed successfully",
      results: {
        escrow,
        initialTokens: tokens,
        verifyTokens,
        useResult,
        finalTokens,
      },
    })
  } catch (error) {
    console.error("❌ Purchase flow test failed:", error)
    return NextResponse.json(
      {
        error: "Purchase flow test failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
