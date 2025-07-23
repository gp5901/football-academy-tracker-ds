"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { BarChart, TrendingUp, Users, Calendar, Award, AlertTriangle } from "lucide-react"
import type { Student, AttendanceRecord } from "@/app/page"

interface AttendanceStatsProps {
  students: Student[]
  attendanceRecords: AttendanceRecord[]
}

export function AttendanceStats({ students, attendanceRecords }: AttendanceStatsProps) {
  // Calculate overall statistics
  const totalRecords = attendanceRecords.length
  const presentRecords = attendanceRecords.filter((r) => r.status === "present").length
  const absentRecords = attendanceRecords.filter((r) => r.status === "absent").length
  const lateRecords = attendanceRecords.filter((r) => r.status === "late").length

  const overallAttendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0
  const lateRate = totalRecords > 0 ? (lateRecords / totalRecords) * 100 : 0
  const absentRate = totalRecords > 0 ? (absentRecords / totalRecords) * 100 : 0

  // Get unique dates to calculate session count
  const uniqueDates = [...new Set(attendanceRecords.map((r) => r.date))].length

  // Calculate individual student statistics
  const studentStats = students
    .map((student) => {
      const studentRecords = attendanceRecords.filter((r) => r.studentId === student.id)
      const studentPresent = studentRecords.filter((r) => r.status === "present").length
      const studentLate = studentRecords.filter((r) => r.status === "late").length
      const studentAbsent = studentRecords.filter((r) => r.status === "absent").length
      const studentTotal = studentRecords.length

      const attendanceRate = studentTotal > 0 ? (studentPresent / studentTotal) * 100 : 0

      return {
        ...student,
        totalSessions: studentTotal,
        presentCount: studentPresent,
        lateCount: studentLate,
        absentCount: studentAbsent,
        attendanceRate,
      }
    })
    .sort((a, b) => b.attendanceRate - a.attendanceRate)

  // Find best and worst performers
  const bestPerformer = studentStats[0]
  const worstPerformer = studentStats[studentStats.length - 1]

  // Get recent attendance trend (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - i)
    return date.toISOString().split("T")[0]
  }).reverse()

  const recentTrend = last7Days.map((date) => {
    const dayRecords = attendanceRecords.filter((r) => r.date === date)
    const dayPresent = dayRecords.filter((r) => r.status === "present").length
    const dayTotal = dayRecords.length
    return {
      date,
      rate: dayTotal > 0 ? (dayPresent / dayTotal) * 100 : 0,
      total: dayTotal,
    }
  })

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600"
    if (rate >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (rate >= 75) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Improvement</Badge>
  }

  return (
    <div className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Attendance Statistics</CardTitle>
        <CardDescription>Comprehensive overview of attendance patterns and performance</CardDescription>
      </CardHeader>

      <div className="space-y-6">
        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overall Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overallAttendanceRate.toFixed(1)}%</div>
              <Progress value={overallAttendanceRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueDates}</div>
              <p className="text-xs text-muted-foreground mt-1">{totalRecords} total records</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lateRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">{lateRecords} late arrivals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent Rate</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{absentRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">{absentRecords} absences</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Performers */}
        {bestPerformer && worstPerformer && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Best Performer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{bestPerformer.name}</p>
                    <p className="text-sm text-muted-foreground">{bestPerformer.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">{bestPerformer.attendanceRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {bestPerformer.presentCount}/{bestPerformer.totalSessions} sessions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Needs Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{worstPerformer.name}</p>
                    <p className="text-sm text-muted-foreground">{worstPerformer.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{worstPerformer.attendanceRate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {worstPerformer.presentCount}/{worstPerformer.totalSessions} sessions
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Individual Student Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Individual Performance
            </CardTitle>
            <CardDescription>Attendance rates for each student</CardDescription>
          </CardHeader>
          <CardContent>
            {studentStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No student data available</p>
            ) : (
              <div className="space-y-4">
                {studentStats.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.position} • {student.totalSessions} sessions
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getPerformanceColor(student.attendanceRate)}`}>
                          {student.attendanceRate.toFixed(1)}%
                        </p>
                        <div className="flex gap-1 text-xs text-muted-foreground">
                          <span>P: {student.presentCount}</span>
                          <span>L: {student.lateCount}</span>
                          <span>A: {student.absentCount}</span>
                        </div>
                      </div>
                      {getPerformanceBadge(student.attendanceRate)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Trend */}
        <Card>
          <CardHeader>
            <CardTitle>7-Day Attendance Trend</CardTitle>
            <CardDescription>Daily attendance rates for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTrend.map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {day.total} student{day.total !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <Progress value={day.rate} />
                    </div>
                    <span className="font-semibold min-w-[50px] text-right">
                      {day.total > 0 ? `${day.rate.toFixed(0)}%` : "N/A"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
