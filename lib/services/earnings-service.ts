import { sql } from "../database"
import { REVENUE_SPLIT } from "../pricing"

export interface StreamerEarnings {
  id: number
  session_id: string
  streamer_wallet: string
  total_earned: number
  total_claimed: number
  pending_amount: number
  last_claim_at: Date | null
  created_at: Date
  updated_at: Date
}

export interface EarningsClaimResult {
  success: boolean
  amount_claimed: number
  transaction_signature?: string
  error?: string
}

export class EarningsService {
  /**
   * Add earnings when a token is used
   */
  static async addEarnings(sessionId: string, streamerWallet: string, tokenValue: number): Promise<void> {
    try {
      const streamerShare = tokenValue * REVENUE_SPLIT.STREAMER_PERCENTAGE
      const devcaveShare = tokenValue * REVENUE_SPLIT.DEVCAVE_PERCENTAGE

      console.log(`💰 Adding earnings:`, {
        session: sessionId,
        streamer_wallet: streamerWallet,
        token_value: tokenValue,
        streamer_share: streamerShare,
        devcave_share: devcaveShare,
      })

      // Update or create streamer earnings record
      await sql`
        INSERT INTO streamer_earnings (session_id, streamer_wallet, total_earned, pending_amount)
        VALUES (${sessionId}, ${streamerWallet}, ${streamerShare}, ${streamerShare})
        ON CONFLICT (session_id, streamer_wallet)
        DO UPDATE SET
          total_earned = streamer_earnings.total_earned + ${streamerShare},
          pending_amount = streamer_earnings.pending_amount + ${streamerShare},
          updated_at = NOW()
      `

      // Update session totals
      await sql`
        UPDATE sessions
        SET 
          total_earnings = COALESCE(total_earnings, 0) + ${streamerShare},
          pending_earnings = COALESCE(pending_earnings, 0) + ${streamerShare},
          updated_at = NOW()
        WHERE session_id = ${sessionId}
      `

      console.log(`✅ Earnings added successfully`)
    } catch (error) {
      console.error(`❌ Error adding earnings:`, error)
      throw error
    }
  }

  /**
   * Get earnings for a specific streamer wallet
   */
  static async getStreamerEarnings(streamerWallet: string): Promise<StreamerEarnings[]> {
    try {
      const result = await sql`
        SELECT se.*, s.name as session_name
        FROM streamer_earnings se
        JOIN sessions s ON se.session_id = s.session_id
        WHERE se.streamer_wallet = ${streamerWallet}
        AND se.pending_amount > 0
        ORDER BY se.updated_at DESC
      `
      return result
    } catch (error) {
      console.error(`❌ Error getting streamer earnings:`, error)
      return []
    }
  }

  /**
   * Get total pending earnings for a streamer
   */
  static async getTotalPendingEarnings(streamerWallet: string): Promise<number> {
    try {
      const result = await sql`
        SELECT COALESCE(SUM(pending_amount), 0) as total_pending
        FROM streamer_earnings
        WHERE streamer_wallet = ${streamerWallet}
      `
      return Number(result[0]?.total_pending || 0)
    } catch (error) {
      console.error(`❌ Error getting total pending earnings:`, error)
      return 0
    }
  }

  /**
   * Get earnings for a specific session
   */
  static async getSessionEarnings(sessionId: string): Promise<StreamerEarnings | null> {
    try {
      const result = await sql`
        SELECT * FROM streamer_earnings
        WHERE session_id = ${sessionId}
        ORDER BY updated_at DESC
        LIMIT 1
      `
      return result[0] || null
    } catch (error) {
      console.error(`❌ Error getting session earnings:`, error)
      return null
    }
  }

  /**
   * Process earnings claim
   */
  static async claimEarnings(streamerWallet: string, sessionIds?: string[]): Promise<EarningsClaimResult> {
    try {
      console.log(`💸 Processing earnings claim:`, {
        streamer_wallet: streamerWallet,
        session_ids: sessionIds,
      })

      // Get pending earnings to claim
      let earningsQuery
      if (sessionIds && sessionIds.length > 0) {
        earningsQuery = await sql`
          SELECT * FROM streamer_earnings
          WHERE streamer_wallet = ${streamerWallet}
          AND session_id = ANY(${sessionIds})
          AND pending_amount > 0
        `
      } else {
        earningsQuery = await sql`
          SELECT * FROM streamer_earnings
          WHERE streamer_wallet = ${streamerWallet}
          AND pending_amount > 0
        `
      }

      const earnings = earningsQuery
      if (!earnings || earnings.length === 0) {
        return {
          success: false,
          amount_claimed: 0,
          error: "No pending earnings to claim",
        }
      }

      const totalAmount = earnings.reduce((sum, earning) => sum + Number(earning.pending_amount), 0)

      if (totalAmount <= 0) {
        return {
          success: false,
          amount_claimed: 0,
          error: "No pending earnings to claim",
        }
      }

      console.log(`💰 Total amount to claim: ${totalAmount} SOL`)

      // For now, simulate the transaction (you can implement real Solana transactions later)
      const transactionSignature = `claim_${Date.now()}_${Math.random().toString(36).substring(2)}`

      // Update earnings records to mark as claimed
      for (const earning of earnings) {
        await sql`
          UPDATE streamer_earnings
          SET 
            total_claimed = total_claimed + pending_amount,
            pending_amount = 0,
            last_claim_at = NOW(),
            updated_at = NOW()
          WHERE id = ${earning.id}
        `
      }

      // Update session records
      if (sessionIds && sessionIds.length > 0) {
        for (const sessionId of sessionIds) {
          await sql`
            UPDATE sessions
            SET 
              pending_earnings = 0,
              last_claim_at = NOW(),
              updated_at = NOW()
            WHERE session_id = ${sessionId}
          `
        }
      } else {
        // Update all sessions for this streamer
        await sql`
          UPDATE sessions
          SET 
            pending_earnings = 0,
            last_claim_at = NOW(),
            updated_at = NOW()
          WHERE streamer_wallet = ${streamerWallet}
        `
      }

      console.log(`✅ Earnings claimed successfully:`, {
        amount: totalAmount,
        signature: transactionSignature,
      })

      return {
        success: true,
        amount_claimed: totalAmount,
        transaction_signature: transactionSignature,
      }
    } catch (error) {
      console.error(`❌ Error claiming earnings:`, error)
      return {
        success: false,
        amount_claimed: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Get earnings summary for dashboard
   */
  static async getEarningsSummary(streamerWallet: string): Promise<{
    total_earned: number
    total_claimed: number
    total_pending: number
    session_count: number
    last_claim_at: Date | null
  }> {
    try {
      const result = await sql`
        SELECT 
          COALESCE(SUM(total_earned), 0) as total_earned,
          COALESCE(SUM(total_claimed), 0) as total_claimed,
          COALESCE(SUM(pending_amount), 0) as total_pending,
          COUNT(*) as session_count,
          MAX(last_claim_at) as last_claim_at
        FROM streamer_earnings
        WHERE streamer_wallet = ${streamerWallet}
      `

      return {
        total_earned: Number(result[0]?.total_earned || 0),
        total_claimed: Number(result[0]?.total_claimed || 0),
        total_pending: Number(result[0]?.total_pending || 0),
        session_count: Number(result[0]?.session_count || 0),
        last_claim_at: result[0]?.last_claim_at || null,
      }
    } catch (error) {
      console.error(`❌ Error getting earnings summary:`, error)
      return {
        total_earned: 0,
        total_claimed: 0,
        total_pending: 0,
        session_count: 0,
        last_claim_at: null,
      }
    }
  }
}
