import { sql } from "@/lib/database"

export class SessionService {
  /**
   * Get a session by ID
   */
  static async getSession(sessionId: string) {
    try {
      console.log(`[SessionService] Getting session: ${sessionId}`)
      const result = await sql`
        SELECT * FROM sessions WHERE session_id = ${sessionId}
      `
      return result[0] || null
    } catch (error) {
      console.error(`[SessionService] Error getting session:`, error)
      return null
    }
  }

  /**
   * Check if a session exists and is active
   */
  static async isSessionActive(sessionId: string): Promise<boolean> {
    try {
      console.log(`[SessionService] Checking if session is active: ${sessionId}`)
      const result = await sql`
        SELECT is_active FROM sessions WHERE session_id = ${sessionId}
      `
      return result.length > 0 && result[0].is_active === true
    } catch (error) {
      console.error(`[SessionService] Error checking session status:`, error)
      return false
    }
  }

  /**
   * Get canvas data for a session
   */
  static async getCanvasData(sessionId: string): Promise<string | null> {
    try {
      console.log(`[SessionService] Getting canvas data for session: ${sessionId}`)
      const result = await sql`
        SELECT canvas_data FROM sessions WHERE session_id = ${sessionId} AND is_active = true
      `
      return result[0]?.canvas_data || null
    } catch (error) {
      console.error(`[SessionService] Error getting canvas data:`, error)
      return null
    }
  }

  /**
   * Save canvas data for a session
   */
  static async saveCanvasData(sessionId: string, canvasData: string): Promise<boolean> {
    try {
      console.log(`[SessionService] Saving canvas data for session: ${sessionId}`)
      const result = await sql`
        UPDATE sessions 
        SET canvas_data = ${canvasData}, updated_at = NOW()
        WHERE session_id = ${sessionId} AND is_active = true
        RETURNING session_id
      `
      return result.length > 0
    } catch (error) {
      console.error(`[SessionService] Error saving canvas data:`, error)
      return false
    }
  }

  /**
   * Create a new session
   */
  static async createSession(sessionId: string, name: string, streamerWallet: string): Promise<boolean> {
    try {
      console.log(`[SessionService] Creating new session: ${sessionId}`)
      const result = await sql`
        INSERT INTO sessions (session_id, name, streamer_wallet, is_active, created_at, updated_at)
        VALUES (${sessionId}, ${name}, ${streamerWallet}, true, NOW(), NOW())
        ON CONFLICT (session_id) DO UPDATE
        SET name = ${name}, streamer_wallet = ${streamerWallet}, is_active = true, updated_at = NOW()
        RETURNING session_id
      `
      return result.length > 0
    } catch (error) {
      console.error(`[SessionService] Error creating session:`, error)
      return false
    }
  }

  /**
   * Deactivate a session
   */
  static async deactivateSession(sessionId: string): Promise<boolean> {
    try {
      console.log(`[SessionService] Deactivating session: ${sessionId}`)
      const result = await sql`
        UPDATE sessions
        SET is_active = false, updated_at = NOW()
        WHERE session_id = ${sessionId}
        RETURNING session_id
      `
      return result.length > 0
    } catch (error) {
      console.error(`[SessionService] Error deactivating session:`, error)
      return false
    }
  }
}
