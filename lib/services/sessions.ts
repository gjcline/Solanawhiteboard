import { query } from "../database"

export interface Session {
  id: string
  name: string
  owner_id: string
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
    owner_id: string
    streamer_wallet: string
  }): Promise<Session> {
    const result = await query(
      `INSERT INTO sessions (id, name, owner_id, streamer_wallet)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.id, data.name, data.owner_id, data.streamer_wallet],
    )
    return result.rows[0]
  }

  // Get session by ID
  static async getById(id: string): Promise<Session | null> {
    const result = await query("SELECT * FROM sessions WHERE id = $1 AND is_active = true", [id])
    return result.rows[0] || null
  }

  // Get sessions by owner
  static async getByOwner(owner_id: string): Promise<Session[]> {
    const result = await query("SELECT * FROM sessions WHERE owner_id = $1 ORDER BY created_at DESC", [owner_id])
    return result.rows
  }

  // Update session
  static async update(id: string, data: Partial<Session>): Promise<Session | null> {
    const fields = Object.keys(data)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(", ")
    const values = Object.values(data)

    const result = await query(`UPDATE sessions SET ${fields} WHERE id = $1 RETURNING *`, [id, ...values])
    return result.rows[0] || null
  }

  // Delete session (soft delete)
  static async delete(id: string): Promise<boolean> {
    const result = await query("UPDATE sessions SET is_active = false WHERE id = $1", [id])
    return result.rowCount > 0
  }

  // Get session with stats
  static async getWithStats(id: string): Promise<(Session & SessionStats) | null> {
    const result = await query(
      `SELECT s.*, 
              COALESCE(st.lines_drawn, 0) as lines_drawn,
              COALESCE(st.nukes_used, 0) as nukes_used,
              COALESCE(st.total_tokens_sold, 0) as total_tokens_sold,
              COALESCE(st.unique_participants, 0) as unique_participants
       FROM sessions s
       LEFT JOIN session_stats st ON s.id = st.session_id
       WHERE s.id = $1 AND s.is_active = true`,
      [id],
    )
    return result.rows[0] || null
  }

  // Update canvas data
  static async updateCanvas(id: string, canvas_data: string): Promise<void> {
    await query("UPDATE sessions SET canvas_data = $1, updated_at = NOW() WHERE id = $2", [canvas_data, id])
  }

  // Increment stats
  static async incrementStat(session_id: string, stat: "lines_drawn" | "nukes_used"): Promise<void> {
    await query(
      `INSERT INTO session_stats (session_id, ${stat})
       VALUES ($1, 1)
       ON CONFLICT (session_id)
       DO UPDATE SET ${stat} = session_stats.${stat} + 1`,
      [session_id],
    )
  }
}
