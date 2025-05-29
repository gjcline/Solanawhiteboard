import { sql } from "@vercel/postgres"

export interface Session {
  id: string
  session_id: string
  name: string
  owner_id: number
  streamer_wallet: string
  is_active: boolean
  canvas_data?: string
  total_earnings: number
  viewer_count: number
  created_at: Date
  updated_at: Date
}

export interface SessionStats {
  lines_drawn: number
  nukes_used: number
  total_tokens_sold: number
  unique_participants: number
}

export class SessionService {
  // Create a new session
  static async create(data: {
    id: string
    name: string
    owner_id: number
    streamer_wallet: string
  }): Promise<Session> {
    console.log("Creating session with data:", data)
    console.log("Data types:", {
      id: typeof data.id,
      name: typeof data.name,
      owner_id: typeof data.owner_id,
      streamer_wallet: typeof data.streamer_wallet,
    })

    const result = await sql`
      INSERT INTO sessions (session_id, name, owner_id, streamer_wallet, is_active, total_earnings, viewer_count)
      VALUES (${data.id}, ${data.name}, ${data.owner_id}, ${data.streamer_wallet}, true, 0, 0)
      RETURNING *
    `
    console.log("Session created:", result[0])
    return result[0]
  }

  // Get session by ID (only active sessions by default)
  static async getById(sessionId: string, includeInactive = false): Promise<Session | null> {
    console.log("Getting session by ID:", sessionId, "includeInactive:", includeInactive)

    const result = includeInactive
      ? await sql`
          SELECT * FROM sessions 
          WHERE session_id = ${sessionId}
        `
      : await sql`
          SELECT * FROM sessions 
          WHERE session_id = ${sessionId} AND is_active = true
        `

    console.log("Session query result:", result[0] || "Not found")
    return result[0] || null
  }

  // Get sessions by owner (only active sessions by default)
  static async getByOwner(owner_id: number, includeInactive = false): Promise<Session[]> {
    console.log("Fetching sessions for owner_id:", owner_id, "includeInactive:", includeInactive)

    const result = includeInactive
      ? await sql`
          SELECT s.*, 
                 COALESCE(st.lines_drawn, 0) as lines_drawn,
                 COALESCE(st.nukes_used, 0) as nukes_used,
                 COALESCE(st.total_tokens_sold, 0) as total_tokens_sold,
                 COALESCE(st.unique_participants, 0) as unique_participants
          FROM sessions s
          LEFT JOIN session_stats st ON s.session_id = st.session_id
          WHERE s.owner_id = ${owner_id} 
          ORDER BY s.created_at DESC
        `
      : await sql`
          SELECT s.*, 
                 COALESCE(st.lines_drawn, 0) as lines_drawn,
                 COALESCE(st.nukes_used, 0) as nukes_used,
                 COALESCE(st.total_tokens_sold, 0) as total_tokens_sold,
                 COALESCE(st.unique_participants, 0) as unique_participants
          FROM sessions s
          LEFT JOIN session_stats st ON s.session_id = st.session_id
          WHERE s.owner_id = ${owner_id} AND s.is_active = true
          ORDER BY s.created_at DESC
        `

    console.log("Found sessions:", result.length)
    return result
  }

  // Update session
  static async update(sessionId: string, data: Partial<Session>): Promise<Session | null> {
    console.log("Updating session:", sessionId, "with data:", data)

    try {
      // Handle different update fields
      if (data.name !== undefined) {
        const result = await sql`
          UPDATE sessions 
          SET name = ${data.name}, updated_at = NOW() 
          WHERE session_id = ${sessionId} 
          RETURNING *
        `
        return result[0] || null
      }

      if (data.streamer_wallet !== undefined) {
        console.log("Updating streamer wallet for session:", sessionId, "to:", data.streamer_wallet)
        const result = await sql`
          UPDATE sessions 
          SET streamer_wallet = ${data.streamer_wallet}, updated_at = NOW() 
          WHERE session_id = ${sessionId} 
          RETURNING *
        `
        console.log("Wallet update result:", result[0] || "No result")
        return result[0] || null
      }

      if (data.canvas_data !== undefined) {
        const result = await sql`
          UPDATE sessions 
          SET canvas_data = ${data.canvas_data}, updated_at = NOW() 
          WHERE session_id = ${sessionId} 
          RETURNING *
        `
        return result[0] || null
      }

      if (data.total_earnings !== undefined) {
        const result = await sql`
          UPDATE sessions 
          SET total_earnings = ${data.total_earnings}, updated_at = NOW() 
          WHERE session_id = ${sessionId} 
          RETURNING *
        `
        return result[0] || null
      }

      if (data.viewer_count !== undefined) {
        const result = await sql`
          UPDATE sessions 
          SET viewer_count = ${data.viewer_count}, updated_at = NOW() 
          WHERE session_id = ${sessionId} 
          RETURNING *
        `
        return result[0] || null
      }

      if (data.is_active !== undefined) {
        console.log("Updating session active status:", sessionId, "to:", data.is_active)
        const result = await sql`
          UPDATE sessions 
          SET is_active = ${data.is_active}, updated_at = NOW() 
          WHERE session_id = ${sessionId} 
          RETURNING *
        `
        return result[0] || null
      }

      return null
    } catch (error) {
      console.error("Error updating session:", error)
      throw error
    }
  }

  // Deactivate session (soft delete)
  static async delete(sessionId: string): Promise<boolean> {
    console.log("Soft deleting (deactivating) session:", sessionId)
    const result = await sql`
      UPDATE sessions 
      SET is_active = false, updated_at = NOW()
      WHERE session_id = ${sessionId}
    `
    return result.length > 0
  }

  // Permanently delete session (hard delete)
  static async permanentDelete(sessionId: string): Promise<boolean> {
    console.log("Permanently deleting session:", sessionId)

    // First delete related records
    await sql`DELETE FROM session_stats WHERE session_id = ${sessionId}`
    await sql`DELETE FROM user_tokens WHERE session_id = ${sessionId}`

    // Then delete the session
    const result = await sql`
      DELETE FROM sessions 
      WHERE session_id = ${sessionId}
    `
    return result.length > 0
  }

  // Reactivate session
  static async reactivate(sessionId: string): Promise<Session | null> {
    console.log("Reactivating session:", sessionId)
    const result = await sql`
      UPDATE sessions 
      SET is_active = true, updated_at = NOW()
      WHERE session_id = ${sessionId}
      RETURNING *
    `
    return result[0] || null
  }

  // Get session with stats (only active sessions by default)
  static async getWithStats(sessionId: string, includeInactive = false): Promise<(Session & SessionStats) | null> {
    console.log("Getting session with stats:", sessionId, "includeInactive:", includeInactive)

    const result = includeInactive
      ? await sql`
          SELECT s.*, 
                 COALESCE(st.lines_drawn, 0) as lines_drawn,
                 COALESCE(st.nukes_used, 0) as nukes_used,
                 COALESCE(st.total_tokens_sold, 0) as total_tokens_sold,
                 COALESCE(st.unique_participants, 0) as unique_participants
          FROM sessions s
          LEFT JOIN session_stats st ON s.session_id = st.session_id
          WHERE s.session_id = ${sessionId}
        `
      : await sql`
          SELECT s.*, 
                 COALESCE(st.lines_drawn, 0) as lines_drawn,
                 COALESCE(st.nukes_used, 0) as nukes_used,
                 COALESCE(st.total_tokens_sold, 0) as total_tokens_sold,
                 COALESCE(st.unique_participants, 0) as unique_participants
          FROM sessions s
          LEFT JOIN session_stats st ON s.session_id = st.session_id
          WHERE s.session_id = ${sessionId} AND s.is_active = true
        `

    console.log("Session with stats result:", result[0] || "Not found")
    return result[0] || null
  }

  // Update canvas data
  static async updateCanvas(sessionId: string, canvas_data: string): Promise<void> {
    await sql`
      UPDATE sessions 
      SET canvas_data = ${canvas_data}, updated_at = NOW() 
      WHERE session_id = ${sessionId} AND is_active = true
    `
  }

  // Increment stats
  static async incrementStat(session_id: string, stat: "lines_drawn" | "nukes_used"): Promise<void> {
    if (stat === "lines_drawn") {
      await sql`
        INSERT INTO session_stats (session_id, lines_drawn)
        VALUES (${session_id}, 1)
        ON CONFLICT (session_id)
        DO UPDATE SET lines_drawn = session_stats.lines_drawn + 1
      `
    } else if (stat === "nukes_used") {
      await sql`
        INSERT INTO session_stats (session_id, nukes_used)
        VALUES (${session_id}, 1)
        ON CONFLICT (session_id)
        DO UPDATE SET nukes_used = session_stats.nukes_used + 1
      `
    }
  }

  static async createSession(data: {
    name: string
    streamerWallet: string
    userId?: string
  }) {
    try {
      const sessionId = Math.random().toString(36).substring(2, 15)

      const result = await sql`
        INSERT INTO sessions (id, name, streamer_wallet, user_id, is_active, created_at)
        VALUES (${sessionId}, ${data.name}, ${data.streamerWallet}, ${data.userId}, true, NOW())
        RETURNING *
      `

      return result.rows[0]
    } catch (error) {
      console.error("Error creating session:", error)
      throw error
    }
  }

  static async getSession(sessionId: string) {
    try {
      const result = await sql`
        SELECT * FROM sessions 
        WHERE id = ${sessionId} AND is_active = true
      `

      return result.rows[0] || null
    } catch (error) {
      console.error("Error getting session:", error)
      return null
    }
  }

  static async saveCanvasData(sessionId: string, canvasData: string) {
    try {
      await sql`
        UPDATE sessions 
        SET canvas_data = ${canvasData}, updated_at = NOW()
        WHERE id = ${sessionId}
      `
      return true
    } catch (error) {
      console.error("Error saving canvas data:", error)
      return false
    }
  }

  static async getCanvasData(sessionId: string) {
    try {
      const result = await sql`
        SELECT canvas_data FROM sessions 
        WHERE id = ${sessionId}
      `

      return result.rows[0]?.canvas_data || null
    } catch (error) {
      console.error("Error getting canvas data:", error)
      return null
    }
  }
}
