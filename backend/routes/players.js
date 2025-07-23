const express = require("express")
const { query } = require("../config/database")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Get players by age group
router.get("/:ageGroup", authenticateToken, async (req, res) => {
  try {
    const { ageGroup } = req.params

    // Verify coach has access to this age group
    if (req.user.ageGroup !== ageGroup) {
      return res.status(403).json({ error: "Access denied to this age group" })
    }

    const result = await query(
      `SELECT id, name, age_group, booked_sessions, used_sessions, 
              complimentary_sessions, max_complimentary, training_completed,
              join_date, notes, created_at, updated_at
       FROM players 
       WHERE age_group = $1 
       ORDER BY name ASC`,
      [ageGroup],
    )

    res.json(result.rows)
  } catch (error) {
    console.error("Get players error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Create new player
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      name,
      ageGroup,
      bookedSessions = 12,
      usedSessions = 0,
      complimentarySessions = 0,
      maxComplimentary = 3,
      trainingCompleted = 0,
      joinDate,
      notes = "",
    } = req.body

    // Verify coach has access to this age group
    if (req.user.ageGroup !== ageGroup) {
      return res.status(403).json({ error: "Access denied to this age group" })
    }

    if (!name || !joinDate) {
      return res.status(400).json({ error: "Name and join date are required" })
    }

    const result = await query(
      `INSERT INTO players (name, age_group, booked_sessions, used_sessions, 
                           complimentary_sessions, max_complimentary, training_completed,
                           join_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name,
        ageGroup,
        bookedSessions,
        usedSessions,
        complimentarySessions,
        maxComplimentary,
        trainingCompleted,
        joinDate,
        notes,
      ],
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("Create player error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Update player
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      ageGroup,
      bookedSessions,
      usedSessions,
      complimentarySessions,
      maxComplimentary,
      trainingCompleted,
      joinDate,
      notes,
    } = req.body

    // Verify coach has access to this age group
    if (req.user.ageGroup !== ageGroup) {
      return res.status(403).json({ error: "Access denied to this age group" })
    }

    // Check if player exists and belongs to coach's age group
    const existingPlayer = await query("SELECT age_group FROM players WHERE id = $1", [id])

    if (existingPlayer.rows.length === 0) {
      return res.status(404).json({ error: "Player not found" })
    }

    if (existingPlayer.rows[0].age_group !== req.user.ageGroup) {
      return res.status(403).json({ error: "Access denied to this player" })
    }

    const result = await query(
      `UPDATE players 
       SET name = $1, age_group = $2, booked_sessions = $3, used_sessions = $4,
           complimentary_sessions = $5, max_complimentary = $6, training_completed = $7,
           join_date = $8, notes = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [
        name,
        ageGroup,
        bookedSessions,
        usedSessions,
        complimentarySessions,
        maxComplimentary,
        trainingCompleted,
        joinDate,
        notes,
        id,
      ],
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Player not found" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Update player error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Delete player
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    // Check if player exists and belongs to coach's age group
    const existingPlayer = await query("SELECT age_group FROM players WHERE id = $1", [id])

    if (existingPlayer.rows.length === 0) {
      return res.status(404).json({ error: "Player not found" })
    }

    if (existingPlayer.rows[0].age_group !== req.user.ageGroup) {
      return res.status(403).json({ error: "Access denied to this player" })
    }

    // Delete player (attendance records will be deleted due to CASCADE)
    await query("DELETE FROM players WHERE id = $1", [id])

    res.json({ message: "Player deleted successfully" })
  } catch (error) {
    console.error("Delete player error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
