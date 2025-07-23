const express = require("express")
const { query } = require("../config/database")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get today's sessions for age group
router.get("/today/:ageGroup", authenticateToken, async (req, res) => {
  try {
    const { ageGroup } = req.params

    // Verify coach has access to this age group
    if (req.user.ageGroup !== ageGroup) {
      return res.status(403).json({ error: "Access denied to this age group" })
    }

    const today = new Date().toISOString().split("T")[0]

    const result = await query(
      `SELECT id, date, time_slot, age_group, coach_id, status, group_photo_path, created_at
       FROM sessions 
       WHERE date = $1 AND age_group = $2
       ORDER BY time_slot ASC`,
      [today, ageGroup],
    )

    // If no sessions exist for today, create them
    if (result.rows.length === 0) {
      const morningSession = await query(
        `INSERT INTO sessions (date, time_slot, age_group, coach_id)
         VALUES ($1, 'morning', $2, $3)
         RETURNING *`,
        [today, ageGroup, req.user.id],
      )

      const eveningSession = await query(
        `INSERT INTO sessions (date, time_slot, age_group, coach_id)
         VALUES ($1, 'evening', $2, $3)
         RETURNING *`,
        [today, ageGroup, req.user.id],
      )

      return res.json([morningSession.rows[0], eveningSession.rows[0]])
    }

    res.json(result.rows)
  } catch (error) {
    console.error("Get today sessions error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Create session
router.post("/create", authenticateToken, async (req, res) => {
  try {
    const { date, timeSlot, ageGroup } = req.body

    // Verify coach has access to this age group
    if (req.user.ageGroup !== ageGroup) {
      return res.status(403).json({ error: "Access denied to this age group" })
    }

    if (!date || !timeSlot || !ageGroup) {
      return res.status(400).json({ error: "Date, time slot, and age group are required" })
    }

    const result = await query(
      `INSERT INTO sessions (date, time_slot, age_group, coach_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [date, timeSlot, ageGroup, req.user.id],
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    if (error.code === "23505") {
      // Unique constraint violation
      return res.status(409).json({ error: "Session already exists for this date and time slot" })
    }
    console.error("Create session error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get session attendance
router.get("/:id/attendance", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Verify session belongs to coach's age group
    const sessionCheck = await query("SELECT age_group FROM sessions WHERE id = $1", [id])

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" })
    }

    if (sessionCheck.rows[0].age_group !== req.user.ageGroup) {
      return res.status(403).json({ error: "Access denied to this session" })
    }

    const result = await query(
      `SELECT a.id, a.session_id, a.player_id, a.status, a.notes, a.created_at,
              p.name as player_name
       FROM attendance a
       JOIN players p ON a.player_id = p.id
       WHERE a.session_id = $1
       ORDER BY p.name ASC`,
      [id],
    )

    res.json(result.rows)
  } catch (error) {
    console.error("Get session attendance error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get sessions history
router.get("/history/:ageGroup", authenticateToken, async (req, res) => {
  try {
    const { ageGroup } = req.params
    const { limit = 50, offset = 0 } = req.query

    // Verify coach has access to this age group
    if (req.user.ageGroup !== ageGroup) {
      return res.status(403).json({ error: "Access denied to this age group" })
    }

    const result = await query(
      `SELECT id, date, time_slot, age_group, coach_id, status, group_photo_path, created_at
       FROM sessions 
       WHERE age_group = $1
       ORDER BY date DESC, time_slot DESC
       LIMIT $2 OFFSET $3`,
      [ageGroup, limit, offset],
    )

    res.json(result.rows)
  } catch (error) {
    console.error("Get sessions history error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
