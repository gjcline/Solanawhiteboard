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

      // First check if the record exists
      const existingRecord = await sql`
        SELECT * FROM user_tokens 
        WHERE session_id = ${sessionId} AND user_wallet = ${userWallet}
      `

      // Determine which column to update based on token type
      let lineTokens = 0
      let bundleTokens = 0
      let nukeTokens = 0

      if (tokenType === "line" || tokenType === "single") {
        lineTokens = quantity
      } else if (tokenType === "bundle") {
        bundleTokens = quantity
      } else if (tokenType === "nuke") {
        nukeTokens = quantity
      }

      if (Array.isArray(existingRecord) && existingRecord.length > 0) {
        // Record exists, update it
        console.log("📝 Updating existing token record")

        if (tokenType === "line" || tokenType === "single") {
          await sql`
            UPDATE user_tokens 
            SET line_tokens = line_tokens + ${quantity}
            WHERE session_id = ${sessionId} AND user_wallet = ${userWallet}
          `
        } else if (tokenType === "bundle") {
          await sql`
            UPDATE user_tokens 
            SET bundle_tokens = bundle_tokens + ${quantity}
            WHERE session_id = ${sessionId} AND user_wallet = ${userWallet}
          `
        } else if (tokenType === "nuke") {
          await sql`
            UPDATE user_tokens 
            SET nuke_tokens = nuke_tokens + ${quantity}
            WHERE session_id = ${sessionId} AND user_wallet = ${userWallet}
          `
        }
      } else {
        // Record doesn't exist, insert it
        console.log("📝 Creating new token record")
        await sql`
          INSERT INTO user_tokens (
            session_id, 
            user_wallet, 
            line_tokens, 
            bundle_tokens, 
            nuke_tokens
          ) 
          VALUES (
            ${sessionId}, 
            ${userWallet}, 
            ${lineTokens}, 
            ${bundleTokens}, 
            ${nukeTokens}
          )
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

      // Get current tokens
      const currentTokens = await this.getTokens(sessionId, userWallet)
      if (!currentTokens) {
        console.log("❌ No tokens record found")
        return { success: false }
      }

      // For line tokens, we can use either line_tokens or bundle_tokens
      if (tokenType === "line") {
        // Try to use bundle_tokens first, then line_tokens
        if (currentTokens.bundle_tokens > 0) {
          await sql`
            UPDATE user_tokens 
            SET bundle_tokens = bundle_tokens - 1
            WHERE session_id = ${sessionId} AND user_wallet = ${userWallet}
          `
          console.log("✅ Used bundle token")
          return { success: true, tokenUsed: "bundle" }
        }

        // If no bundle tokens, try line tokens
        if (currentTokens.line_tokens > 0) {
          await sql`
            UPDATE user_tokens 
            SET line_tokens = line_tokens - 1
            WHERE session_id = ${sessionId} AND user_wallet = ${userWallet}
          `
          console.log("✅ Used line token")
          return { success: true, tokenUsed: "line" }
        }
      } else if (tokenType === "nuke") {
        if (currentTokens.nuke_tokens > 0) {
          await sql`
            UPDATE user_tokens 
            SET nuke_tokens = nuke_tokens - 1
            WHERE session_id = ${sessionId} AND user_wallet = ${userWallet}
          `
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
