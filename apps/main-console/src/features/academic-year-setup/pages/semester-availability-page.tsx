import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Calendar, Plus, Edit, Trash2, Download } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useTablePagination } from "@/hooks/useTablePagination";

// Mock data - expanded for testing scroll behavior
const semesterAvailability = [
  {
    id: 1,
    subject: "Financial Accounting",
    subjectCode: "FA101",
    programCourse: "B.COM (H) - Commerce & Management",
    availableSemesters: ["1st", "2nd"],
    credits: 4,
    isActive: true,
    lastUpdated: "2024-01-15",
  },
  {
    id: 2,
    subject: "Business Mathematics",
    subjectCode: "BM102",
    programCourse: "B.COM (H) - Commerce & Management",
    availableSemesters: ["1st", "3rd"],
    credits: 4,
    isActive: true,
    lastUpdated: "2024-01-20",
  },
  {
    id: 3,
    subject: "Marketing Management",
    subjectCode: "MM201",
    programCourse: "B.COM (H) - Commerce & Management",
    availableSemesters: ["3rd", "4th"],
    credits: 4,
    isActive: true,
    lastUpdated: "2024-01-18",
  },
  {
    id: 4,
    subject: "Corporate Finance",
    subjectCode: "CF301",
    programCourse: "B.COM (H) - Commerce & Management",
    availableSemesters: ["5th", "6th"],
    credits: 4,
    isActive: true,
    lastUpdated: "2024-01-22",
  },
  {
    id: 5,
    subject: "International Business",
    subjectCode: "IB401",
    programCourse: "B.COM (H) - Commerce & Management",
    availableSemesters: ["7th", "8th"],
    credits: 4,
    isActive: false,
    lastUpdated: "2024-01-10",
  },
  {
    id: 6,
    subject: "Human Resource Management",
    subjectCode: "HRM201",
    programCourse: "BBA - Business Administration",
    availableSemesters: ["3rd", "4th"],
    credits: 4,
    isActive: true,
    lastUpdated: "2024-01-25",
  },
  {
    id: 7,
    subject: "Operations Management",
    subjectCode: "OM301",
    programCourse: "BBA - Business Administration",
    availableSemesters: ["5th", "6th"],
    credits: 4,
    isActive: true,
    lastUpdated: "2024-01-28",
  },
  {
    id: 8,
    subject: "Strategic Management",
    subjectCode: "SM401",
    programCourse: "BBA - Business Administration",
    availableSemesters: ["7th", "8th"],
    credits: 4,
    isActive: true,
    lastUpdated: "2024-01-30",
  },
  {
    id: 9,
    subject: "Programming Fundamentals",
    subjectCode: "PF101",
    programCourse: "BCA - Computer Applications",
    availableSemesters: ["1st"],
    credits: 6,
    isActive: true,
    lastUpdated: "2024-01-12",
  },
  {
    id: 10,
    subject: "Data Structures",
    subjectCode: "DS201",
    programCourse: "BCA - Computer Applications",
    availableSemesters: ["3rd", "4th"],
    credits: 6,
    isActive: true,
    lastUpdated: "2024-01-14",
  },
  {
    id: 11,
    subject: "Database Management",
    subjectCode: "DB301",
    programCourse: "BCA - Computer Applications",
    availableSemesters: ["5th"],
    credits: 6,
    isActive: true,
    lastUpdated: "2024-01-16",
  },
  {
    id: 12,
    subject: "Software Engineering",
    subjectCode: "SE401",
    programCourse: "BCA - Computer Applications",
    availableSemesters: ["7th"],
    credits: 6,
    isActive: true,
    lastUpdated: "2024-01-18",
  },
  {
    id: 13,
    subject: "Artificial Intelligence",
    subjectCode: "AI501",
    programCourse: "BCA - Computer Applications",
    availableSemesters: ["7th", "8th"],
    credits: 6,
    isActive: false,
    lastUpdated: "2024-01-08",
  },
  {
    id: 14,
    subject: "Web Development",
    subjectCode: "WD401",
    programCourse: "B.Sc (IT) - Information Technology",
    availableSemesters: ["7th", "8th"],
    credits: 6,
    isActive: true,
    lastUpdated: "2024-01-20",
  },
  {
    id: 15,
    subject: "Mobile App Development",
    subjectCode: "MAD501",
    programCourse: "B.Sc (IT) - Information Technology",
    availableSemesters: ["7th"],
    credits: 6,
    isActive: false,
    lastUpdated: "2024-01-05",
  },
  {
    id: 16,
    subject: "Network Security",
    subjectCode: "NS401",
    programCourse: "B.Sc (IT) - Information Technology",
    availableSemesters: ["7th"],
    credits: 6,
    isActive: true,
    lastUpdated: "2024-01-22",
  },
  {
    id: 17,
    subject: "Cloud Computing",
    subjectCode: "CC501",
    programCourse: "B.Sc (IT) - Information Technology",
    availableSemesters: ["8th"],
    credits: 6,
    isActive: true,
    lastUpdated: "2024-01-24",
  },
  {
    id: 18,
    subject: "Business Ethics",
    subjectCode: "BE201",
    programCourse: "B.COM (H) - Commerce & Management",
    availableSemesters: ["3rd", "4th", "5th"],
    credits: 3,
    isActive: true,
    lastUpdated: "2024-01-26",
  },
  {
    id: 19,
    subject: "Organizational Behavior",
    subjectCode: "OB301",
    programCourse: "BBA - Business Administration",
    availableSemesters: ["5th", "6th"],
    credits: 4,
    isActive: true,
    lastUpdated: "2024-01-28",
  },
  {
    id: 20,
    subject: "Computer Networks",
    subjectCode: "CN301",
    programCourse: "BCA - Computer Applications",
    availableSemesters: ["5th", "6th"],
    credits: 6,
    isActive: true,
    lastUpdated: "2024-01-30",
  },
];

const programCourses = [
  "B.COM (H) - Commerce & Management",
  "BBA - Business Administration",
  "BCA - Computer Applications",
  "B.Sc (IT) - Information Technology",
];

const semesters = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

export default function SemesterAvailabilityPage() {
  const [selectedProgramCourse, setSelectedProgramCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Use table pagination hook
  const tableData = useTablePagination({
    data: semesterAvailability,
    searchFields: ["subject", "subjectCode", "programCourse"],
    initialItemsPerPage: 10,
  });

  // Additional filtering for dropdowns
  const filteredAvailability = tableData.filteredData.filter((item) => {
    const matchesProgramCourse =
      !selectedProgramCourse || selectedProgramCourse === "all" || item.programCourse === selectedProgramCourse;
    const matchesSemester =
      !selectedSemester || selectedSemester === "all" || item.availableSemesters.includes(selectedSemester);

    return matchesProgramCourse && matchesSemester;
  });

  // Update pagination data with additional filters
  const totalItems = filteredAvailability.length;
  const totalPages = Math.ceil(totalItems / tableData.itemsPerPage);
  const startIndex = (tableData.currentPage - 1) * tableData.itemsPerPage;
  const endIndex = startIndex + tableData.itemsPerPage;
  const paginatedAvailability = filteredAvailability.slice(startIndex, endIndex);

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 pb-0">
        <Card className="border-none">
          <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
            <div>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
                Semester Availability
              </CardTitle>
              <div className="text-muted-foreground">
                Configure semester availability for subjects. Define which semesters each subject is available in.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Fixed Filters */}
      <div className="flex-shrink-0 px-4 pb-4">
        <div className="bg-background p-4 border border-gray-200 rounded-lg flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search subjects or codes..."
              className="w-64"
              value={tableData.searchTerm}
              onChange={(e) => tableData.setSearchTerm(e.target.value)}
            />
            <Select
              value={selectedProgramCourse}
              onValueChange={(value) => {
                setSelectedProgramCourse(value);
                tableData.resetToFirstPage();
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Program-Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Program-Courses</SelectItem>
                {programCourses.map((programCourse) => (
                  <SelectItem key={programCourse} value={programCourse}>
                    {programCourse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedSemester}
              onValueChange={(value) => {
                setSelectedSemester(value);
                tableData.resetToFirstPage();
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {semesters.map((semester) => (
                  <SelectItem key={semester} value={semester}>
                    {semester}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Table with Fixed Header */}
      <div className="flex-1 px-4 min-h-0">
        <Card className="h-full flex flex-col">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Fixed Header */}
            <div className="flex-shrink-0 border-b-2 border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Subject</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Code</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Program-Course</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Available Semesters</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Credits</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Last Updated</TableHead>
                    <TableHead className="text-right bg-gray-100 font-semibold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-auto">
              <Table>
                <TableBody>
                  {paginatedAvailability.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.subject}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.subjectCode}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{item.programCourse}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.availableSemesters.map((semester, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {semester}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
                          {item.credits}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            item.isActive
                              ? "border-green-500 text-green-700 bg-green-50"
                              : "border-red-500 text-red-700 bg-red-50"
                          }
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(item.lastUpdated).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Pagination at Bottom */}
      <div className="flex-shrink-0 p-4 pt-0">
        <Pagination
          currentPage={tableData.currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={tableData.itemsPerPage}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={tableData.setCurrentPage}
          onItemsPerPageChange={tableData.setItemsPerPage}
          sticky={false}
        />
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Semester Availability</DialogTitle>
            <DialogDescription>Configure semester availability for a subject.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="e.g., Financial Accounting" />
            </div>
            <div>
              <Label htmlFor="subjectCode">Subject Code</Label>
              <Input id="subjectCode" placeholder="e.g., FA101" />
            </div>
            <div>
              <Label htmlFor="programCourse">Program-Course</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Program-Course" />
                </SelectTrigger>
                <SelectContent>
                  {programCourses.map((programCourse) => (
                    <SelectItem key={programCourse} value={programCourse}>
                      {programCourse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="credits">Credits</Label>
              <Input id="credits" type="number" placeholder="4" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="availableSemesters">Available Semesters</Label>
              <Input id="availableSemesters" placeholder="e.g., 1st, 2nd, 3rd" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="isActive">Active Status</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Switch id="isActive" />
                <Label htmlFor="isActive">Enable this availability</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddDialogOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Availability
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
