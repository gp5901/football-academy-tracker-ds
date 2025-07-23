"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Award, AlertTriangle, Download, User, Calendar, Gift } from "lucide-react"
import type { Player, AttendanceRecord, Coach } from "@/app/page"

interface PlayerStatsProps {
  players: Player[]
  attendanceRecords: AttendanceRecord[]
  coach: Coach
}

export function PlayerStats({ players, attendanceRecords, coach }: PlayerStatsProps) {
  const getPlayerAttendanceRate = (player: Player) => {
    const playerRecords = attendanceRecords.filter((r) => r.playerId === player.id)
    const presentRecords = playerRecords.filter(
      (r) => r.status === "present-regular" || r.status === "present-complimentary",
    )
    return playerRecords.length > 0 ? (presentRecords.length / playerRecords.length) * 100 : 0
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600"
    if (rate >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (rate >= 75) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Attention</Badge>
  }

  // Update the CSV export to include training completion data
  const exportToCSV = () => {
    // Get current date in DD/MM/YYYY format
    const currentDate = new Date().toLocaleDateString("en-GB")

    // Calculate stats for each player
    const csvData = players.map((player) => {
      const playerRecords = attendanceRecords.filter((r) => r.playerId === player.id)
      const presentRecords = playerRecords.filter(
        (r) => r.status === "present-regular" || r.status === "present-complimentary",
      )
      const attendanceRate =
        playerRecords.length > 0 ? Math.round((presentRecords.length / playerRecords.length) * 100) : 0
      const remainingSessions = Math.max(0, player.bookedSessions - player.usedSessions)

      // Determine status based on attendance rate
      let status = "Needs Attention"
      if (attendanceRate >= 90) status = "Excellent"
      else if (attendanceRate >= 75) status = "Good"

      return {
        "Player Name": player.name,
        "Age Group": player.ageGroup,
        "Booked Sessions": player.bookedSessions,
        "Attended Sessions": player.usedSessions,
        "Attendance Rate (%)": attendanceRate,
        "Complimentary Sessions Used": player.complimentarySessions,
        "Remaining Sessions": remainingSessions,
        "Training Completed": player.trainingCompleted || 0,
        Status: status,
        Notes: player.notes || "",
      }
    })

    // Create CSV content with headers and data
    const headers = [
      "Player Name",
      "Age Group",
      "Booked Sessions",
      "Attended Sessions",
      "Attendance Rate (%)",
      "Complimentary Sessions Used",
      "Remaining Sessions",
      "Training Completed",
      "Status",
      "Notes",
    ]

    const csvRows = [
      headers.join(","),
      ...csvData.map((row) =>
        Object.values(row)
          .map((value) => (typeof value === "string" && value.includes(",") ? `"${value}"` : value))
          .join(","),
      ),
      "", // Empty row
      "", // Empty row
      "", // Empty row
      `Report generated on: ${currentDate}`,
      "", // Empty row
      `Coach: ${coach.username}`,
      "", // Empty row
      `Age Group: ${players.length > 0 ? players[0].ageGroup : "N/A"}`,
      "", // Empty row
      `Total Players: ${players.length}`,
    ]

    const csvContent = csvRows.join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-report-${players[0]?.ageGroup || "unknown"}-${currentDate.replace(/\//g, "-")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const sortedPlayers = [...players].sort((a, b) => getPlayerAttendanceRate(b) - getPlayerAttendanceRate(a))

  const bestPerformer = sortedPlayers[0]
  const worstPerformer = sortedPlayers[sortedPlayers.length - 1]

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Player Statistics</h2>
          <p className="text-muted-foreground">Track individual player performance and attendance</p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Performance Highlights */}
      {bestPerformer && worstPerformer && players.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Top Performer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{bestPerformer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {bestPerformer.usedSessions}/{bestPerformer.bookedSessions} sessions
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {getPlayerAttendanceRate(bestPerformer).toFixed(1)}%
                  </p>
                  {getPerformanceBadge(getPlayerAttendanceRate(bestPerformer))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{worstPerformer.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {worstPerformer.usedSessions}/{worstPerformer.bookedSessions} sessions
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">
                    {getPlayerAttendanceRate(worstPerformer).toFixed(1)}%
                  </p>
                  {getPerformanceBadge(getPlayerAttendanceRate(worstPerformer))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual Player Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Performance</CardTitle>
          <CardDescription>Detailed breakdown for each player</CardDescription>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No players found</p>
              <p className="text-sm text-muted-foreground">Players will appear here once assigned to your age group</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedPlayers.map((player) => {
                const attendanceRate = getPlayerAttendanceRate(player)
                const sessionProgress = (player.usedSessions / player.bookedSessions) * 100
                const complimentaryProgress = (player.complimentarySessions / player.maxComplimentary) * 100

                return (
                  <div key={player.id} className="border rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {player.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{player.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Joined: {new Date(player.joinDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getPerformanceColor(attendanceRate)}`}>
                          {attendanceRate.toFixed(1)}%
                        </p>
                        {getPerformanceBadge(attendanceRate)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Regular Sessions</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>
                              {player.usedSessions} / {player.bookedSessions}
                            </span>
                            <span>{sessionProgress.toFixed(0)}%</span>
                          </div>
                          <Progress value={sessionProgress} className="h-2" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Gift className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Complimentary</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>
                              {player.complimentarySessions} / {player.maxComplimentary}
                            </span>
                            <span>{complimentaryProgress.toFixed(0)}%</span>
                          </div>
                          <Progress value={complimentaryProgress} className="h-2" />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Attendance Rate</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Overall Performance</span>
                            <span>{attendanceRate.toFixed(1)}%</span>
                          </div>
                          <Progress value={attendanceRate} className="h-2" />
                        </div>
                      </div>
                    </div>

                    {/* Warnings */}
                    {(player.usedSessions >= player.bookedSessions ||
                      player.complimentarySessions >= player.maxComplimentary) && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">Attention Required</span>
                        </div>
                        <div className="mt-1 text-sm text-yellow-700">
                          {player.usedSessions >= player.bookedSessions && <p>• Regular sessions limit reached</p>}
                          {player.complimentarySessions >= player.maxComplimentary && (
                            <p>• Maximum complimentary sessions used</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
