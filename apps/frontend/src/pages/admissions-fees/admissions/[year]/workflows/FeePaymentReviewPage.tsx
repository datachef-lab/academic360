import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

const dummyPayments = [
  {
    name: "Priya Sharma",
    appNo: "APP2024001",
    course: "B.Sc. Physics",
    amount: "₹12,000",
    status: "Paid",
    date: "2024-07-10",
  },
  {
    name: "Rajesh Patel",
    appNo: "APP2024002",
    course: "B.Com. Accounting",
    amount: "₹10,500",
    status: "Pending",
    date: "2024-07-11",
  },
  {
    name: "Anjali Desai",
    appNo: "APP2024003",
    course: "B.A. English",
    amount: "₹11,000",
    status: "Failed",
    date: "2024-07-12",
  },
];

export default function FeePaymentReviewPage() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Fee Payment Review</CardTitle>
            <p className="text-gray-500 text-sm mt-1">Review and manage all fee payment records for admissions.</p>
          </div>
          <Button variant="outline">Export</Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <Input placeholder="Search by student or application no." className="w-64" />
            <Select>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
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
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dummyPayments.map((payment, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{payment.name}</TableCell>
                    <TableCell>{payment.appNo}</TableCell>
                    <TableCell>{payment.course}</TableCell>
                    <TableCell>{payment.amount}</TableCell>
                    <TableCell>
                      <span className={
                        payment.status === "Paid"
                          ? "text-green-600 font-medium"
                          : payment.status === "Pending"
                          ? "text-yellow-600 font-medium"
                          : "text-red-600 font-medium"
                      }>
                        {payment.status}
                      </span>
                    </TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">View</Button>
                      <Button size="sm" className="ml-2">Download</Button>
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
