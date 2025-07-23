"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { playerService } from "@/lib/player-service"
import type { PlayerWithStats } from "@/types/player"
import { Plus, Edit, Trash2, User, BookOpen, Gift } from "lucide-react"

interface PlayerManagerProps {
  ageGroup: string
  onPlayersChanged?: () => void
}

interface PlayerFormData {
  name: string
  bookedSessions: number
  maxComplimentary: number
  trainingCompleted: number
  joinDate: string
  notes: string
}

export function PlayerManager({ ageGroup, onPlayersChanged }: PlayerManagerProps) {
  const [players, setPlayers] = useState<PlayerWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<PlayerWithStats | null>(null)
  const [formData, setFormData] = useState<PlayerFormData>({
    name: "",
    bookedSessions: 12,
    maxComplimentary: 3,
    trainingCompleted: 0,
    joinDate: new Date().toISOString().split("T")[0],
    notes: "",
  })
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    loadPlayers()
  }, [ageGroup])

  const loadPlayers = async () => {
    setIsLoading(true)
    try {
      const playersData = await playerService.getPlayers(ageGroup)
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
      console.error("Error loading players:", error)
      setMessage({ type: "error", text: "Failed to load players" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    try {
      if (editingPlayer) {
        await playerService.updatePlayer(editingPlayer.id, {
          ...formData,
          ageGroup,
        })
        setMessage({ type: "success", text: "Player updated successfully!" })
      } else {
        await playerService.createPlayer({
          ...formData,
          ageGroup,
        })
        setMessage({ type: "success", text: "Player created successfully!" })
      }

      setIsDialogOpen(false)
      setEditingPlayer(null)
      resetForm()
      await loadPlayers()
      onPlayersChanged?.()
    } catch (error) {
      console.error("Error saving player:", error)
      setMessage({ type: "error", text: "Failed to save player. Please try again." })
    }
  }

  const handleEdit = (player: PlayerWithStats) => {
    setEditingPlayer(player)
    setFormData({
      name: player.name,
      bookedSessions: player.bookedSessions,
      maxComplimentary: player.maxComplimentary,
      trainingCompleted: player.trainingCompleted,
      joinDate: player.joinDate,
      notes: player.notes,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (playerId: string) => {
    if (!confirm("Are you sure you want to delete this player? This action cannot be undone.")) {
      return
    }

    try {
      await playerService.deletePlayer(playerId)
      setMessage({ type: "success", text: "Player deleted successfully!" })
      await loadPlayers()
      onPlayersChanged?.()
    } catch (error) {
      console.error("Error deleting player:", error)
      setMessage({ type: "error", text: "Failed to delete player. Please try again." })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      bookedSessions: 12,
      maxComplimentary: 3,
      trainingCompleted: 0,
      joinDate: new Date().toISOString().split("T")[0],
      notes: "",
    })
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingPlayer(null)
    resetForm()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading players...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Player Management ({ageGroup})
            </CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingPlayer(null)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Player
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingPlayer ? "Edit Player" : "Add New Player"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Player Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="bookedSessions">Booked Sessions</Label>
                      <Input
                        id="bookedSessions"
                        type="number"
                        min="0"
                        value={formData.bookedSessions}
                        onChange={(e) =>
                          setFormData({ ...formData, bookedSessions: Number.parseInt(e.target.value) || 0 })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxComplimentary">Max Complimentary</Label>
                      <Input
                        id="maxComplimentary"
                        type="number"
                        min="0"
                        value={formData.maxComplimentary}
                        onChange={(e) =>
                          setFormData({ ...formData, maxComplimentary: Number.parseInt(e.target.value) || 0 })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="trainingCompleted">Training Completed</Label>
                      <Input
                        id="trainingCompleted"
                        type="number"
                        min="0"
                        value={formData.trainingCompleted}
                        onChange={(e) =>
                          setFormData({ ...formData, trainingCompleted: Number.parseInt(e.target.value) || 0 })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="joinDate">Join Date</Label>
                      <Input
                        id="joinDate"
                        type="date"
                        value={formData.joinDate}
                        onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                      Cancel
                    </Button>
                    <Button type="submit">{editingPlayer ? "Update Player" : "Add Player"}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">Total Players: {players.length}</div>
        </CardContent>
      </Card>

      {/* Players List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => (
          <Card key={player.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{player.name}</CardTitle>
                  <p className="text-sm text-gray-600">Joined: {new Date(player.joinDate).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(player)} className="h-8 w-8 p-0">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(player.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Session Stats */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span>
                    Regular: {player.regularSessionsUsed}/{player.bookedSessions}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Gift className="h-4 w-4 text-purple-600" />
                  <span>
                    Comp: {player.complimentarySessionsUsed}/{player.maxComplimentary}
                  </span>
                </div>
              </div>

              {/* Attendance Rate */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Attendance Rate:</span>
                <Badge
                  variant={
                    player.attendanceRate >= 80 ? "default" : player.attendanceRate >= 60 ? "secondary" : "destructive"
                  }
                >
                  {player.attendanceRate}%
                </Badge>
              </div>

              {/* Remaining Sessions */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Remaining:</span>
                <Badge variant="outline">{player.remainingSessions} sessions</Badge>
              </div>

              {/* Last Attendance */}
              {player.lastAttendance && (
                <div className="text-xs text-gray-500">
                  Last attended: {new Date(player.lastAttendance).toLocaleDateString()}
                </div>
              )}

              {/* Notes */}
              {player.notes && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>Notes:</strong> {player.notes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {players.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Players Found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first player to the {ageGroup} age group.</p>
            <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add First Player
            </Button>
          </CardContent>
        </Card>
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
