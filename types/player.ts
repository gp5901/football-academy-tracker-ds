export interface Player {
  id: string
  name: string
  ageGroup: string
  bookedSessions: number
  maxComplimentary: number
  trainingCompleted: number
  joinDate: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface PlayerWithStats extends Player {
  totalSessionsAttended: number
  regularSessionsUsed: number
  complimentarySessionsUsed: number
  remainingSessions: number
  attendanceRate: number
  lastAttendance?: string
}
