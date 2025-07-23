"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoginForm } from "@/components/auth/login-form"
import { CoachDashboard } from "@/components/dashboard/coach-dashboard"
import { sessionService } from "@/lib/session-service"
import { playerService } from "@/lib/player-service"
import { LogOut, RefreshCw } from "lucide-react"

interface Coach {
  id: string
  username: string
  name: string
  ageGroup: string
}

export default function FootballAcademyTracker() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentCoach, setCurrentCoach] = useState<Coach | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Run migrations on app start
    sessionService.migrateFromCounterBasedData()
    playerService.migrateFromCounterBasedData()

    // Check for existing authentication
    const token = localStorage.getItem("auth_token")
    const coach = localStorage.getItem("current_coach")

    if (token && coach) {
      try {
        setCurrentCoach(JSON.parse(coach))
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Error parsing stored coach data:", error)
        localStorage.removeItem("auth_token")
        localStorage.removeItem("current_coach")
      }
    }

    setIsLoading(false)
  }, [])

  const handleLogin = (coach: Coach, token: string) => {
    localStorage.setItem("auth_token", token)
    localStorage.setItem("current_coach", JSON.stringify(coach))
    setCurrentCoach(coach)
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("current_coach")
    setCurrentCoach(null)
    setIsAuthenticated(false)
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-96">
          <CardContent className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-lg">Loading...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-800">⚽ Football Academy Tracker</CardTitle>
            <p className="text-gray-600">Session-Based Attendance System</p>
          </CardHeader>
          <CardContent>
            <LoginForm onLogin={handleLogin} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">⚽ Football Academy Tracker</h1>
            <p className="text-gray-600">
              Welcome back, {currentCoach?.name} ({currentCoach?.ageGroup})
            </p>
            <p className="text-sm text-blue-600 font-medium">Session-Based Architecture v2.0</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-transparent"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2 bg-transparent"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <CoachDashboard coach={currentCoach!} />
      </div>
    </div>
  )
}
