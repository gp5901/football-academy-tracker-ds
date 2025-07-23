"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SessionAttendance } from "@/components/attendance/session-attendance"
import { PlayerManager } from "@/components/player/player-manager"
import { AttendanceHistory } from "@/components/history/attendance-history"
import { PlayerStats } from "@/components/stats/player-stats"
import { sessionService } from "@/lib/session-service"
import { playerService } from "@/lib/player-service"
import type { Session } from "@/types/session"
import type { PlayerWithStats } from "@/types/player"
import { Calendar, Users, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react"

interface Coach {
  id: string
  username: string
  name: string
  ageGroup: string
}

interface CoachDashboardProps {
  coach: Coach
}

export function CoachDashboard({ coach }: CoachDashboardProps) {
  const [todaysSessions, setTodaysSessions] = useState<Session[]>([])
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("today")

  useEffect(() => {
    loadDashboardData()
  }, [coach.ageGroup])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load today's sessions
      const sessions = await sessionService.getTodaysSessions(coach.ageGroup)
      setTodaysSessions(sessions)

      // Load players with stats
      const playersData = await playerService.getPlayers(coach.ageGroup)
      const playersWithStats = await Promise.all(
        playersData.map(async (player) => {
          const playerStats = await playerService.getPlayerWithStats(player.id)
          return (
            playerStats || {
              ...player,
              totalSessionsAttended: 0,
              regularSessionsUsed: 0,
              complimentarySessionsUsed: 0,
              remainingSessions: player.bookedSessions,
              attendanceRate: 0,
            }
          )
        }),
      )
      setPlayers(playersWithStats)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSessionStatusBadge = (session: Session) => {
    switch (session.status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        )
      case "scheduled":
        return (
          <Badge variant="outline">
            <Calendar className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getTotalStats = () => {
    const totalPlayers = players.length
    const totalSessionsToday = todaysSessions.length
    const completedSessionsToday = todaysSessions.filter((s) => s.status === "completed").length
    const averageAttendance =
      players.length > 0 ? players.reduce((sum, p) => sum + p.attendanceRate, 0) / players.length : 0

    return {
      totalPlayers,
      totalSessionsToday,
      completedSessionsToday,
      averageAttendance: Math.round(averageAttendance * 100) / 100,
    }
  }

  const stats = getTotalStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Players</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalPlayers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Sessions</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.completedSessionsToday}/{stats.totalSessionsToday}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                <p className="text-2xl font-bold text-purple-600">{stats.averageAttendance}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Age Group</p>
                <p className="text-2xl font-bold text-orange-600">{coach.ageGroup}</p>
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {coach.ageGroup}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Sessions Quick View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Today's Sessions ({new Date().toLocaleDateString()})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todaysSessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold capitalize">{session.timeSlot} Session</h3>
                  {getSessionStatusBadge(session)}
                </div>
                <p className="text-sm text-gray-600">Session ID: {session.id.split("-").slice(-2).join("-")}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {session.status === "completed" ? "Completed" : "Ready for attendance"}
                  </span>
                  {session.status !== "completed" && (
                    <Button size="sm" onClick={() => setActiveTab("attendance")} className="ml-2">
                      Mark Attendance
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today's Sessions</TabsTrigger>
          <TabsTrigger value="attendance">Mark Attendance</TabsTrigger>
          <TabsTrigger value="players">Manage Players</TabsTrigger>
          <TabsTrigger value="history">History & Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaysSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg capitalize">{session.timeSlot} Session</h3>
                        <p className="text-sm text-gray-600">{new Date(session.createdAt).toLocaleString()}</p>
                      </div>
                      {getSessionStatusBadge(session)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Session ID:</span>
                        <p className="text-gray-600">{session.id}</p>
                      </div>
                      <div>
                        <span className="font-medium">Age Group:</span>
                        <p className="text-gray-600">{session.ageGroup}</p>
                      </div>
                    </div>

                    {session.groupPhotoUrl && (
                      <div className="mt-3">
                        <span className="font-medium text-sm">Group Photo:</span>
                        <img
                          src={session.groupPhotoUrl || "/placeholder.svg"}
                          alt="Session group photo"
                          className="mt-1 rounded-lg max-w-xs h-32 object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <SessionAttendance ageGroup={coach.ageGroup} onAttendanceMarked={loadDashboardData} />
        </TabsContent>

        <TabsContent value="players">
          <PlayerManager ageGroup={coach.ageGroup} onPlayersChanged={loadDashboardData} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AttendanceHistory ageGroup={coach.ageGroup} />
            <PlayerStats players={players} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
