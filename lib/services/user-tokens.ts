import { query } from "../database"

export interface UserTokens {
  session_id: string
  user_wallet: string
  line_tokens: number
  nuke_tokens: number
  updated_at: Date
}

export class UserTokenService {
  // Get user tokens for a session
  static async getTokens(session_id: string, user_wallet: string): Promise<UserTokens | null> {
    const result = await query("SELECT * FROM user_tokens WHERE session_id = $1 AND user_wallet = $2", [
      session_id,
      user_wallet,
    ])
    return result.rows[0] || null
  }

  // Add tokens to user
  static async addTokens(
    session_id: string,
    user_wallet: string,
    line_tokens = 0,
    nuke_tokens = 0,
  ): Promise<UserTokens> {
    const result = await query(
      `INSERT INTO user_tokens (session_id, user_wallet, line_tokens, nuke_tokens)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (session_id, user_wallet)
       DO UPDATE SET 
         line_tokens = user_tokens.line_tokens + $3,
         nuke_tokens = user_tokens.nuke_tokens + $4,
         updated_at = NOW()
       RETURNING *`,
      [session_id, user_wallet, line_tokens, nuke_tokens],
    )
    return result.rows[0]
  }

  // Use a token
  static async useToken(
    session_id: string,
    user_wallet: string,
    token_type: "line" | "nuke",
  ): Promise<UserTokens | null> {
    const column = token_type === "line" ? "line_tokens" : "nuke_tokens"

    const result = await query(
      `UPDATE user_tokens 
       SET ${column} = ${column} - 1, updated_at = NOW()
       WHERE session_id = $1 AND user_wallet = $2 AND ${column} > 0
       RETURNING *`,
      [session_id, user_wallet],
    )
    return result.rows[0] || null
  }
}
