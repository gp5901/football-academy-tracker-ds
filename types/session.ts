export interface Session {
  id: string
  date: string
  timeSlot: "morning" | "evening"
  ageGroup: string
  coachId: string
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  groupPhotoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface AttendanceRecord {
  id: string
  sessionId: string
  playerId: string
  status: "present_regular" | "present_complimentary" | "absent"
  notes?: string
  timestamp: string
}

export interface SessionWithAttendance extends Session {
  attendance: AttendanceRecord[]
  totalPlayers: number
  presentCount: number
  absentCount: number
}
