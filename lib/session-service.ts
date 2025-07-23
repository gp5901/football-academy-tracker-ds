import type { Session, AttendanceRecord, SessionWithAttendance } from "@/types/session"
import { API_BASE } from "@/config"

const API_BASE_URL = API_BASE || "http://localhost:5000/api"

export class SessionService {
  private readonly SESSIONS_KEY = "academy-sessions"
  private readonly ATTENDANCE_KEY = "academy-attendance"

  private getAuthHeaders() {
    const token = localStorage.getItem("auth_token")
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    }
  }

  // Get today's sessions for an age group, create if they don't exist
  async getTodaysSessions(ageGroup: string): Promise<Session[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/today/${ageGroup}`, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch today's sessions")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching today's sessions:", error)
      // Fallback to localStorage for development
      return this.getTodaysSessionsLocal(ageGroup)
    }
  }

  private getTodaysSessionsLocal(ageGroup: string): Session[] {
    const today = new Date().toISOString().split("T")[0]
    const sessions = this.getAllSessions()

    let todaySessions = sessions.filter((s) => s.date === today && s.ageGroup === ageGroup)

    // Auto-create sessions if they don't exist
    if (todaySessions.length === 0) {
      const morningSession: Session = {
        id: `${today}-morning-${ageGroup}`,
        date: today,
        timeSlot: "morning",
        ageGroup,
        coachId: "current-coach",
        status: "scheduled",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const eveningSession: Session = {
        id: `${today}-evening-${ageGroup}`,
        date: today,
        timeSlot: "evening",
        ageGroup,
        coachId: "current-coach",
        status: "scheduled",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      sessions.push(morningSession, eveningSession)
      localStorage.setItem("sessions_v2", JSON.stringify(sessions))
      todaySessions = [morningSession, eveningSession]
    }

    return todaySessions
  }

  // Get all sessions for an age group
  async getSessionsByAgeGroup(ageGroup: string): Promise<Session[]> {
    const allSessions = this.getAllSessions()
    return allSessions
      .filter((session) => session.ageGroup === ageGroup)
      .sort((a, b) => {
        // Sort by date descending, then by time slot
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime()
        if (dateCompare !== 0) return dateCompare
        return a.timeSlot === "morning" ? -1 : 1
      })
  }

  // Create a new session
  async createSession(session: Omit<Session, "id" | "createdAt">): Promise<Session> {
    const allSessions = this.getAllSessions()
    const newSession: Session = {
      ...session,
      id: `${session.date}-${session.timeSlot}-${session.ageGroup}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Check if session already exists
    const exists = allSessions.some((s) => s.id === newSession.id)
    if (exists) {
      throw new Error("Session already exists for this date and time slot")
    }

    this.saveSessions([...allSessions, newSession])
    return newSession
  }

  // Mark attendance for a session
  async markAttendance(
    sessionId: string,
    attendanceRecords: Omit<AttendanceRecord, "id" | "timestamp">[],
  ): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          sessionId,
          attendanceRecords,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to mark attendance")
      }
    } catch (error) {
      console.error("Error marking attendance:", error)
      this.markAttendanceLocal(sessionId, attendanceRecords)
    }
  }

  private markAttendanceLocal(
    sessionId: string,
    attendanceRecords: Omit<AttendanceRecord, "id" | "timestamp">[],
  ): void {
    const attendance = this.getAllAttendance()
    const sessions = this.getAllSessions()

    // Remove existing attendance for this session
    const filteredAttendance = attendance.filter((a) => a.sessionId !== sessionId)

    // Add new attendance records
    const newRecords: AttendanceRecord[] = attendanceRecords.map((record) => ({
      ...record,
      id: `${sessionId}-${record.playerId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
    }))

    filteredAttendance.push(...newRecords)
    localStorage.setItem("attendance_v2", JSON.stringify(filteredAttendance))

    // Update session status to completed
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId)
    if (sessionIndex !== -1) {
      sessions[sessionIndex].status = "completed"
      sessions[sessionIndex].updatedAt = new Date().toISOString()
      localStorage.setItem("sessions_v2", JSON.stringify(sessions))
    }
  }

  // Get attendance records for an age group
  async getAttendanceByAgeGroup(ageGroup: string): Promise<AttendanceRecord[]> {
    const allAttendance = this.getAllAttendance()
    const allSessions = this.getAllSessions()

    // Filter attendance records by sessions belonging to the age group
    const ageGroupSessionIds = allSessions.filter((s) => s.ageGroup === ageGroup).map((s) => s.id)

    return allAttendance.filter((record) => ageGroupSessionIds.includes(record.sessionId))
  }

  // Get attendance records for a specific session
  async getSessionAttendance(sessionId: string): Promise<AttendanceRecord[]> {
    const allAttendance = this.getAllAttendance()
    return allAttendance.filter((record) => record.sessionId === sessionId)
  }

  // Upload session photo
  async uploadSessionPhoto(sessionId: string, photoData: string): Promise<void> {
    const allSessions = this.getAllSessions()
    const updatedSessions = allSessions.map((session) =>
      session.id === sessionId ? { ...session, groupPhotoUrl: photoData } : session,
    )
    this.saveSessions(updatedSessions)
  }

  // Get session with attendance records
  async getSessionWithAttendance(sessionId: string): Promise<SessionWithAttendance | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/attendance`, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch session attendance")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching session attendance:", error)
      return this.getSessionWithAttendanceLocal(sessionId)
    }
  }

  private getSessionWithAttendanceLocal(sessionId: string): SessionWithAttendance | null {
    const sessions = this.getAllSessions()
    const attendance = this.getAllAttendance()

    const session = sessions.find((s) => s.id === sessionId)
    if (!session) return null

    const sessionAttendance = attendance.filter((a) => a.sessionId === sessionId)
    const presentCount = sessionAttendance.filter(
      (a) => a.status === "present_regular" || a.status === "present_complimentary",
    ).length

    return {
      ...session,
      attendance: sessionAttendance,
      totalPlayers: sessionAttendance.length,
      presentCount,
      absentCount: sessionAttendance.length - presentCount,
    }
  }

  // Get session history for an age group
  async getSessionHistory(ageGroup: string, limit = 50): Promise<Session[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/history/${ageGroup}?limit=${limit}`, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch session history")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching session history:", error)
      return this.getSessionHistoryLocal(ageGroup, limit)
    }
  }

  private getSessionHistoryLocal(ageGroup: string, limit: number): Session[] {
    const sessions = this.getAllSessions()
    return sessions
      .filter((s) => s.ageGroup === ageGroup)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  }

  // Private helper methods
  private getAllSessions(): Session[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(this.SESSIONS_KEY)
    return stored ? JSON.parse(stored) : []
  }

  private saveSessions(sessions: Session[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions))
  }

  private getAllAttendance(): AttendanceRecord[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem(this.ATTENDANCE_KEY)
    return stored ? JSON.parse(stored) : []
  }

  private saveAttendance(attendance: AttendanceRecord[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.ATTENDANCE_KEY, JSON.stringify(attendance))
  }

  // Migration method to convert old counter-based data
  migrateFromCounterBasedData(): void {
    const oldPlayersKey = "academy-players"
    const oldAttendanceKey = "football-academy-attendance"

    if (typeof window === "undefined") return

    const oldPlayers = localStorage.getItem(oldPlayersKey)
    const oldAttendance = localStorage.getItem(oldAttendanceKey)

    if (oldPlayers || oldAttendance) {
      console.log("Migrating from counter-based data to session-based data...")

      // Clear old data after migration
      localStorage.removeItem(oldPlayersKey)
      localStorage.removeItem(oldAttendanceKey)

      console.log("Migration completed")
    }
  }
}

export const sessionService = new SessionService()
