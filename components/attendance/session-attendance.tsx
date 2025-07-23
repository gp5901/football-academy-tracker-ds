"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Camera, Save, UserCheck, UserX, Gift, ImageIcon, AlertTriangle } from "lucide-react"
import type { Session, Player, AttendanceRecord } from "@/app/page"

interface SessionAttendanceProps {
  session: Session
  players: Player[]
  existingRecords: AttendanceRecord[]
  onAttendanceUpdate: (records: AttendanceRecord[]) => void
}

export function SessionAttendance({ session, players, existingRecords, onAttendanceUpdate }: SessionAttendanceProps) {
  const [attendanceData, setAttendanceData] = useState<
    Record<string, { status: "present-regular" | "present-complimentary" | "absent"; notes: string }>
  >({})
  const [sessionPhoto, setSessionPhoto] = useState<string>("")
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if attendance already recorded for this session
  const isAlreadyRecorded = existingRecords.some((record) => record.sessionId === session.id)

  const handleStatusChange = (playerId: string, status: "present-regular" | "present-complimentary" | "absent") => {
    setAttendanceData((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        status,
        notes: prev[playerId]?.notes || "",
      },
    }))
  }

  const handleNotesChange = (playerId: string, notes: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        status: prev[playerId]?.status || "absent",
        notes,
      },
    }))
  }

  const handlePhotoCapture = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setSessionPhoto(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSaveAttendance = async () => {
    setIsSaving(true)

    const records: AttendanceRecord[] = players.map((player) => ({
      id: `${session.id}-${player.id}-${Date.now()}`,
      sessionId: session.id,
      playerId: player.id,
      status: attendanceData[player.id]?.status || "absent",
      timestamp: new Date().toISOString(),
      photo: sessionPhoto,
      notes: attendanceData[player.id]?.notes || "",
    }))

    onAttendanceUpdate(records)
    setAttendanceData({})
    setSessionPhoto("")
    setIsSaving(false)
  }

  const getStatusColor = (status: "present-regular" | "present-complimentary" | "absent") => {
    switch (status) {
      case "present-regular":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "present-complimentary":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "absent":
        return "bg-red-100 text-red-800 hover:bg-red-200"
    }
  }

  const getStatusIcon = (status: "present-regular" | "present-complimentary" | "absent") => {
    switch (status) {
      case "present-regular":
        return <UserCheck className="h-4 w-4" />
      case "present-complimentary":
        return <Gift className="h-4 w-4" />
      case "absent":
        return <UserX className="h-4 w-4" />
    }
  }

  const canUseComplimentary = (player: Player) => {
    return player.complimentarySessions < player.maxComplimentary
  }

  const getPlayerWarnings = (player: Player) => {
    const warnings = []
    if (player.usedSessions >= player.bookedSessions) {
      warnings.push("Booked sessions exceeded")
    }
    if (player.complimentarySessions >= player.maxComplimentary) {
      warnings.push("Max complimentary sessions used")
    }
    return warnings
  }

  return (
    <div className="space-y-4">
      {isAlreadyRecorded && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Attendance has already been recorded for this session. Recording again will create duplicate entries.
          </AlertDescription>
        </Alert>
      )}

      {/* Photo Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Session Photo</h3>
            <Button variant="outline" onClick={handlePhotoCapture}>
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {sessionPhoto && (
            <div className="mt-4">
              <img
                src={sessionPhoto || "/placeholder.svg"}
                alt="Session photo"
                className="w-full max-w-md h-48 object-cover rounded-lg border"
              />
            </div>
          )}

          {!sessionPhoto && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">No photo captured yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Player Attendance */}
      <div className="space-y-4">
        {players.map((player) => {
          const currentStatus = attendanceData[player.id]?.status || "absent"
          const currentNotes = attendanceData[player.id]?.notes || ""
          const warnings = getPlayerWarnings(player)

          return (
            <Card key={player.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{player.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">
                          Sessions: {player.usedSessions}/{player.bookedSessions}
                        </Badge>
                        <Badge variant="outline">
                          Complimentary: {player.complimentarySessions}/{player.maxComplimentary}
                        </Badge>
                      </div>
                      {warnings.length > 0 && (
                        <div className="mt-2">
                          {warnings.map((warning, index) => (
                            <Badge key={index} variant="destructive" className="mr-1">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {warning}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={currentStatus === "present-regular" ? getStatusColor("present-regular") : ""}
                        onClick={() => handleStatusChange(player.id, "present-regular")}
                      >
                        {getStatusIcon("present-regular")}
                        <span className="ml-1">Present</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className={
                          currentStatus === "present-complimentary" ? getStatusColor("present-complimentary") : ""
                        }
                        onClick={() => handleStatusChange(player.id, "present-complimentary")}
                        disabled={!canUseComplimentary(player)}
                      >
                        {getStatusIcon("present-complimentary")}
                        <span className="ml-1">Complimentary</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className={currentStatus === "absent" ? getStatusColor("absent") : ""}
                        onClick={() => handleStatusChange(player.id, "absent")}
                      >
                        {getStatusIcon("absent")}
                        <span className="ml-1">Absent</span>
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
                    <Textarea
                      placeholder="Add any notes about this player's attendance..."
                      value={currentNotes}
                      onChange={(e) => handleNotesChange(player.id, e.target.value)}
                      className="resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSaveAttendance} disabled={isSaving || players.length === 0} className="min-w-[150px]">
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? "Saving..." : "Save Attendance"}
        </Button>
      </div>
    </div>
  )
}
