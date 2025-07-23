const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { query } = require("../config/database")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Configure multer for photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/session-photos")
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, `session-${uniqueSuffix}${path.extname(file.originalname)}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error("Only image files are allowed"))
    }
  },
})

// Mark attendance for multiple players
router.post("/mark", authenticateToken, async (req, res) => {
  try {
    const { sessionId, attendanceRecords } = req.body

    if (!sessionId || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ error: "Session ID and attendance records are required" })
    }

    // Verify session belongs to coach's age group
    const sessionCheck = await query("SELECT age_group FROM sessions WHERE id = $1", [sessionId])

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" })
    }

    if (sessionCheck.rows[0].age_group !== req.user.ageGroup) {
      return res.status(403).json({ error: "Access denied to this session" })
    }

    // Begin transaction
    await query("BEGIN")

    try {
      const results = []

      for (const record of attendanceRecords) {
        const { playerId, status, notes = "" } = record

        // Insert or update attendance record
        const result = await query(
          `INSERT INTO attendance (session_id, player_id, status, notes)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (session_id, player_id)
           DO UPDATE SET status = $3, notes = $4, created_at = NOW()
           RETURNING *`,
          [sessionId, playerId, status, notes],
        )

        // Update player session counts
        if (status === "present_regular") {
          await query("UPDATE players SET used_sessions = used_sessions + 1 WHERE id = $1", [playerId])
        } else if (status === "present_complimentary") {
          await query("UPDATE players SET complimentary_sessions = complimentary_sessions + 1 WHERE id = $1", [
            playerId,
          ])
        }

        results.push(result.rows[0])
      }

      // Mark session as completed
      await query("UPDATE sessions SET status = $1, updated_at = NOW() WHERE id = $2", ["completed", sessionId])

      await query("COMMIT")
      res.json(results)
    } catch (error) {
      await query("ROLLBACK")
      throw error
    }
  } catch (error) {
    console.error("Mark attendance error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Upload session photo
router.post("/photo/:sessionId", authenticateToken, upload.single("photo"), async (req, res) => {
  try {
    const { sessionId } = req.params

    if (!req.file) {
      return res.status(400).json({ error: "No photo uploaded" })
    }

    // Verify session belongs to coach's age group
    const sessionCheck = await query("SELECT age_group FROM sessions WHERE id = $1", [sessionId])

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" })
    }

    if (sessionCheck.rows[0].age_group !== req.user.ageGroup) {
      return res.status(403).json({ error: "Access denied to this session" })
    }

    // Update session with photo path
    const photoPath = `/uploads/session-photos/${req.file.filename}`
    await query("UPDATE sessions SET group_photo_path = $1, updated_at = NOW() WHERE id = $2", [photoPath, sessionId])

    res.json({
      message: "Photo uploaded successfully",
      photoPath,
    })
  } catch (error) {
    console.error("Upload photo error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get attendance history for age group
router.get("/history/:ageGroup", authenticateToken, async (req, res) => {
  try {
    const { ageGroup } = req.params
    const { limit = 100, offset = 0, playerId, startDate, endDate } = req.query

    // Verify coach has access to this age group
    if (req.user.ageGroup !== ageGroup) {
      return res.status(403).json({ error: "Access denied to this age group" })
    }

    let queryText = `
      SELECT a.id, a.session_id, a.player_id, a.status, a.notes, a.created_at,
             p.name as player_name,
             s.date as session_date, s.time_slot, s.group_photo_path
      FROM attendance a
      JOIN players p ON a.player_id = p.id
      JOIN sessions s ON a.session_id = s.id
      WHERE s.age_group = $1
    `

    const queryParams = [ageGroup]
    let paramCount = 1

    if (playerId) {
      queryText += ` AND a.player_id = $${++paramCount}`
      queryParams.push(playerId)
    }

    if (startDate) {
      queryText += ` AND s.date >= $${++paramCount}`
      queryParams.push(startDate)
    }

    if (endDate) {
      queryText += ` AND s.date <= $${++paramCount}`
      queryParams.push(endDate)
    }

    queryText += ` ORDER BY s.date DESC, s.time_slot DESC, p.name ASC`
    queryText += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`
    queryParams.push(limit, offset)

    const result = await query(queryText, queryParams)

    res.json(result.rows)
  } catch (error) {
    console.error("Get attendance history error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Get attendance statistics
router.get("/stats/:ageGroup", authenticateToken, async (req, res) => {
  try {
    const { ageGroup } = req.params

    // Verify coach has access to this age group
    if (req.user.ageGroup !== ageGroup) {
      return res.status(403).json({ error: "Access denied to this age group" })
    }

    // Get overall stats
    const overallStats = await query(
      `
      SELECT 
        COUNT(DISTINCT p.id) as total_players,
        COUNT(DISTINCT s.id) as total_sessions,
        COUNT(CASE WHEN a.status IN ('present_regular', 'present_complimentary') THEN 1 END) as total_present,
        COUNT(a.id) as total_records,
        ROUND(
          COUNT(CASE WHEN a.status IN ('present_regular', 'present_complimentary') THEN 1 END) * 100.0 / 
          NULLIF(COUNT(a.id), 0), 2
        ) as overall_attendance_rate
      FROM players p
      LEFT JOIN attendance a ON p.id = a.player_id
      LEFT JOIN sessions s ON a.session_id = s.id
      WHERE p.age_group = $1
    `,
      [ageGroup],
    )

    // Get player-specific stats
    const playerStats = await query(
      `
      SELECT 
        p.id, p.name,
        COUNT(a.id) as total_sessions_attended,
        COUNT(CASE WHEN a.status = 'present_regular' THEN 1 END) as regular_sessions,
        COUNT(CASE WHEN a.status = 'present_complimentary' THEN 1 END) as complimentary_sessions,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_sessions,
        ROUND(
          COUNT(CASE WHEN a.status IN ('present_regular', 'present_complimentary') THEN 1 END) * 100.0 / 
          NULLIF(COUNT(a.id), 0), 2
        ) as attendance_rate
      FROM players p
      LEFT JOIN attendance a ON p.id = a.player_id
      WHERE p.age_group = $1
      GROUP BY p.id, p.name
      ORDER BY attendance_rate DESC NULLS LAST, p.name ASC
    `,
      [ageGroup],
    )

    res.json({
      overall: overallStats.rows[0],
      players: playerStats.rows,
    })
  } catch (error) {
    console.error("Get attendance stats error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
