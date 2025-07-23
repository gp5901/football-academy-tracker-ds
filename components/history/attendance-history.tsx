"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { sessionService } from "@/lib/session-service"
import { playerService } from "@/lib/player-service"
import type { Session, AttendanceRecord } from "@/types/session"
import type { Player } from "@/types/player"
import { History, Download, Filter, Calendar } from "lucide-react"

interface AttendanceHistoryProps {
  ageGroup: string
}

interface AttendanceWithDetails extends AttendanceRecord {
  playerName: string
  sessionDate: string
  sessionTimeSlot: string
}

export function AttendanceHistory({ ageGroup }: AttendanceHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceWithDetails[]>([])
  const [filteredHistory, setFilteredHistory] = useState<AttendanceWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    playerName: "",
    status: "all",
    dateFrom: "",
    dateTo: "",
  })

  useEffect(() => {
    loadData()
  }, [ageGroup])

  useEffect(() => {
    applyFilters()
  }, [attendanceHistory, filters])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [sessionsData, playersData] = await Promise.all([
        sessionService.getSessionHistory(ageGroup, 100),
        playerService.getPlayers(ageGroup),
      ])

      setSessions(sessionsData)
      setPlayers(playersData)

      // Build attendance history with details
      const history: AttendanceWithDetails[] = []
      const storedAttendance = getStoredAttendance()

      storedAttendance.forEach((record) => {
        const session = sessionsData.find((s) => s.id === record.sessionId)
        const player = playersData.find((p) => p.id === record.playerId)

        if (session && player && session.ageGroup === ageGroup) {
          history.push({
            ...record,
            playerName: player.name,
            sessionDate: session.date,
            sessionTimeSlot: session.timeSlot,
          })
        }
      })

      // Sort by date (newest first)
      history.sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
      setAttendanceHistory(history)
    } catch (error) {
      console.error("Error loading attendance history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStoredAttendance = (): AttendanceRecord[] => {
    try {
      return JSON.parse(localStorage.getItem("attendance_v2") || "[]")
    } catch {
      return []
    }
  }

  const applyFilters = () => {
    let filtered = [...attendanceHistory]

    if (filters.playerName) {
      filtered = filtered.filter((record) => record.playerName.toLowerCase().includes(filters.playerName.toLowerCase()))
    }

    if (filters.status !== "all") {
      filtered = filtered.filter((record) => record.status === filters.status)
    }

    if (filters.dateFrom) {
      filtered = filtered.filter((record) => record.sessionDate >= filters.dateFrom)
    }

    if (filters.dateTo) {
      filtered = filtered.filter((record) => record.sessionDate <= filters.dateTo)
    }

    setFilteredHistory(filtered)
  }

  const exportToCSV = () => {
    const headers = ["Date", "Time Slot", "Player Name", "Status", "Notes"]
    const csvData = [
      headers.join(","),
      ...filteredHistory.map((record) =>
        [record.sessionDate, record.sessionTimeSlot, record.playerName, record.status, `"${record.notes || ""}"`].join(
          ",",
        ),
      ),
    ].join("\n")

    const blob = new Blob([csvData], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `attendance-history-${ageGroup}-${new Date().toISOString().split("T")[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present_regular":
        return <Badge variant="default">Present (Regular)</Badge>
      case "present_complimentary":
        return <Badge variant="secondary">Present (Comp)</Badge>
      case "absent":
        return <Badge variant="destructive">Absent</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading attendance history...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Attendance History ({ageGroup})
            </CardTitle>
            <Button
              onClick={exportToCSV}
              disabled={filteredHistory.length === 0}
              className="flex items-center gap-2"
              size="sm"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <Input
                placeholder="Search player name..."
                value={filters.playerName}
                onChange={(e) => setFilters({ ...filters, playerName: e.target.value })}
              />
            </div>
            <div>
              <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present_regular">Present (Regular)</SelectItem>
                  <SelectItem value="present_complimentary">Present (Comp)</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input
                type="date"
                placeholder="From date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              />
            </div>
            <div>
              <Input
                type="date"
                placeholder="To date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              />
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">
              Showing {filteredHistory.length} of {attendanceHistory.length} records
            </span>
            {(filters.playerName || filters.status !== "all" || filters.dateFrom || filters.dateTo) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ playerName: "", status: "all", dateFrom: "", dateTo: "" })}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* History Table */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((record) => (
                <div key={record.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{record.playerName}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {new Date(record.sessionDate).toLocaleDateString()} - {record.sessionTimeSlot}
                      </div>
                    </div>
                    {getStatusBadge(record.status)}
                  </div>

                  {record.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Notes:</strong> {record.notes}
                    </div>
                  )}

                  <div className="text-xs text-gray-500">Recorded: {new Date(record.timestamp).toLocaleString()}</div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold mb-2">No Records Found</h3>
                <p>
                  {attendanceHistory.length === 0
                    ? "No attendance records available yet."
                    : "No records match your current filters."}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
