"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Calendar, Users, Clock, Sun, Moon, UserCheck } from "lucide-react"
import { SessionAttendance } from "@/components/attendance/session-attendance"
import { PlayerStats } from "@/components/stats/player-stats"
import { AttendanceHistory } from "@/components/history/attendance-history"
import type { Coach, Player, Session, AttendanceRecord } from "@/app/page"
import { PlayerManager } from "@/components/player/player-manager"

interface CoachDashboardProps {
  coach: Coach
  onLogout: () => void
}

// Mock data - in real app this would come from API
const mockPlayers: Player[] = [
  {
    id: "1",
    name: "Olivia Garcia",
    ageGroup: "U16",
    bookedSessions: 12,
    usedSessions: 10,
    complimentarySessions: 1,
    maxComplimentary: 3,
    joinDate: "2024-01-15",
    trainingCompleted: 8,
    notes: "Excellent progress in defensive skills",
  },
  {
    id: "2",
    name: "William Rodriguez",
    ageGroup: "U16",
    bookedSessions: 12,
    usedSessions: 11,
    complimentarySessions: 0,
    maxComplimentary: 3,
    joinDate: "2024-01-20",
    trainingCompleted: 11,
    notes: "Outstanding leadership qualities",
  },
  {
    id: "3",
    name: "Ava Martinez",
    ageGroup: "U16",
    bookedSessions: 12,
    usedSessions: 7,
    complimentarySessions: 3,
    maxComplimentary: 3,
    joinDate: "2024-02-01",
    trainingCompleted: 5,
    notes: "Needs improvement in attendance and focus",
  },
  {
    id: "4",
    name: "James Anderson",
    ageGroup: "U16",
    bookedSessions: 12,
    usedSessions: 9,
    complimentarySessions: 1,
    maxComplimentary: 3,
    joinDate: "2024-02-10",
    trainingCompleted: 8,
    notes: "Good technical skills, working on stamina",
  },
  {
    id: "5",
    name: "Isabella Taylor",
    ageGroup: "U16",
    bookedSessions: 12,
    usedSessions: 12,
    complimentarySessions: 0,
    maxComplimentary: 3,
    joinDate: "2024-01-25",
    trainingCompleted: 12,
    notes: "Perfect attendance, excellent all-around player",
  },
  // Add players for other age groups
  {
    id: "6",
    name: "Alex Thompson",
    ageGroup: "U12",
    bookedSessions: 12,
    usedSessions: 8,
    complimentarySessions: 1,
    maxComplimentary: 3,
    joinDate: "2024-01-15",
    trainingCompleted: 7,
    notes: "Enthusiastic player, needs work on ball control",
  },
  {
    id: "7",
    name: "Emma Davis",
    ageGroup: "U12",
    bookedSessions: 12,
    usedSessions: 10,
    complimentarySessions: 0,
    maxComplimentary: 3,
    joinDate: "2024-01-20",
    trainingCompleted: 9,
    notes: "Great team player with good passing skills",
  },
  {
    id: "8",
    name: "James Wilson",
    ageGroup: "U14",
    bookedSessions: 16,
    usedSessions: 12,
    complimentarySessions: 2,
    maxComplimentary: 3,
    joinDate: "2024-02-01",
    trainingCompleted: 10,
    notes: "Strong midfielder, working on shooting accuracy",
  },
  {
    id: "9",
    name: "Sofia Garcia",
    ageGroup: "U14",
    bookedSessions: 16,
    usedSessions: 14,
    complimentarySessions: 1,
    maxComplimentary: 3,
    joinDate: "2024-02-10",
    trainingCompleted: 13,
    notes: "Excellent goalkeeper with quick reflexes",
  },
]

export function CoachDashboard({ coach, onLogout }: CoachDashboardProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [todaySessions, setTodaySessions] = useState<Session[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])

  // Add player management functions
  const addPlayer = (player: Omit<Player, "id">) => {
    const newPlayer: Player = {
      ...player,
      id: Date.now().toString(),
    }
    setPlayers((prev) => [...prev, newPlayer])

    // Save to localStorage
    const allPlayers = [...mockPlayers.filter((p) => p.ageGroup !== coach.ageGroup), ...players, newPlayer]
    localStorage.setItem("academy-players", JSON.stringify(allPlayers))
  }

  const updatePlayer = (id: string, updatedPlayer: Omit<Player, "id">) => {
    setPlayers((prev) => prev.map((player) => (player.id === id ? { ...updatedPlayer, id } : player)))

    // Save to localStorage
    const allPlayers = [
      ...mockPlayers.filter((p) => p.ageGroup !== coach.ageGroup),
      ...players.map((p) => (p.id === id ? { ...updatedPlayer, id } : p)),
    ]
    localStorage.setItem("academy-players", JSON.stringify(allPlayers))
  }

  const deletePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((player) => player.id !== id))
    setAttendanceRecords((prev) => prev.filter((record) => record.playerId !== id))

    // Save to localStorage
    const allPlayers = [
      ...mockPlayers.filter((p) => p.ageGroup !== coach.ageGroup),
      ...players.filter((p) => p.id !== id),
    ]
    localStorage.setItem("academy-players", JSON.stringify(allPlayers))
  }

  // Load players from localStorage if available
  useEffect(() => {
    const savedPlayers = localStorage.getItem("academy-players")
    if (savedPlayers) {
      const allPlayers = JSON.parse(savedPlayers)
      const coachPlayers = allPlayers.filter((player: Player) => player.ageGroup === coach.ageGroup)
      setPlayers(coachPlayers)
    } else {
      // Filter players by coach's age group
      const coachPlayers = mockPlayers.filter((player) => player.ageGroup === coach.ageGroup)
      setPlayers(coachPlayers)
    }

    // Generate today's sessions
    const today = new Date().toISOString().split("T")[0]
    const sessions: Session[] = [
      {
        id: `${today}-morning-${coach.ageGroup}`,
        date: today,
        timeSlot: "morning",
        ageGroup: coach.ageGroup,
        coachId: coach.id,
        status: "scheduled",
      },
      {
        id: `${today}-evening-${coach.ageGroup}`,
        date: today,
        timeSlot: "evening",
        ageGroup: coach.ageGroup,
        coachId: coach.id,
        status: "scheduled",
      },
    ]
    setTodaySessions(sessions)

    // Load existing attendance records
    const savedRecords = localStorage.getItem(`attendance-${coach.id}`)
    if (savedRecords) {
      setAttendanceRecords(JSON.parse(savedRecords))
    }
  }, [coach])

  const handleAttendanceUpdate = (records: AttendanceRecord[]) => {
    setAttendanceRecords((prev) => {
      const updated = [...prev, ...records]
      localStorage.setItem(`attendance-${coach.id}`, JSON.stringify(updated))
      return updated
    })

    // Update player session counts
    setPlayers((prev) =>
      prev.map((player) => {
        const playerRecords = records.filter((r) => r.playerId === player.id)
        const regularSessions = playerRecords.filter((r) => r.status === "present-regular").length
        const complimentarySessions = playerRecords.filter((r) => r.status === "present-complimentary").length

        return {
          ...player,
          usedSessions: player.usedSessions + regularSessions,
          complimentarySessions: player.complimentarySessions + complimentarySessions,
        }
      }),
    )
  }

  const getTimeSlotIcon = (timeSlot: "morning" | "evening") => {
    return timeSlot === "morning" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
  }

  const getSessionStats = () => {
    const totalPlayers = players.length
    const todayAttendance = attendanceRecords.filter((record) =>
      todaySessions.some((session) => session.id === record.sessionId),
    )
    const presentToday = todayAttendance.filter(
      (record) => record.status === "present-regular" || record.status === "present-complimentary",
    ).length

    return { totalPlayers, presentToday }
  }

  const stats = getSessionStats()

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coach Dashboard</h1>
            <p className="text-gray-600">Welcome back, {coach.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="text-sm">
              {coach.ageGroup} Age Group
            </Badge>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Players</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlayers}</div>
              <p className="text-xs text-muted-foreground">in {coach.ageGroup} group</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present Today</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.presentToday}</div>
              <p className="text-xs text-muted-foreground">across all sessions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaySessions.length}</div>
              <p className="text-xs text-muted-foreground">Morning & Evening</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Date</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{new Date().toLocaleDateString()}</div>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("en-US", { weekday: "long" })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="attendance">Today's Attendance</TabsTrigger>
            <TabsTrigger value="players">Manage Players</TabsTrigger>
            <TabsTrigger value="stats">Player Stats</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-4">
            <div className="grid gap-4">
              {todaySessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTimeSlotIcon(session.timeSlot)}
                        <CardTitle className="capitalize">{session.timeSlot} Session</CardTitle>
                      </div>
                      <Badge variant="outline">{session.ageGroup}</Badge>
                    </div>
                    <CardDescription>
                      {new Date().toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SessionAttendance
                      session={session}
                      players={players}
                      existingRecords={attendanceRecords}
                      onAttendanceUpdate={handleAttendanceUpdate}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="players">
            <PlayerManager
              players={players}
              coach={coach}
              onAddPlayer={addPlayer}
              onUpdatePlayer={updatePlayer}
              onDeletePlayer={deletePlayer}
            />
          </TabsContent>

          <TabsContent value="stats">
            <PlayerStats players={players} attendanceRecords={attendanceRecords} coach={coach} />
          </TabsContent>

          <TabsContent value="history">
            <AttendanceHistory players={players} attendanceRecords={attendanceRecords} sessions={todaySessions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
