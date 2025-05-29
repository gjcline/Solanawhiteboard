import { sql } from "../database" // Assuming this is the Vercel Postgres `sql`
import { getTokenValue, DEVCAVE_WALLET } from "../pricing"
import {
  calculateTransactionFeesWithTolerance,
  deductFeesFromAmountsFlexible,
  isFeesAcceptable,
  validateSufficientBalanceFlexible,
} from "../solana-fees"
import { createStreamerPayoutTransaction } from "../solana-transactions"

export interface EscrowRecord {
  id?: number
  session_id: string
  user_wallet: string
  total_tokens_purchased: number
  total_amount_paid: number
  escrow_wallet: string
  purchase_type: string
  created_at?: Date
  status?: string
}

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
  static async createEscrow(escrowData: EscrowRecord): Promise<EscrowRecord> {
    try {
      console.log("🏦 Creating escrow (v3):", escrowData)

      // Ensure the table exists
      await sql`
        CREATE TABLE IF NOT EXISTS escrow_transactions (
          id SERIAL PRIMARY KEY,
          session_id VARCHAR(255) NOT NULL,
          user_wallet VARCHAR(255) NOT NULL,
          total_tokens_purchased INTEGER NOT NULL,
          total_amount_paid DECIMAL(12, 9) NOT NULL,
          escrow_wallet VARCHAR(255) NOT NULL,
          purchase_type VARCHAR(20) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `

      // Step 1: Insert the record and return only the ID
      const insertResult = await sql.query(
        `INSERT INTO escrow_transactions 
         (session_id, user_wallet, total_tokens_purchased, total_amount_paid, escrow_wallet, purchase_type, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')
         RETURNING id`,
        [
          escrowData.session_id,
          escrowData.user_wallet,
          escrowData.total_tokens_purchased,
          escrowData.total_amount_paid,
          escrowData.escrow_wallet,
          escrowData.purchase_type,
        ],
      )

      console.log("Raw insertResult:", insertResult)

      // Fix: Vercel Postgres sql.query returns rows directly as an array, not wrapped in { rows: [...] }
      if (!insertResult || !Array.isArray(insertResult) || insertResult.length === 0 || !insertResult[0].id) {
        console.error(
          "⚠️ No ID returned from insert operation for escrowData:",
          escrowData,
          "InsertResult:",
          insertResult,
        )
        throw new Error("Failed to create escrow record: No ID returned after insert.")
      }

      const newEscrowId = insertResult[0].id
      console.log(`✅ Escrow record inserted with ID: ${newEscrowId}`)

      // Step 2: Fetch the newly created record using its ID
      const selectResult = await sql.query(`SELECT * FROM escrow_transactions WHERE id = $1`, [newEscrowId])

      console.log("Raw selectResult:", selectResult)

      // Fix: Same here - selectResult is directly an array
      if (!selectResult || !Array.isArray(selectResult) || selectResult.length === 0) {
        console.error(`⚠️ Failed to fetch escrow record with ID ${newEscrowId} after insert.`)
        throw new Error(`Failed to retrieve escrow record (ID: ${newEscrowId}) after creation.`)
      }

      console.log("✅ Escrow created and fetched:", selectResult[0])
      return selectResult[0]
    } catch (error) {
      console.error("❌ Error in createEscrow (v3):", error)
      throw error
    }
  }

  static async getEscrowsBySession(sessionId: string): Promise<EscrowRecord[]> {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS escrow_transactions (
          id SERIAL PRIMARY KEY,
          session_id VARCHAR(255) NOT NULL,
          user_wallet VARCHAR(255) NOT NULL,
          total_tokens_purchased INTEGER NOT NULL,
          total_amount_paid DECIMAL(12, 9) NOT NULL,
          escrow_wallet VARCHAR(255) NOT NULL,
          purchase_type VARCHAR(20) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `
      const result = await sql.query(
        `SELECT * FROM escrow_transactions WHERE session_id = $1 ORDER BY created_at DESC`,
        [sessionId],
      )

      // Fix: result is directly an array
      return Array.isArray(result) ? result : []
    } catch (error) {
      console.error("❌ Error getting escrows by session:", error)
      return []
    }
  }

  static async updateEscrowStatus(escrowId: number, status: string): Promise<boolean> {
    try {
      await sql.query(`UPDATE escrow_transactions SET status = $1 WHERE id = $2`, [status, escrowId])
      return true
    } catch (error) {
      console.error("❌ Error updating escrow status:", error)
      return false
    }
  }

  static async queueTokenUsage(
    escrowId: string,
    sessionId: string,
    userWallet: string,
    tokenUsed: "single" | "bundle" | "nuke",
  ): Promise<void> {
    const escrowResult = await sql`
      SELECT * FROM token_escrows WHERE id = ${escrowId} AND status = 'active'
    `
    const escrow = escrowResult[0] // Fix: escrowResult is directly an array

    if (!escrow || escrow.tokens_remaining <= 0) {
      throw new Error("No tokens available or escrow not found")
    }

    const tokenValue = getTokenValue(tokenUsed)
    const streamerAmount = tokenValue * 0.5
    const devcaveAmount = tokenValue * 0.5

    const feeCalc = calculateTransactionFeesWithTolerance(1)
    const estimatedFees = feeCalc.totalFee

    console.log(`💰 Token usage with flexible fees:`, {
      token_type: tokenUsed,
      token_value: tokenValue,
      streamer_amount: streamerAmount,
      devcave_amount: devcaveAmount,
      estimated_fees: estimatedFees,
      fee_tolerance: feeCalc.toleranceRange,
    })

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

    await sql`
      UPDATE token_escrows 
      SET tokens_used = tokens_used + 1,
          tokens_remaining = tokens_remaining - 1,
          amount_released = amount_released + ${tokenValue},
          updated_at = NOW()
      WHERE id = ${escrowId}
    `
  }

  static async processPendingReleases(): Promise<void> {
    const pendingBySessionResult = await sql`
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
    const pendingBySession = pendingBySessionResult // Fix: result is directly an array

    for (const batch of pendingBySession) {
      try {
        const sessionResult = await sql`
          SELECT streamer_wallet FROM sessions WHERE session_id = ${batch.session_id}
        `
        const session = sessionResult[0] // Fix: result is directly an array

        if (!session) continue

        const totalAmount = batch.total_streamer + batch.total_devcave
        if (!validateSufficientBalanceFlexible(totalAmount, batch.total_streamer, batch.total_estimated_fees)) {
          console.warn(`⚠️ Skipping batch due to insufficient balance for fee tolerance`)
          continue
        }

        const { signature, actualFee } = await this.executeBatchedReleaseFlexible({
          sessionId: batch.session_id,
          streamerWallet: session.streamer_wallet,
          streamerAmount: batch.total_streamer,
          devcaveAmount: batch.total_devcave,
          estimatedFees: batch.total_estimated_fees,
          releaseIds: batch.release_ids,
        })

        const { adjustedStreamerAmount, actualFeesDeducted, feeVariance } = deductFeesFromAmountsFlexible(
          batch.total_streamer,
          batch.total_devcave,
          actualFee,
          batch.total_estimated_fees,
        )

        console.log(`💸 Batch processed with flexible fees:`, {
          estimated_fees: batch.total_estimated_fees,
          actual_fees: actualFee,
          fee_variance: feeVariance,
          variance_percentage:
            batch.total_estimated_fees > 0
              ? ((feeVariance / batch.total_estimated_fees) * 100).toFixed(2) + "%"
              : "N/A",
          final_streamer_amount: adjustedStreamerAmount,
        })

        for (const escrowId of batch.escrow_ids) {
          await sql`
            UPDATE token_escrows 
            SET fees_deducted = fees_deducted + ${actualFeesDeducted / batch.escrow_ids.length}
            WHERE id = ${escrowId}
          `
        }

        await sql`
          DELETE FROM pending_releases 
          WHERE id = ANY(${batch.release_ids})
        `

        console.log(`✅ Processed batch: ${batch.token_count} tokens, signature: ${signature}`)
      } catch (error) {
        console.error(`❌ Failed to process batch for session ${batch.session_id}:`, error)
        if (error instanceof Error && error.message.includes("fee")) {
          console.log(`🔄 Fee-related error, will retry batch later`)
        }
      }
    }
  }

  private static async executeBatchedReleaseFlexible(params: {
    sessionId: string
    streamerWallet: string
    streamerAmount: number
    devcaveAmount: number
    estimatedFees: number
    releaseIds: string[]
  }): Promise<{ signature: string; actualFee: number }> {
    console.log("🔄 Executing batched release with flexible fees:", {
      session: params.sessionId,
      streamer_amount: params.streamerAmount,
      devcave_keeps: params.devcaveAmount,
      estimated_fees: params.estimatedFees,
      token_count: params.releaseIds.length,
    })

    try {
      const { signature, actualFee } = await createStreamerPayoutTransaction({
        fromWallet: DEVCAVE_WALLET,
        toWallet: params.streamerWallet,
        amount: params.streamerAmount,
        network: "mainnet-beta",
        maxAcceptableFee: params.estimatedFees * 1.5,
      })

      if (!isFeesAcceptable(params.estimatedFees, actualFee)) {
        throw new Error(`Transaction fee too high: ${actualFee} SOL`)
      }

      console.log(`💰 Streamer payout successful with flexible fees:`, {
        signature,
        estimated_fee: params.estimatedFees,
        actual_fee: actualFee,
        fee_difference: actualFee - params.estimatedFees,
      })

      return { signature, actualFee }
    } catch (error) {
      console.error("❌ Streamer payout failed:", error)
      throw error
    }
  }

  static async getActiveEscrow(sessionId: string, userWallet: string): Promise<TokenEscrow | null> {
    const result = await sql`
      SELECT * FROM token_escrows 
      WHERE session_id = ${sessionId} 
      AND user_wallet = ${userWallet} 
      AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `
    return result[0] || null // Fix: result is directly an array
  }

  static async processRefund(escrowId: string): Promise<number> {
    const escrowResult = await sql`
      SELECT * FROM token_escrows WHERE id = ${escrowId} AND status = 'active'
    `
    const escrow = escrowResult[0] // Fix: result is directly an array

    if (!escrow || escrow.tokens_remaining <= 0) {
      return 0
    }

    const pricePerToken = escrow.total_amount_paid / escrow.total_tokens_purchased
    const refundAmount = escrow.tokens_remaining * pricePerToken

    console.log("💰 Processing refund:", {
      user: escrow.user_wallet,
      amount: refundAmount,
      tokens: escrow.tokens_remaining,
    })

    await sql`
      UPDATE token_escrows 
      SET status = 'refunded', updated_at = NOW()
      WHERE id = ${escrowId}
    `

    return refundAmount
  }
}
