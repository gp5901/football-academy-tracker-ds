"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserCheck, UserX, Clock, Search, Calendar } from "lucide-react"
import type { Student, AttendanceRecord } from "@/app/page"

interface AttendanceHistoryProps {
  students: Student[]
  attendanceRecords: AttendanceRecord[]
}

export function AttendanceHistory({ students, attendanceRecords }: AttendanceHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "present" | "absent" | "late">("all")
  const [dateFilter, setDateFilter] = useState("")

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    return student?.name || "Unknown Student"
  }

  const getStatusIcon = (status: "present" | "absent" | "late") => {
    switch (status) {
      case "present":
        return <UserCheck className="h-4 w-4 text-green-600" />
      case "absent":
        return <UserX className="h-4 w-4 text-red-600" />
      case "late":
        return <Clock className="h-4 w-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status: "present" | "absent" | "late") => {
    const colors = {
      present: "bg-green-100 text-green-800",
      absent: "bg-red-100 text-red-800",
      late: "bg-yellow-100 text-yellow-800",
    }

    return (
      <Badge className={colors[status]}>
        <span className="flex items-center gap-1">
          {getStatusIcon(status)}
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </Badge>
    )
  }

  // Filter records based on search and filters
  const filteredRecords = attendanceRecords.filter((record) => {
    const studentName = getStudentName(record.studentId).toLowerCase()
    const matchesSearch = studentName.includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || record.status === statusFilter
    const matchesDate = !dateFilter || record.date === dateFilter

    return matchesSearch && matchesStatus && matchesDate
  })

  // Sort by date (most recent first)
  const sortedRecords = filteredRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Group records by date for better organization
  const groupedRecords = sortedRecords.reduce(
    (groups, record) => {
      const date = record.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(record)
      return groups
    },
    {} as Record<string, AttendanceRecord[]>,
  )

  return (
    <div className="p-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Attendance History</CardTitle>
        <CardDescription>View and search through past attendance records</CardDescription>
      </CardHeader>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="present">Present</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
            <SelectItem value="late">Late</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="pl-10 w-full sm:w-[180px]"
          />
        </div>
      </div>

      {/* Records Display */}
      {attendanceRecords.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No attendance records</p>
              <p className="text-sm text-muted-foreground">Start recording attendance to see history here</p>
            </div>
          </CardContent>
        </Card>
      ) : sortedRecords.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No records found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRecords).map(([date, records]) => (
            <Card key={date}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {new Date(date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </CardTitle>
                <CardDescription>
                  {records.length} student{records.length !== 1 ? "s" : ""} recorded
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{getStudentName(record.studentId)}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{record.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
