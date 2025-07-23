"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { sessionService } from "@/lib/session-service"
import { playerService } from "@/lib/player-service"
import type { Session, AttendanceRecord } from "@/types/session"
import type { PlayerWithStats } from "@/types/player"
import { CheckCircle, XCircle, Gift, Users, Clock } from "lucide-react"

interface SessionAttendanceProps {
  ageGroup: string
  onAttendanceMarked?: () => void
}

interface AttendanceState {
  [playerId: string]: {
    status: "present_regular" | "present_complimentary" | "absent"
    notes: string
  }
}

export function SessionAttendance({ ageGroup, onAttendanceMarked }: SessionAttendanceProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [attendanceState, setAttendanceState] = useState<AttendanceState>({})
  const [existingAttendance, setExistingAttendance] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    loadData()
  }, [ageGroup])

  useEffect(() => {
    if (selectedSession) {
      loadSessionAttendance(selectedSession.id)
    }
  }, [selectedSession])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [sessionsData, playersData] = await Promise.all([
        sessionService.getTodaysSessions(ageGroup),
        playerService.getPlayers(ageGroup),
      ])

      setSessions(sessionsData)

      // Auto-select first incomplete session
      const incompleteSession = sessionsData.find((s) => s.status !== "completed")
      if (incompleteSession) {
        setSelectedSession(incompleteSession)
      }

      // Load players with stats
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
      console.error("Error loading data:", error)
      setMessage({ type: "error", text: "Failed to load session data" })
    } finally {
      setIsLoading(false)
    }
  }

  const loadSessionAttendance = async (sessionId: string) => {
    try {
      const sessionWithAttendance = await sessionService.getSessionWithAttendance(sessionId)

      if (sessionWithAttendance) {
        setExistingAttendance(sessionWithAttendance.attendance)

        // Pre-populate attendance state with existing records
        const initialState: AttendanceState = {}
        sessionWithAttendance.attendance.forEach((record) => {
          initialState[record.playerId] = {
            status: record.status,
            notes: record.notes || "",
          }
        })
        setAttendanceState(initialState)
      }
    } catch (error) {
      console.error("Error loading session attendance:", error)
    }
  }

  const updateAttendance = (
    playerId: string,
    status: "present_regular" | "present_complimentary" | "absent",
    notes = "",
  ) => {
    setAttendanceState((prev) => ({
      ...prev,
      [playerId]: { status, notes },
    }))
  }

  const updateNotes = (playerId: string, notes: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        notes,
      },
    }))
  }

  const handleSubmit = async () => {
    if (!selectedSession) return

    setIsSaving(true)
    setMessage(null)

    try {
      const attendanceRecords = Object.entries(attendanceState).map(([playerId, data]) => ({
        sessionId: selectedSession.id,
        playerId,
        status: data.status,
        notes: data.notes,
      }))

      await sessionService.markAttendance(selectedSession.id, attendanceRecords)

      setMessage({ type: "success", text: "Attendance marked successfully!" })

      // Refresh data
      await loadData()
      onAttendanceMarked?.()
    } catch (error) {
      console.error("Error marking attendance:", error)
      setMessage({ type: "error", text: "Failed to mark attendance. Please try again." })
    } finally {
      setIsSaving(false)
    }
  }

  const getAttendanceStats = () => {
    const records = Object.values(attendanceState)
    const present = records.filter((r) => r.status === "present_regular" || r.status === "present_complimentary").length
    const absent = records.filter((r) => r.status === "absent").length
    const total = players.length

    return { present, absent, total, unmarked: total - present - absent }
  }

  const stats = getAttendanceStats()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading session data...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Session Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Select Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedSession?.id === session.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedSession(session)}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold capitalize">{session.timeSlot} Session</h3>
                  <Badge variant={session.status === "completed" ? "default" : "outline"}>
                    {session.status === "completed" ? "Completed" : "Pending"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{new Date(session.date).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedSession && (
        <>
          {/* Attendance Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Attendance Overview - {selectedSession.timeSlot} Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                  <div className="text-sm text-gray-600">Present</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                  <div className="text-sm text-gray-600">Absent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.unmarked}</div>
                  <div className="text-sm text-gray-600">Unmarked</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Players</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Attendance */}
          <Card>
            <CardHeader>
              <CardTitle>Mark Attendance</CardTitle>
              {existingAttendance.length > 0 && (
                <Alert>
                  <AlertDescription>
                    This session already has attendance records. You can update them below.
                  </AlertDescription>
                </Alert>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {players.map((player) => {
                  const currentStatus = attendanceState[player.id]?.status
                  const currentNotes = attendanceState[player.id]?.notes || ""
                  const canUseComplimentary = player.complimentarySessionsUsed < player.maxComplimentary

                  return (
                    <div key={player.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{player.name}</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>
                              Regular sessions used: {player.regularSessionsUsed}/{player.bookedSessions}
                            </p>
                            <p>
                              Complimentary used: {player.complimentarySessionsUsed}/{player.maxComplimentary}
                            </p>
                            <p>Attendance rate: {player.attendanceRate}%</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={currentStatus === "present_regular" ? "default" : "outline"}
                            onClick={() => updateAttendance(player.id, "present_regular")}
                            disabled={player.remainingSessions <= 0}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Regular
                          </Button>

                          <Button
                            size="sm"
                            variant={currentStatus === "present_complimentary" ? "default" : "outline"}
                            onClick={() => updateAttendance(player.id, "present_complimentary")}
                            disabled={!canUseComplimentary}
                            className="flex items-center gap-1"
                          >
                            <Gift className="h-4 w-4" />
                            Comp
                          </Button>

                          <Button
                            size="sm"
                            variant={currentStatus === "absent" ? "destructive" : "outline"}
                            onClick={() => updateAttendance(player.id, "absent")}
                            className="flex items-center gap-1"
                          >
                            <XCircle className="h-4 w-4" />
                            Absent
                          </Button>
                        </div>
                      </div>

                      {currentStatus && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge
                              variant={
                                currentStatus === "present_regular"
                                  ? "default"
                                  : currentStatus === "present_complimentary"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {currentStatus === "present_regular" && "Present (Regular)"}
                              {currentStatus === "present_complimentary" && "Present (Complimentary)"}
                              {currentStatus === "absent" && "Absent"}
                            </Badge>
                          </div>

                          <Textarea
                            placeholder="Add notes (optional)..."
                            value={currentNotes}
                            onChange={(e) => updateNotes(player.id, e.target.value)}
                            className="text-sm"
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {stats.present + stats.absent} of {stats.total} players marked
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={isSaving || stats.unmarked > 0}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Mark Attendance
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {message && (
        <Alert className={message.type === "error" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          <AlertDescription className={message.type === "error" ? "text-red-800" : "text-green-800"}>
            {message.text}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
