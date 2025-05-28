import { sql } from "../database"

export interface TokenEscrow {
  id: string
  session_id: string
  user_wallet: string
  total_tokens_purchased: number
  tokens_used: number
  tokens_remaining: number
  total_amount_paid: number
  amount_released: number
  escrow_wallet: string
  status: "active" | "closed" | "refunded"
  created_at: Date
  updated_at: Date
}

export interface PendingRelease {
  id: string
  escrow_id: string
  session_id: string
  user_wallet: string
  token_type: "line" | "nuke"
  amount_streamer: number
  amount_devcave: number
  created_at: Date
}

export class EscrowService {
  // Create escrow record (no blockchain transaction yet)
  static async createEscrow(data: {
    session_id: string
    user_wallet: string
    total_tokens_purchased: number
    total_amount_paid: number
    escrow_wallet: string
  }): Promise<TokenEscrow> {
    const id = Math.random().toString(36).substring(2, 14)

    const result = await sql`
      INSERT INTO token_escrows (
        id, session_id, user_wallet, total_tokens_purchased, 
        tokens_used, tokens_remaining, total_amount_paid, 
        amount_released, escrow_wallet, status
      )
      VALUES (
        ${id}, ${data.session_id}, ${data.user_wallet}, ${data.total_tokens_purchased},
        0, ${data.total_tokens_purchased}, ${data.total_amount_paid},
        0, ${data.escrow_wallet}, 'active'
      )
      RETURNING *
    `
    return result[0]
  }

  // Queue token usage for batch processing
  static async queueTokenUsage(
    escrowId: string,
    sessionId: string,
    userWallet: string,
    tokenType: "line" | "nuke",
  ): Promise<void> {
    // Get escrow details
    const escrow = await sql`
      SELECT * FROM token_escrows WHERE id = ${escrowId} AND status = 'active'
    `

    if (!escrow[0] || escrow[0].tokens_remaining <= 0) {
      throw new Error("No tokens available")
    }

    const pricePerToken = escrow[0].total_amount_paid / escrow[0].total_tokens_purchased
    const streamerAmount = pricePerToken * 0.5
    const devcaveAmount = pricePerToken * 0.5

    // Add to pending releases queue
    await sql`
      INSERT INTO pending_releases (
        id, escrow_id, session_id, user_wallet, token_type,
        amount_streamer, amount_devcave
      )
      VALUES (
        ${Math.random().toString(36).substring(2, 14)},
        ${escrowId}, ${sessionId}, ${userWallet}, ${tokenType},
        ${streamerAmount}, ${devcaveAmount}
      )
    `

    // Update escrow immediately (optimistic)
    await sql`
      UPDATE token_escrows 
      SET tokens_used = tokens_used + 1,
          tokens_remaining = tokens_remaining - 1,
          amount_released = amount_released + ${pricePerToken},
          updated_at = NOW()
      WHERE id = ${escrowId}
    `
  }

  // Process batched releases (called every 30 seconds)
  static async processPendingReleases(): Promise<void> {
    // Get all pending releases grouped by session
    const pendingBySession = await sql`
      SELECT 
        session_id,
        user_wallet,
        SUM(amount_streamer) as total_streamer,
        SUM(amount_devcave) as total_devcave,
        COUNT(*) as token_count,
        ARRAY_AGG(id) as release_ids
      FROM pending_releases
      WHERE created_at < NOW() - INTERVAL '30 seconds'
      GROUP BY session_id, user_wallet
      HAVING COUNT(*) >= 3 OR MIN(created_at) < NOW() - INTERVAL '2 minutes'
    `

    for (const batch of pendingBySession) {
      try {
        // Get session wallet
        const session = await sql`
          SELECT streamer_wallet FROM sessions WHERE id = ${batch.session_id}
        `

        if (!session[0]) continue

        // Create batched transaction
        await this.executeBatchedRelease({
          sessionId: batch.session_id,
          streamerWallet: session[0].streamer_wallet,
          devcaveWallet: process.env.DEVCAVE_WALLET!,
          streamerAmount: batch.total_streamer,
          devcaveAmount: batch.total_devcave,
          releaseIds: batch.release_ids,
        })

        // Mark as processed
        await sql`
          DELETE FROM pending_releases 
          WHERE id = ANY(${batch.release_ids})
        `

        console.log(`✅ Processed batch: ${batch.token_count} tokens for session ${batch.session_id}`)
      } catch (error) {
        console.error(`❌ Failed to process batch for session ${batch.session_id}:`, error)
      }
    }
  }

  // Execute the actual blockchain transaction
  private static async executeBatchedRelease(params: {
    sessionId: string
    streamerWallet: string
    devcaveWallet: string
    streamerAmount: number
    devcaveAmount: number
    releaseIds: string[]
  }): Promise<void> {
    // In production, this would create a multi-instruction Solana transaction
    console.log("🔄 Executing batched release:", {
      session: params.sessionId,
      streamer_amount: params.streamerAmount,
      devcave_amount: params.devcaveAmount,
      token_count: params.releaseIds.length,
    })

    // Simulate transaction processing
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // In production:
    /*
    const transaction = new Transaction()
    
    // Add instruction to send to streamer
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: escrowWallet,
        toPubkey: new PublicKey(params.streamerWallet),
        lamports: params.streamerAmount * LAMPORTS_PER_SOL
      })
    )
    
    // Add instruction to send to D3vCav3
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: escrowWallet,
        toPubkey: new PublicKey(params.devcaveWallet),
        lamports: params.devcaveAmount * LAMPORTS_PER_SOL
      })
    )
    
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

  // Process refund
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
