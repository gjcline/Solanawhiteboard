import { sql } from "../database"

export interface Session {
  id: string
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
    const result = await sql`
      INSERT INTO sessions (id, name, owner_id, streamer_wallet)
      VALUES (${data.id}, ${data.name}, ${data.owner_id}, ${data.streamer_wallet})
      RETURNING *
    `
    console.log("Session created:", result[0])
    return result[0]
  }

  // Get session by ID
  static async getById(id: string): Promise<Session | null> {
    const result = await sql`
      SELECT * FROM sessions 
      WHERE id = ${id} AND is_active = true
    `
    return result[0] || null
  }

  // Get sessions by owner
  static async getByOwner(owner_id: number): Promise<Session[]> {
    console.log("Fetching sessions for owner_id:", owner_id)
    const result = await sql`
      SELECT * FROM sessions 
      WHERE owner_id = ${owner_id} 
      ORDER BY created_at DESC
    `
    console.log("Found sessions:", result.length)
    return result
  }

  // Update session
  static async update(id: string, data: Partial<Session>): Promise<Session | null> {
    // For updates, we'll handle each field individually to avoid SQL injection
    const { name, canvas_data, is_active, total_earnings, viewer_count } = data

    if (name !== undefined) {
      const result = await sql`
        UPDATE sessions 
        SET name = ${name}, updated_at = NOW() 
        WHERE id = ${id} 
        RETURNING *
      `
      return result[0] || null
    }

    if (canvas_data !== undefined) {
      const result = await sql`
        UPDATE sessions 
        SET canvas_data = ${canvas_data}, updated_at = NOW() 
        WHERE id = ${id} 
        RETURNING *
      `
      return result[0] || null
    }

    return null
  }

  // Delete session (soft delete)
  static async delete(id: string): Promise<boolean> {
    const result = await sql`
      UPDATE sessions 
      SET is_active = false 
      WHERE id = ${id}
    `
    return result.length > 0
  }

  // Get session with stats
  static async getWithStats(id: string): Promise<(Session & SessionStats) | null> {
    const result = await sql`
      SELECT s.*, 
             COALESCE(st.lines_drawn, 0) as lines_drawn,
             COALESCE(st.nukes_used, 0) as nukes_used,
             COALESCE(st.total_tokens_sold, 0) as total_tokens_sold,
             COALESCE(st.unique_participants, 0) as unique_participants
      FROM sessions s
      LEFT JOIN session_stats st ON s.id = st.session_id
      WHERE s.id = ${id} AND s.is_active = true
    `
    return result[0] || null
  }

  // Update canvas data
  static async updateCanvas(id: string, canvas_data: string): Promise<void> {
    await sql`
      UPDATE sessions 
      SET canvas_data = ${canvas_data}, updated_at = NOW() 
      WHERE id = ${id}
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
}
