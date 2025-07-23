"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Plus, Edit, Trash2, User, Calendar, Award, BookOpen, FileText } from "lucide-react"
import type { Player, Coach } from "@/app/page"

interface PlayerManagerProps {
  players: Player[]
  coach: Coach
  onAddPlayer: (player: Omit<Player, "id">) => void
  onUpdatePlayer: (id: string, player: Omit<Player, "id">) => void
  onDeletePlayer: (id: string) => void
}

export function PlayerManager({ players, coach, onAddPlayer, onUpdatePlayer, onDeletePlayer }: PlayerManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    ageGroup: coach.ageGroup,
    bookedSessions: "12",
    usedSessions: "0",
    complimentarySessions: "0",
    maxComplimentary: "3",
    joinDate: "",
    trainingCompleted: "0",
    notes: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      ageGroup: coach.ageGroup,
      bookedSessions: "12",
      usedSessions: "0",
      complimentarySessions: "0",
      maxComplimentary: "3",
      joinDate: "",
      trainingCompleted: "0",
      notes: "",
    })
  }

  const handleAddPlayer = () => {
    if (formData.name && formData.joinDate) {
      onAddPlayer({
        name: formData.name,
        ageGroup: formData.ageGroup,
        bookedSessions: Number.parseInt(formData.bookedSessions),
        usedSessions: Number.parseInt(formData.usedSessions),
        complimentarySessions: Number.parseInt(formData.complimentarySessions),
        maxComplimentary: Number.parseInt(formData.maxComplimentary),
        joinDate: formData.joinDate,
        trainingCompleted: Number.parseInt(formData.trainingCompleted),
        notes: formData.notes,
      })
      resetForm()
      setIsAddDialogOpen(false)
    }
  }

  const handleEditPlayer = () => {
    if (editingPlayer && formData.name && formData.joinDate) {
      onUpdatePlayer(editingPlayer.id, {
        name: formData.name,
        ageGroup: formData.ageGroup,
        bookedSessions: Number.parseInt(formData.bookedSessions),
        usedSessions: Number.parseInt(formData.usedSessions),
        complimentarySessions: Number.parseInt(formData.complimentarySessions),
        maxComplimentary: Number.parseInt(formData.maxComplimentary),
        joinDate: formData.joinDate,
        trainingCompleted: Number.parseInt(formData.trainingCompleted),
        notes: formData.notes,
      })
      resetForm()
      setIsEditDialogOpen(false)
      setEditingPlayer(null)
    }
  }

  const openEditDialog = (player: Player) => {
    setEditingPlayer(player)
    setFormData({
      name: player.name,
      ageGroup: player.ageGroup,
      bookedSessions: player.bookedSessions.toString(),
      usedSessions: player.usedSessions.toString(),
      complimentarySessions: player.complimentarySessions.toString(),
      maxComplimentary: player.maxComplimentary.toString(),
      joinDate: player.joinDate,
      trainingCompleted: player.trainingCompleted?.toString() || "0",
      notes: player.notes || "",
    })
    setIsEditDialogOpen(true)
  }

  const getTrainingProgress = (player: Player) => {
    const completed = player.trainingCompleted || 0
    const total = player.usedSessions
    return total > 0 ? (completed / total) * 100 : 0
  }

  const getPerformanceColor = (progress: number) => {
    if (progress >= 90) return "text-green-600"
    if (progress >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Players</h2>
          <p className="text-muted-foreground">Add, edit, or remove players from your {coach.ageGroup} group</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Player
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Player</DialogTitle>
              <DialogDescription>
                Enter the details for the new player in your {coach.ageGroup} group.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Player Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter player name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="joinDate">Join Date *</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, joinDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="bookedSessions">Booked Sessions</Label>
                  <Input
                    id="bookedSessions"
                    type="number"
                    value={formData.bookedSessions}
                    onChange={(e) => setFormData((prev) => ({ ...prev, bookedSessions: e.target.value }))}
                    min="1"
                    max="50"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="usedSessions">Used Sessions</Label>
                  <Input
                    id="usedSessions"
                    type="number"
                    value={formData.usedSessions}
                    onChange={(e) => setFormData((prev) => ({ ...prev, usedSessions: e.target.value }))}
                    min="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="trainingCompleted">Training Completed</Label>
                  <Input
                    id="trainingCompleted"
                    type="number"
                    value={formData.trainingCompleted}
                    onChange={(e) => setFormData((prev) => ({ ...prev, trainingCompleted: e.target.value }))}
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="complimentarySessions">Complimentary Used</Label>
                  <Input
                    id="complimentarySessions"
                    type="number"
                    value={formData.complimentarySessions}
                    onChange={(e) => setFormData((prev) => ({ ...prev, complimentarySessions: e.target.value }))}
                    min="0"
                    max="3"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxComplimentary">Max Complimentary</Label>
                  <Input
                    id="maxComplimentary"
                    type="number"
                    value={formData.maxComplimentary}
                    onChange={(e) => setFormData((prev) => ({ ...prev, maxComplimentary: e.target.value }))}
                    min="0"
                    max="5"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add notes about the player's progress, skills, areas for improvement..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPlayer}>Add Player</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Players List */}
      <div className="space-y-4">
        {players.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">No players in {coach.ageGroup} group</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first player to get started with attendance tracking
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Player
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {players.map((player) => {
              const trainingProgress = getTrainingProgress(player)
              const sessionProgress = (player.usedSessions / player.bookedSessions) * 100
              const complimentaryProgress = (player.complimentarySessions / player.maxComplimentary) * 100

              return (
                <Card key={player.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Player Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {player.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{player.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">{player.ageGroup}</Badge>
                              <Badge variant="outline">Joined: {new Date(player.joinDate).toLocaleDateString()}</Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(player)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeletePlayer(player.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Progress Bars */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Sessions</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>
                                {player.usedSessions} / {player.bookedSessions}
                              </span>
                              <span>{sessionProgress.toFixed(0)}%</span>
                            </div>
                            <Progress value={sessionProgress} className="h-2" />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Training Completed</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>
                                {player.trainingCompleted || 0} / {player.usedSessions}
                              </span>
                              <span className={getPerformanceColor(trainingProgress)}>
                                {trainingProgress.toFixed(0)}%
                              </span>
                            </div>
                            <Progress value={trainingProgress} className="h-2" />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Complimentary</span>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>
                                {player.complimentarySessions} / {player.maxComplimentary}
                              </span>
                              <span>{complimentaryProgress.toFixed(0)}%</span>
                            </div>
                            <Progress value={complimentaryProgress} className="h-2" />
                          </div>
                        </div>
                      </div>

                      {/* Notes Section */}
                      {player.notes && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Coach Notes</span>
                          </div>
                          <p className="text-sm text-blue-800">{player.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>Update the player's information and training progress.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Player Name *</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter player name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-joinDate">Join Date *</Label>
                <Input
                  id="edit-joinDate"
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, joinDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-bookedSessions">Booked Sessions</Label>
                <Input
                  id="edit-bookedSessions"
                  type="number"
                  value={formData.bookedSessions}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bookedSessions: e.target.value }))}
                  min="1"
                  max="50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-usedSessions">Used Sessions</Label>
                <Input
                  id="edit-usedSessions"
                  type="number"
                  value={formData.usedSessions}
                  onChange={(e) => setFormData((prev) => ({ ...prev, usedSessions: e.target.value }))}
                  min="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-trainingCompleted">Training Completed</Label>
                <Input
                  id="edit-trainingCompleted"
                  type="number"
                  value={formData.trainingCompleted}
                  onChange={(e) => setFormData((prev) => ({ ...prev, trainingCompleted: e.target.value }))}
                  min="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-complimentarySessions">Complimentary Used</Label>
                <Input
                  id="edit-complimentarySessions"
                  type="number"
                  value={formData.complimentarySessions}
                  onChange={(e) => setFormData((prev) => ({ ...prev, complimentarySessions: e.target.value }))}
                  min="0"
                  max="3"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-maxComplimentary">Max Complimentary</Label>
                <Input
                  id="edit-maxComplimentary"
                  type="number"
                  value={formData.maxComplimentary}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxComplimentary: e.target.value }))}
                  min="0"
                  max="5"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes about the player's progress, skills, areas for improvement..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPlayer}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
