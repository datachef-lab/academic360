// import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

const dummyStudents = [
  {
    name: "Priya Sharma",
    appNo: "APP2024001",
    course: "B.Sc. Physics",
    status: "Validated",
  },
  {
    name: "Rajesh Patel",
    appNo: "APP2024002",
    course: "B.Com. Accounting",
    status: "Pending",
  },
  {
    name: "Anjali Desai",
    appNo: "APP2024003",
    course: "B.A. English",
    status: "Validated",
  },
];

export default function FinalAdmissionPushPage() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Final Admission Push</CardTitle>
            <p className="text-gray-500 text-sm mt-1">Review validated students and push their records to the IRP system.</p>
          </div>
          <Button variant="outline">Push All</Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <Input placeholder="Search by student or application no." className="w-64" />
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                <SelectItem value="bsc">B.Sc. Physics</SelectItem>
                <SelectItem value="bcom">B.Com. Accounting</SelectItem>
                <SelectItem value="ba">B.A. English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Application No</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dummyStudents.map((student, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.appNo}</TableCell>
                    <TableCell>{student.course}</TableCell>
                    <TableCell>
                      <span className={student.status === "Validated" ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
                        {student.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">View</Button>
                      <Button size="sm" className="ml-2">Push</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
