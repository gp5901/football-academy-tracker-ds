"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, User, Lock } from "lucide-react"
import type { Coach } from "@/app/page"

interface LoginFormProps {
  onLogin: (coach: Coach) => void
}

// Mock coaches data - in real app this would come from database
const mockCoaches: Coach[] = [
  {
    id: "1",
    username: "coach_u12",
    name: "John Smith",
    ageGroup: "U12",
    email: "john.smith@academy.com",
  },
  {
    id: "2",
    username: "coach_u14",
    name: "Sarah Johnson",
    ageGroup: "U14",
    email: "sarah.johnson@academy.com",
  },
  {
    id: "3",
    username: "coach_u16",
    name: "Mike Wilson",
    ageGroup: "U16",
    email: "mike.wilson@academy.com",
  },
]

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock authentication - in real app this would be API call
    const coach = mockCoaches.find((c) => c.username === username)

    if (coach && password === "password123") {
      // Generate mock JWT token
      const token = `mock-jwt-${coach.id}-${Date.now()}`
      localStorage.setItem("coach-token", token)
      onLogin(coach)
    } else {
      setError("Invalid username or password")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Football Academy</CardTitle>
          <CardDescription>Coach Login Portal</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Demo Credentials:</p>
            <div className="text-xs text-blue-700 space-y-1">
              <p>
                <strong>U12 Coach:</strong> coach_u12 / password123
              </p>
              <p>
                <strong>U14 Coach:</strong> coach_u14 / password123
              </p>
              <p>
                <strong>U16 Coach:</strong> coach_u16 / password123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
