"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Save, UserCheck, UserX, Clock } from "lucide-react"
import { format } from "date-fns"
import type { Student, AttendanceRecord } from "@/app/page"
import { cn } from "@/lib/utils"

interface AttendanceRecorderProps {
  students: Student[]
  onRecordAttendance: (records: Omit<AttendanceRecord, "id">[]) => void
  existingRecords: AttendanceRecord[]
}

export function AttendanceRecorder({ students, onRecordAttendance, existingRecords }: AttendanceRecorderProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [attendanceData, setAttendanceData] = useState<
    Record<string, { status: "present" | "absent" | "late"; notes: string }>
  >({})
  const [isSaving, setIsSaving] = useState(false)

  const dateString = format(selectedDate, "yyyy-MM-dd")

  // Check if attendance is already recorded for this date
  const existingAttendanceForDate = existingRecords.filter((record) => record.date === dateString)
  const isAlreadyRecorded = existingAttendanceForDate.length > 0

  const handleStatusChange = (studentId: string, status: "present" | "absent" | "late") => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        notes: prev[studentId]?.notes || "",
      },
    }))
  }

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceData((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: prev[studentId]?.status || "present",
        notes,
      },
    }))
  }

  const handleSaveAttendance = async () => {
    setIsSaving(true)

    const records: Omit<AttendanceRecord, "id">[] = students.map((student) => ({
      studentId: student.id,
      date: dateString,
      status: attendanceData[student.id]?.status || "present",
      notes: attendanceData[student.id]?.notes || "",
    }))

    onRecordAttendance(records)
    setAttendanceData({})
    setIsSaving(false)
  }

  const getStatusIcon = (status: "present" | "absent" | "late") => {
    switch (status) {
      case "present":
        return <UserCheck className="h-4 w-4" />
      case "absent":
        return <UserX className="h-4 w-4" />
      case "late":
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: "present" | "absent" | "late") => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "absent":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      case "late":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
    }
  }

  return (
    <div className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Record Attendance</CardTitle>
        <CardDescription>Mark attendance for your academy students</CardDescription>
      </CardHeader>

      <div className="space-y-6">
        {/* Date Selector */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Select Date:</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {isAlreadyRecorded && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ Attendance has already been recorded for {format(selectedDate, "PPP")}. Recording again will add
              duplicate entries.
            </p>
          </div>
        )}

        {/* Student List */}
        <div className="space-y-4">
          {students.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No students found. Add students first to record attendance.
                </p>
              </CardContent>
            </Card>
          ) : (
            students.map((student) => {
              const currentStatus = attendanceData[student.id]?.status || "present"
              const currentNotes = attendanceData[student.id]?.notes || ""

              return (
                <Card key={student.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{student.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {student.position} • Age {student.age}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {(["present", "late", "absent"] as const).map((status) => (
                            <Button
                              key={status}
                              variant="outline"
                              size="sm"
                              className={cn("capitalize", currentStatus === status && getStatusColor(status))}
                              onClick={() => handleStatusChange(student.id, status)}
                            >
                              {getStatusIcon(status)}
                              <span className="ml-1">{status}</span>
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
                        <Textarea
                          placeholder="Add any notes about this student's attendance..."
                          value={currentNotes}
                          onChange={(e) => handleNotesChange(student.id, e.target.value)}
                          className="resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>

        {/* Save Button */}
        {students.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={handleSaveAttendance} disabled={isSaving} className="min-w-[120px]">
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Save Attendance"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
