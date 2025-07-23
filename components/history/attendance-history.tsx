"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Calendar, UserCheck, UserX, Gift, ImageIcon, Sun, Moon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Player, AttendanceRecord, Session } from "@/app/page"

interface AttendanceHistoryProps {
  players: Player[]
  attendanceRecords: AttendanceRecord[]
  sessions: Session[]
}

export function AttendanceHistory({ players, attendanceRecords, sessions }: AttendanceHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "present-regular" | "present-complimentary" | "absent">(
    "all",
  )
  const [dateFilter, setDateFilter] = useState("")

  const getPlayerName = (playerId: string) => {
    const player = players.find((p) => p.id === playerId)
    return player?.name || "Unknown Player"
  }

  const getSessionInfo = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId)
    if (!session) return { timeSlot: "unknown", date: "" }
    return session
  }

  const getStatusIcon = (status: "present-regular" | "present-complimentary" | "absent") => {
    switch (status) {
      case "present-regular":
        return <UserCheck className="h-4 w-4 text-green-600" />
      case "present-complimentary":
        return <Gift className="h-4 w-4 text-blue-600" />
      case "absent":
        return <UserX className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusBadge = (status: "present-regular" | "present-complimentary" | "absent") => {
    const colors = {
      "present-regular": "bg-green-100 text-green-800",
      "present-complimentary": "bg-blue-100 text-blue-800",
      absent: "bg-red-100 text-red-800",
    }

    const labels = {
      "present-regular": "Present",
      "present-complimentary": "Complimentary",
      absent: "Absent",
    }

    return (
      <Badge className={colors[status]}>
        <span className="flex items-center gap-1">
          {getStatusIcon(status)}
          {labels[status]}
        </span>
      </Badge>
    )
  }

  const getTimeSlotIcon = (timeSlot: "morning" | "evening" | "unknown") => {
    switch (timeSlot) {
      case "morning":
        return <Sun className="h-4 w-4 text-yellow-500" />
      case "evening":
        return <Moon className="h-4 w-4 text-blue-500" />
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />
    }
  }

  // Filter records
  const filteredRecords = attendanceRecords.filter((record) => {
    const playerName = getPlayerName(record.playerId).toLowerCase()
    const matchesSearch = playerName.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || record.status === statusFilter
    const sessionInfo = getSessionInfo(record.sessionId)
    const matchesDate = !dateFilter || sessionInfo.date === dateFilter

    return matchesSearch && matchesStatus && matchesDate
  })

  // Sort by timestamp (most recent first)
  const sortedRecords = filteredRecords.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  // Group by session
  const groupedRecords = sortedRecords.reduce(
    (groups, record) => {
      const sessionId = record.sessionId
      if (!groups[sessionId]) {
        groups[sessionId] = []
      }
      groups[sessionId].push(record)
      return groups
    },
    {} as Record<string, AttendanceRecord[]>,
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Attendance History</h2>
        <p className="text-muted-foreground">View and search through past attendance records</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by player name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="present-regular">Present</SelectItem>
            <SelectItem value="present-complimentary">Complimentary</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10 w-full sm:w-[180px]"
          />
        </div>
      </div>

      {/* Records Display */}
      {attendanceRecords.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No attendance records</p>
              <p className="text-sm text-muted-foreground">Start recording attendance to see history here</p>
            </div>
          </CardContent>
        </Card>
      ) : sortedRecords.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No records found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRecords).map(([sessionId, records]) => {
            const sessionInfo = getSessionInfo(sessionId)
            const sessionPhoto = records.find((r) => r.photo)?.photo

            return (
              <Card key={sessionId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTimeSlotIcon(sessionInfo.timeSlot as any)}
                      <CardTitle className="text-lg capitalize">{sessionInfo.timeSlot} Session</CardTitle>
                      {sessionPhoto && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <ImageIcon className="h-4 w-4 mr-1" />
                              View Photo
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Session Photo</DialogTitle>
                              <DialogDescription>
                                {new Date(sessionInfo.date).toLocaleDateString()} - {sessionInfo.timeSlot}
                              </DialogDescription>
                            </DialogHeader>
                            <img
                              src={sessionPhoto || "/placeholder.svg"}
                              alt="Session photo"
                              className="w-full h-auto rounded-lg"
                            />
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                    <Badge variant="outline">{new Date(sessionInfo.date).toLocaleDateString()}</Badge>
                  </div>
                  <CardDescription>
                    {records.length} player{records.length !== 1 ? "s" : ""} recorded
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {records.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {getPlayerName(record.playerId)
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{getPlayerName(record.playerId)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(record.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {record.notes && (
                            <div className="max-w-xs">
                              <p className="text-sm text-muted-foreground truncate">{record.notes}</p>
                            </div>
                          )}
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
