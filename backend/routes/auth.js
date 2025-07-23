const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { query } = require("../config/database")
const { authenticateToken } = require("../middleware/auth")

const router = express.Router()

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" })
    }

    // Find coach by username
    const result = await query(
      "SELECT id, username, password_hash, name, email, age_group FROM coaches WHERE username = $1",
      [username],
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const coach = result.rows[0]

    // For demo purposes, accept 'password123' for all coaches
    // In production, use proper password hashing
    const isValidPassword = password === "password123" || (await bcrypt.compare(password, coach.password_hash))

    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: coach.id,
        username: coach.username,
        ageGroup: coach.age_group,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" },
    )

    res.json({
      token,
      coach: {
        id: coach.id,
        username: coach.username,
        name: coach.name,
        email: coach.email,
        ageGroup: coach.age_group,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

// Logout endpoint
router.post("/logout", authenticateToken, (req, res) => {
  // In a real app, you might want to blacklist the token
  res.json({ message: "Logged out successfully" })
})

// Get current user
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await query("SELECT id, username, name, email, age_group FROM coaches WHERE id = $1", [req.user.id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Coach not found" })
    }

    const coach = result.rows[0]
    res.json({
      id: coach.id,
      username: coach.username,
      name: coach.name,
      email: coach.email,
      ageGroup: coach.age_group,
    })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
})

module.exports = router
