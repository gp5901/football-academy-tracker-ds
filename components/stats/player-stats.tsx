"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { PlayerWithStats } from "@/types/player"
import { TrendingUp, Award, Target } from "lucide-react"

interface PlayerStatsProps {
  players: PlayerWithStats[]
}

export function PlayerStats({ players }: PlayerStatsProps) {
  const getTopPerformers = () => {
    return players
      .filter((p) => p.totalSessionsAttended > 0)
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 5)
  }

  const getOverallStats = () => {
    if (players.length === 0) {
      return {
        totalPlayers: 0,
        averageAttendance: 0,
        totalSessionsAttended: 0,
        playersWithPerfectAttendance: 0,
      }
    }

    const totalSessionsAttended = players.reduce((sum, p) => sum + p.totalSessionsAttended, 0)
    const averageAttendance = players.reduce((sum, p) => sum + p.attendanceRate, 0) / players.length
    const playersWithPerfectAttendance = players.filter((p) => p.attendanceRate === 100).length

    return {
      totalPlayers: players.length,
      averageAttendance: Math.round(averageAttendance * 100) / 100,
      totalSessionsAttended,
      playersWithPerfectAttendance,
    }
  }

  const topPerformers = getTopPerformers()
  const stats = getOverallStats()

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Overall Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalPlayers}</div>
              <div className="text-sm text-gray-600">Total Players</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.averageAttendance}%</div>
              <div className="text-sm text-gray-600">Avg Attendance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.totalSessionsAttended}</div>
              <div className="text-sm text-gray-600">Total Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.playersWithPerfectAttendance}</div>
              <div className="text-sm text-gray-600">Perfect Attendance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Performers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPerformers.length > 0 ? (
            <div className="space-y-4">
              {topPerformers.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{player.name}</h3>
                      <p className="text-sm text-gray-600">{player.totalSessionsAttended} sessions attended</p>
                    </div>
                  </div>
                  <Badge variant={player.attendanceRate === 100 ? "default" : "secondary"}>
                    {player.attendanceRate}%
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No attendance data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Player Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {players.map((player) => (
              <div key={player.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{player.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {player.regularSessionsUsed}/{player.bookedSessions}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {player.attendanceRate}%
                    </Badge>
                  </div>
                </div>
                <Progress value={(player.regularSessionsUsed / player.bookedSessions) * 100} className="h-2" />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Sessions Used</span>
                  <span>{player.remainingSessions} remaining</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
