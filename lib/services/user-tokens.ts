import { sql } from "../database"

export interface UserTokens {
  session_id: string
  user_wallet: string
  line_tokens: number
  bundle_tokens: number
  nuke_tokens: number
  last_purchase_type: string
  updated_at: Date
}

export class UserTokenService {
  // Get user tokens for a session
  static async getTokens(sessionId: string, userWallet: string): Promise<UserTokens | null> {
    try {
      const result = await sql`
        SELECT * FROM user_tokens 
        WHERE session_id = ${sessionId} AND user_wallet = ${userWallet}
      `
      return result[0] || null
    } catch (error) {
      console.error("Error getting user tokens:", error)
      return null
    }
  }

  // Add tokens based on purchase type
  static async addTokens(
    sessionId: string,
    userWallet: string,
    purchaseType: "single" | "bundle" | "nuke",
    quantity = 1,
  ): Promise<void> {
    try {
      // Determine which token type to add
      let lineTokens = 0
      let bundleTokens = 0
      let nukeTokens = 0

      switch (purchaseType) {
        case "single":
          lineTokens = quantity
          break
        case "bundle":
          bundleTokens = quantity // This will be 10 for a bundle purchase
          break
        case "nuke":
          nukeTokens = quantity
          break
      }

      await sql`
        INSERT INTO user_tokens (session_id, user_wallet, line_tokens, bundle_tokens, nuke_tokens, last_purchase_type)
        VALUES (${sessionId}, ${userWallet}, ${lineTokens}, ${bundleTokens}, ${nukeTokens}, ${purchaseType})
        ON CONFLICT (session_id, user_wallet)
        DO UPDATE SET
          line_tokens = user_tokens.line_tokens + ${lineTokens},
          bundle_tokens = user_tokens.bundle_tokens + ${bundleTokens},
          nuke_tokens = user_tokens.nuke_tokens + ${nukeTokens},
          last_purchase_type = ${purchaseType},
          updated_at = NOW()
      `
    } catch (error) {
      console.error("Error adding tokens:", error)
      throw error
    }
  }

  // Use a token (prioritize bundle tokens for line drawing)
  static async useToken(
    sessionId: string,
    userWallet: string,
    tokenType: "line" | "nuke",
  ): Promise<{ success: boolean; tokenUsed: "single" | "bundle" | "nuke" | null }> {
    try {
      const tokens = await this.getTokens(sessionId, userWallet)
      if (!tokens) {
        return { success: false, tokenUsed: null }
      }

      if (tokenType === "line") {
        // Prioritize bundle tokens first (cheaper payout)
        if (tokens.bundle_tokens > 0) {
          await sql`
            UPDATE user_tokens 
            SET bundle_tokens = bundle_tokens - 1, updated_at = NOW()
            WHERE session_id = ${sessionId} AND user_wallet = ${userWallet}
          `
          return { success: true, tokenUsed: "bundle" }
        } else if (tokens.line_tokens > 0) {
          await sql`
            UPDATE user_tokens 
            SET line_tokens = line_tokens - 1, updated_at = NOW()
            WHERE session_id = ${sessionId} AND user_wallet = ${userWallet}
          `
          return { success: true, tokenUsed: "single" }
        }
      } else if (tokenType === "nuke") {
        if (tokens.nuke_tokens > 0) {
          await sql`
            UPDATE user_tokens 
            SET nuke_tokens = nuke_tokens - 1, updated_at = NOW()
            WHERE session_id = ${sessionId} AND user_wallet = ${userWallet}
          `
          return { success: true, tokenUsed: "nuke" }
        }
      }

      return { success: false, tokenUsed: null }
    } catch (error) {
      console.error("Error using token:", error)
      return { success: false, tokenUsed: null }
    }
  }

  // Get total available line tokens (single + bundle)
  static async getTotalLineTokens(sessionId: string, userWallet: string): Promise<number> {
    const tokens = await this.getTokens(sessionId, userWallet)
    if (!tokens) return 0
    return tokens.line_tokens + tokens.bundle_tokens
  }
}
