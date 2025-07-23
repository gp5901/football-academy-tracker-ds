import type { Player, PlayerWithStats } from "@/types/player"
import type { AttendanceRecord } from "@/types/session"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

class PlayerService {
  private getAuthHeaders() {
    const token = localStorage.getItem("auth_token")
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    }
  }

  async getPlayers(ageGroup: string): Promise<Player[]> {
    try {
      const response = await fetch(`${API_BASE}/players/${ageGroup}`, {
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch players")
      }

      return await response.json()
    } catch (error) {
      console.error("Error fetching players:", error)
      return this.getPlayersLocal(ageGroup)
    }
  }

  private getPlayersLocal(ageGroup: string): Player[] {
    try {
      const players = JSON.parse(localStorage.getItem("players_v2") || "[]")
      return players.filter((p: Player) => p.ageGroup === ageGroup)
    } catch {
      return []
    }
  }

  async getPlayerWithStats(playerId: string): Promise<PlayerWithStats | null> {
    try {
      const players = await this.getPlayers("") // Get all players first
      const player = players.find((p) => p.id === playerId)

      if (!player) return null

      const attendance = this.getStoredAttendance()
      const playerAttendance = attendance.filter((a) => a.playerId === playerId)

      const regularSessionsUsed = playerAttendance.filter((a) => a.status === "present_regular").length
      const complimentarySessionsUsed = playerAttendance.filter((a) => a.status === "present_complimentary").length
      const totalSessionsAttended = regularSessionsUsed + complimentarySessionsUsed
      const totalRecords = playerAttendance.length
      const attendanceRate = totalRecords > 0 ? (totalSessionsAttended / totalRecords) * 100 : 0
      const remainingSessions = Math.max(0, player.bookedSessions - regularSessionsUsed)

      const lastAttendanceRecord = playerAttendance
        .filter((a) => a.status !== "absent")
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

      return {
        ...player,
        totalSessionsAttended,
        regularSessionsUsed,
        complimentarySessionsUsed,
        remainingSessions,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        lastAttendance: lastAttendanceRecord?.timestamp,
      }
    } catch (error) {
      console.error("Error getting player stats:", error)
      return null
    }
  }

  async createPlayer(playerData: Omit<Player, "id" | "createdAt" | "updatedAt">): Promise<Player> {
    try {
      const response = await fetch(`${API_BASE}/players`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(playerData),
      })

      if (!response.ok) {
        throw new Error("Failed to create player")
      }

      return await response.json()
    } catch (error) {
      console.error("Error creating player:", error)
      return this.createPlayerLocal(playerData)
    }
  }

  private createPlayerLocal(playerData: Omit<Player, "id" | "createdAt" | "updatedAt">): Player {
    const players = this.getStoredPlayers()
    const newPlayer: Player = {
      ...playerData,
      id: `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    players.push(newPlayer)
    localStorage.setItem("players_v2", JSON.stringify(players))
    return newPlayer
  }

  async updatePlayer(playerId: string, updates: Partial<Player>): Promise<Player | null> {
    try {
      const response = await fetch(`${API_BASE}/players/${playerId}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error("Failed to update player")
      }

      return await response.json()
    } catch (error) {
      console.error("Error updating player:", error)
      return this.updatePlayerLocal(playerId, updates)
    }
  }

  private updatePlayerLocal(playerId: string, updates: Partial<Player>): Player | null {
    const players = this.getStoredPlayers()
    const playerIndex = players.findIndex((p) => p.id === playerId)

    if (playerIndex === -1) return null

    players[playerIndex] = {
      ...players[playerIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    localStorage.setItem("players_v2", JSON.stringify(players))
    return players[playerIndex]
  }

  async deletePlayer(playerId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE}/players/${playerId}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error("Failed to delete player")
      }
    } catch (error) {
      console.error("Error deleting player:", error)
      this.deletePlayerLocal(playerId)
    }
  }

  private deletePlayerLocal(playerId: string): void {
    const players = this.getStoredPlayers()
    const filteredPlayers = players.filter((p) => p.id !== playerId)
    localStorage.setItem("players_v2", JSON.stringify(filteredPlayers))

    // Also remove attendance records for this player
    const attendance = this.getStoredAttendance()
    const filteredAttendance = attendance.filter((a) => a.playerId !== playerId)
    localStorage.setItem("attendance_v2", JSON.stringify(filteredAttendance))
  }

  private getStoredPlayers(): Player[] {
    try {
      return JSON.parse(localStorage.getItem("players_v2") || "[]")
    } catch {
      return []
    }
  }

  private getStoredAttendance(): AttendanceRecord[] {
    try {
      return JSON.parse(localStorage.getItem("attendance_v2") || "[]")
    } catch {
      return []
    }
  }

  // Migration method to convert old player data
  migrateFromCounterBasedData(): void {
    const oldPlayers = localStorage.getItem("players")

    if (!oldPlayers || localStorage.getItem("players_migration_completed_v2")) {
      return // Already migrated or no old data
    }

    try {
      const oldPlayersData: any[] = JSON.parse(oldPlayers)
      const newPlayers: Player[] = oldPlayersData.map((oldPlayer) => ({
        id: oldPlayer.id || `migrated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: oldPlayer.name,
        ageGroup: oldPlayer.ageGroup,
        bookedSessions: oldPlayer.bookedSessions || 12,
        maxComplimentary: oldPlayer.maxComplimentary || 3,
        trainingCompleted: oldPlayer.trainingCompleted || 0,
        joinDate: oldPlayer.joinDate || new Date().toISOString().split("T")[0],
        notes: oldPlayer.notes || "",
        createdAt: oldPlayer.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }))

      localStorage.setItem("players_v2", JSON.stringify(newPlayers))
      localStorage.setItem("players_migration_completed_v2", "true")

      console.log("Player migration completed successfully")
    } catch (error) {
      console.error("Player migration failed:", error)
    }
  }
}

export const playerService = new PlayerService()
