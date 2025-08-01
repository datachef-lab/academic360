
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

const dummyDocs = [
  {
    name: "Priya Sharma",
    appNo: "APP2024001",
    course: "B.Sc. Physics",
    docType: "Marksheet",
    status: "Pending",
  },
  {
    name: "Rajesh Patel",
    appNo: "APP2024002",
    course: "B.Com. Accounting",
    docType: "Caste Certificate",
    status: "Verified",
  },
  {
    name: "Anjali Desai",
    appNo: "APP2024003",
    course: "B.A. English",
    docType: "Photo ID",
    status: "Rejected",
  },
];

export default function DocumentVerificationPage() {
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Document Verification</CardTitle>
            <p className="text-gray-500 text-sm mt-1">View, filter, and verify submitted student documents.</p>
          </div>
          <Button variant="outline">Bulk Verify</Button>
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
                  <TableHead>Document Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dummyDocs.map((doc, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{doc.name}</TableCell>
                    <TableCell>{doc.appNo}</TableCell>
                    <TableCell>{doc.course}</TableCell>
                    <TableCell>{doc.docType}</TableCell>
                    <TableCell>
                      <span className={
                        doc.status === "Verified"
                          ? "text-green-600 font-medium"
                          : doc.status === "Pending"
                          ? "text-yellow-600 font-medium"
                          : "text-red-600 font-medium"
                      }>
                        {doc.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">View</Button>
                      <Button size="sm" className="ml-2">Verify</Button>
                      <Button size="sm" className="ml-2" variant="destructive">Reject</Button>
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
