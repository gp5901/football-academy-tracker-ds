"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { CoachDashboard } from "@/components/dashboard/coach-dashboard"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export interface Coach {
  id: string
  username: string
  name: string
  ageGroup: string
  email: string
}

export interface Player {
  id: string
  name: string
  ageGroup: string
  bookedSessions: number
  usedSessions: number
  complimentarySessions: number
  maxComplimentary: number
  joinDate: string
  trainingCompleted?: number
  notes?: string
}

export interface Session {
  id: string
  date: string
  timeSlot: "morning" | "evening"
  ageGroup: string
  coachId: string
  status: "scheduled" | "completed" | "cancelled"
}

export interface AttendanceRecord {
  id: string
  sessionId: string
  playerId: string
  status: "present-regular" | "present-complimentary" | "absent"
  timestamp: string
  photo?: string
  notes?: string
}

export type Student = Player

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentCoach, setCurrentCoach] = useState<Coach | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("coach-token")
    const coachData = localStorage.getItem("current-coach")

    if (token && coachData) {
      try {
        const coach = JSON.parse(coachData)
        setCurrentCoach(coach)
        setIsAuthenticated(true)
      } catch (error) {
        localStorage.removeItem("coach-token")
        localStorage.removeItem("current-coach")
      }
    }

    setIsLoading(false)
  }, [])

  const handleLogin = (coach: Coach) => {
    setCurrentCoach(coach)
    setIsAuthenticated(true)
    localStorage.setItem("current-coach", JSON.stringify(coach))
  }

  const handleLogout = () => {
    setCurrentCoach(null)
    setIsAuthenticated(false)
    localStorage.removeItem("coach-token")
    localStorage.removeItem("current-coach")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {!isAuthenticated ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <CoachDashboard coach={currentCoach!} onLogout={handleLogout} />
      )}
    </div>
  )
}
