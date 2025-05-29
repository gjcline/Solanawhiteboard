import { sql } from "@/lib/database"

export interface UserTokens {
  line_tokens: number
  bundle_tokens: number
  nuke_tokens: number
}

export class UserTokenService {
  static async getTokens(sessionId: string, userWallet: string): Promise<UserTokens | null> {
    try {
      console.log("🔍 Getting tokens for:", { sessionId, userWallet })

      const result = await sql`
        SELECT line_tokens, bundle_tokens, nuke_tokens 
        FROM user_tokens 
        WHERE session_id = ${sessionId} AND user_wallet = ${userWallet}
      `

      if (!Array.isArray(result) || result.length === 0) {
        console.log("📊 No tokens found, returning defaults")
        return {
          line_tokens: 0,
          bundle_tokens: 0,
          nuke_tokens: 0,
        }
      }

      const tokens = result[0]
      console.log("📊 Found tokens:", tokens)
      return tokens
    } catch (error) {
      console.error("❌ Error getting tokens:", error)
      return null
    }
  }

  static async addTokens(
    sessionId: string,
    userWallet: string,
    tokenType: string,
    quantity: number,
  ): Promise<UserTokens | null> {
    try {
      console.log("💰 Adding tokens:", { sessionId, userWallet, tokenType, quantity })

      // Determine which column to update based on token type
      let columnToUpdate = "line_tokens"
      if (tokenType === "bundle") {
        columnToUpdate = "bundle_tokens"
      } else if (tokenType === "nuke") {
        columnToUpdate = "nuke_tokens"
      }

      // Insert or update tokens using tagged template literal
      if (columnToUpdate === "line_tokens") {
        await sql`
          INSERT INTO user_tokens (session_id, user_wallet, line_tokens) 
          VALUES (${sessionId}, ${userWallet}, ${quantity})
          ON CONFLICT (session_id, user_wallet) 
          DO UPDATE SET line_tokens = user_tokens.line_tokens + ${quantity}
        `
      } else if (columnToUpdate === "bundle_tokens") {
        await sql`
          INSERT INTO user_tokens (session_id, user_wallet, bundle_tokens) 
          VALUES (${sessionId}, ${userWallet}, ${quantity})
          ON CONFLICT (session_id, user_wallet) 
          DO UPDATE SET bundle_tokens = user_tokens.bundle_tokens + ${quantity}
        `
      } else if (columnToUpdate === "nuke_tokens") {
        await sql`
          INSERT INTO user_tokens (session_id, user_wallet, nuke_tokens) 
          VALUES (${sessionId}, ${userWallet}, ${quantity})
          ON CONFLICT (session_id, user_wallet) 
          DO UPDATE SET nuke_tokens = user_tokens.nuke_tokens + ${quantity}
        `
      }

      console.log("✅ Tokens added successfully")

      // Return updated tokens
      return await this.getTokens(sessionId, userWallet)
    } catch (error) {
      console.error("❌ Error adding tokens:", error)
      return null
    }
  }

  static async useToken(
    sessionId: string,
    userWallet: string,
    tokenType: "line" | "nuke",
  ): Promise<{ success: boolean; tokenUsed?: string }> {
    try {
      console.log("🎯 Using token:", { sessionId, userWallet, tokenType })

      // For line tokens, we can use either line_tokens or bundle_tokens
      if (tokenType === "line") {
        // Try to use bundle_tokens first, then line_tokens
        const bundleResult = await sql`
          UPDATE user_tokens 
          SET bundle_tokens = bundle_tokens - 1 
          WHERE session_id = ${sessionId} AND user_wallet = ${userWallet} AND bundle_tokens > 0
          RETURNING bundle_tokens
        `

        if (Array.isArray(bundleResult) && bundleResult.length > 0) {
          console.log("✅ Used bundle token")
          return { success: true, tokenUsed: "bundle" }
        }

        // If no bundle tokens, try line tokens
        const lineResult = await sql`
          UPDATE user_tokens 
          SET line_tokens = line_tokens - 1 
          WHERE session_id = ${sessionId} AND user_wallet = ${userWallet} AND line_tokens > 0
          RETURNING line_tokens
        `

        if (Array.isArray(lineResult) && lineResult.length > 0) {
          console.log("✅ Used line token")
          return { success: true, tokenUsed: "line" }
        }
      } else if (tokenType === "nuke") {
        const result = await sql`
          UPDATE user_tokens 
          SET nuke_tokens = nuke_tokens - 1 
          WHERE session_id = ${sessionId} AND user_wallet = ${userWallet} AND nuke_tokens > 0
          RETURNING nuke_tokens
        `

        if (Array.isArray(result) && result.length > 0) {
          console.log("✅ Used nuke token")
          return { success: true, tokenUsed: "nuke" }
        }
      }

      console.log("❌ No tokens available to use")
      return { success: false }
    } catch (error) {
      console.error("❌ Error using token:", error)
      return { success: false }
    }
  }
}
