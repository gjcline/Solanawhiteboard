import { sql } from "../database"
import { getTokenValue } from "../pricing"
import { calculateTransactionFees, deductFeesFromAmounts } from "../solana-fees"

export interface TokenEscrow {
  id: string
  session_id: string
  user_wallet: string
  total_tokens_purchased: number
  tokens_used: number
  tokens_remaining: number
  total_amount_paid: number
  amount_released: number
  fees_deducted: number
  escrow_wallet: string
  purchase_type: string
  status: "active" | "closed" | "refunded"
  created_at: Date
  updated_at: Date
}

export interface PendingRelease {
  id: string
  escrow_id: string
  session_id: string
  user_wallet: string
  token_type: "single" | "bundle" | "nuke"
  amount_streamer: number
  amount_devcave: number
  estimated_fees: number
  created_at: Date
}

export class EscrowService {
  // Create escrow record with purchase type tracking
  static async createEscrow(data: {
    session_id: string
    user_wallet: string
    total_tokens_purchased: number
    total_amount_paid: number
    escrow_wallet: string
    purchase_type: "single" | "bundle" | "nuke"
  }): Promise<TokenEscrow> {
    const id = Math.random().toString(36).substring(2, 14)

    const result = await sql`
      INSERT INTO token_escrows (
        id, session_id, user_wallet, total_tokens_purchased, 
        tokens_used, tokens_remaining, total_amount_paid, 
        amount_released, fees_deducted, escrow_wallet, purchase_type, status
      )
      VALUES (
        ${id}, ${data.session_id}, ${data.user_wallet}, ${data.total_tokens_purchased},
        0, ${data.total_tokens_purchased}, ${data.total_amount_paid},
        0, 0, ${data.escrow_wallet}, ${data.purchase_type}, 'active'
      )
      RETURNING *
    `
    return result[0]
  }

  // Queue token usage with proper value calculation and fee estimation
  static async queueTokenUsage(
    escrowId: string,
    sessionId: string,
    userWallet: string,
    tokenUsed: "single" | "bundle" | "nuke",
  ): Promise<void> {
    // Get escrow details
    const escrow = await sql`
      SELECT * FROM token_escrows WHERE id = ${escrowId} AND status = 'active'
    `

    if (!escrow[0] || escrow[0].tokens_remaining <= 0) {
      throw new Error("No tokens available")
    }

    // Use the correct token value for payout (not purchase price)
    const tokenValue = getTokenValue(tokenUsed)
    const streamerAmount = tokenValue * 0.5
    const devcaveAmount = tokenValue * 0.5

    // Estimate transaction fees for this release
    const estimatedFees = calculateTransactionFees(2) // 2 transfer instructions

    console.log(`💰 Token usage: ${tokenUsed} token = ${tokenValue} SOL payout (${estimatedFees} SOL estimated fees)`)

    // Add to pending releases queue with fee estimation
    await sql`
      INSERT INTO pending_releases (
        id, escrow_id, session_id, user_wallet, token_type,
        amount_streamer, amount_devcave, estimated_fees
      )
      VALUES (
        ${Math.random().toString(36).substring(2, 14)},
        ${escrowId}, ${sessionId}, ${userWallet}, ${tokenUsed},
        ${streamerAmount}, ${devcaveAmount}, ${estimatedFees}
      )
    `

    // Update escrow immediately (optimistic)
    await sql`
      UPDATE token_escrows 
      SET tokens_used = tokens_used + 1,
          tokens_remaining = tokens_remaining - 1,
          amount_released = amount_released + ${tokenValue},
          updated_at = NOW()
      WHERE id = ${escrowId}
    `
  }

  // Process batched releases with proper fee handling
  static async processPendingReleases(): Promise<void> {
    // Get all pending releases grouped by session
    const pendingBySession = await sql`
      SELECT 
        session_id,
        user_wallet,
        SUM(amount_streamer) as total_streamer,
        SUM(amount_devcave) as total_devcave,
        SUM(estimated_fees) as total_estimated_fees,
        COUNT(*) as token_count,
        ARRAY_AGG(id) as release_ids,
        ARRAY_AGG(escrow_id) as escrow_ids
      FROM pending_releases
      WHERE created_at < NOW() - INTERVAL '30 seconds'
      GROUP BY session_id, user_wallet
      HAVING COUNT(*) >= 3 OR MIN(created_at) < NOW() - INTERVAL '2 minutes'
    `

    for (const batch of pendingBySession) {
      try {
        // Get session wallet
        const session = await sql`
          SELECT streamer_wallet FROM sessions WHERE session_id = ${batch.session_id}
        `

        if (!session[0]) continue

        // Calculate actual fees and adjust amounts
        const totalAmount = batch.total_streamer + batch.total_devcave
        const actualFees = calculateTransactionFees(2) // 2 transfer instructions

        const { adjustedStreamerAmount, adjustedDevcaveAmount, actualFeesDeducted } = deductFeesFromAmounts(
          batch.total_streamer,
          batch.total_devcave,
          actualFees,
        )

        console.log(`💸 Fee calculation:`, {
          original_streamer: batch.total_streamer,
          original_devcave: batch.total_devcave,
          adjusted_streamer: adjustedStreamerAmount,
          adjusted_devcave: adjustedDevcaveAmount,
          fees_deducted: actualFeesDeducted,
        })

        // Create batched transaction with fee-adjusted amounts
        await this.executeBatchedRelease({
          sessionId: batch.session_id,
          streamerWallet: session[0].streamer_wallet,
          devcaveWallet: process.env.DEVCAVE_WALLET!,
          streamerAmount: adjustedStreamerAmount,
          devcaveAmount: adjustedDevcaveAmount,
          feesDeducted: actualFeesDeducted,
          releaseIds: batch.release_ids,
        })

        // Update escrow records with actual fees deducted
        for (const escrowId of batch.escrow_ids) {
          await sql`
            UPDATE token_escrows 
            SET fees_deducted = fees_deducted + ${actualFeesDeducted / batch.escrow_ids.length}
            WHERE id = ${escrowId}
          `
        }

        // Mark as processed
        await sql`
          DELETE FROM pending_releases 
          WHERE id = ANY(${batch.release_ids})
        `

        console.log(`✅ Processed batch: ${batch.token_count} tokens, ${actualFeesDeducted} SOL fees deducted`)
      } catch (error) {
        console.error(`❌ Failed to process batch for session ${batch.session_id}:`, error)
      }
    }
  }

  // Execute the actual blockchain transaction with fee handling
  private static async executeBatchedRelease(params: {
    sessionId: string
    streamerWallet: string
    devcaveWallet: string
    streamerAmount: number
    devcaveAmount: number
    feesDeducted: number
    releaseIds: string[]
  }): Promise<void> {
    console.log("🔄 Executing batched release with fees:", {
      session: params.sessionId,
      streamer_amount: params.streamerAmount,
      devcave_amount: params.devcaveAmount,
      fees_deducted: params.feesDeducted,
      token_count: params.releaseIds.length,
    })

    // Simulate transaction processing
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In production, this would create a multi-instruction Solana transaction:
    /*
    const transaction = new Transaction()
    
    // Add instruction to send to streamer (fee-adjusted amount)
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: escrowWallet,
        toPubkey: new PublicKey(params.streamerWallet),
        lamports: params.streamerAmount * LAMPORTS_PER_SOL
      })
    )
    
    // Add instruction to send to D3vCav3 (fee-adjusted amount)
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: escrowWallet,
        toPubkey: new PublicKey(params.devcaveWallet),
        lamports: params.devcaveAmount * LAMPORTS_PER_SOL
      })
    )
    
    // Transaction fees will be automatically deducted by Solana network
    const signature = await sendAndConfirmTransaction(connection, transaction, [escrowKeypair])
    */
  }

  // Get active escrow for user/session
  static async getActiveEscrow(sessionId: string, userWallet: string): Promise<TokenEscrow | null> {
    const result = await sql`
      SELECT * FROM token_escrows 
      WHERE session_id = ${sessionId} 
      AND user_wallet = ${userWallet} 
      AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `
    return result[0] || null
  }

  // Process refund (fees already deducted from released amounts)
  static async processRefund(escrowId: string): Promise<number> {
    const escrow = await sql`
      SELECT * FROM token_escrows WHERE id = ${escrowId} AND status = 'active'
    `

    if (!escrow[0] || escrow[0].tokens_remaining <= 0) {
      return 0
    }

    const pricePerToken = escrow[0].total_amount_paid / escrow[0].total_tokens_purchased
    const refundAmount = escrow[0].tokens_remaining * pricePerToken

    // Execute refund transaction (in production)
    console.log("💰 Processing refund:", {
      user: escrow[0].user_wallet,
      amount: refundAmount,
      tokens: escrow[0].tokens_remaining,
    })

    // Update escrow status
    await sql`
      UPDATE token_escrows 
      SET status = 'refunded', updated_at = NOW()
      WHERE id = ${escrowId}
    `

    return refundAmount
  }
}
