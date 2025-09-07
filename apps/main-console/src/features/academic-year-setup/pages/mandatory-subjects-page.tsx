import { useState, useMemo } from "react";
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
import { Plus, Edit, Trash2, BookOpen, Download } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

// Mock data
const mandatorySubjects = [
  {
    id: 1,
    programCourse: "B.COM (H) - Commerce & Management",
    subject: "Financial Accounting",
    subjectCode: "FA101",
    classes: ["1st", "2nd"],
    credits: 4,
    isActive: true,
  },
  {
    id: 2,
    programCourse: "B.COM (H) - Commerce & Management",
    subject: "Business Mathematics",
    subjectCode: "BM102",
    classes: ["1st"],
    credits: 4,
    isActive: true,
  },
  {
    id: 3,
    programCourse: "B.COM (H) - Commerce & Management",
    subject: "Principles of Management",
    subjectCode: "PM103",
    classes: ["2nd", "3rd"],
    credits: 4,
    isActive: true,
  },
  {
    id: 4,
    programCourse: "BBA - Business Administration",
    subject: "Marketing Management",
    subjectCode: "MM201",
    classes: ["3rd", "4th"],
    credits: 4,
    isActive: false,
  },
  {
    id: 5,
    programCourse: "BCA - Computer Applications",
    subject: "Programming Fundamentals",
    subjectCode: "PF301",
    classes: ["12th", "1st"],
    credits: 4,
    isActive: true,
  },
  {
    id: 6,
    programCourse: "B.Sc (IT) - Information Technology",
    subject: "Database Management",
    subjectCode: "DB401",
    classes: ["2nd", "3rd", "4th"],
    credits: 4,
    isActive: true,
  },
];

const programCourses = [
  "B.COM (H) - Commerce & Management",
  "BBA - Business Administration",
  "BCA - Computer Applications",
  "B.Sc (IT) - Information Technology",
];

const classes = ["12th", "1st", "2nd", "3rd", "4th", "5th", "6th"];

export default function MandatorySubjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgramCourse, setSelectedProgramCourse] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  // const [editingSubject, setEditingSubject] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter subjects based on search and filters
  const filteredSubjects = useMemo(() => {
    return mandatorySubjects.filter((subject) => {
      const matchesSearch =
        subject.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesProgramCourse =
        !selectedProgramCourse || selectedProgramCourse === "all" || subject.programCourse === selectedProgramCourse;

      const matchesClass = !selectedClass || selectedClass === "all" || subject.classes.includes(selectedClass);

      return matchesSearch && matchesProgramCourse && matchesClass;
    });
  }, [searchTerm, selectedProgramCourse, selectedClass]);

  // Pagination logic
  const totalItems = filteredSubjects.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubjects = filteredSubjects.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 pb-0">
        <Card className="border-none">
          <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
            <div>
              <CardTitle className="flex items-center">
                <BookOpen className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
                Mandatory Subjects
              </CardTitle>
              <div className="text-muted-foreground">
                Configure mandatory subjects for each program and course. These subjects are required for all students
                in the specified program.
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
              className="w-64 text-gray-700"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleFilterChange();
              }}
            />
            <Select
              value={selectedProgramCourse}
              onValueChange={(value) => {
                setSelectedProgramCourse(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-48 text-gray-700">
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
              value={selectedClass}
              onValueChange={(value) => {
                setSelectedClass(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-32 text-gray-700">
                <SelectValue placeholder="Filter by Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((classItem) => {
                  const isBoard = classItem === "12th";
                  const getRomanNumeral = (num: string) => {
                    const romanNumerals: { [key: string]: string } = {
                      "1st": "I",
                      "2nd": "II",
                      "3rd": "III",
                      "4th": "IV",
                      "5th": "V",
                      "6th": "VI",
                    };
                    return romanNumerals[num] || num;
                  };

                  return (
                    <SelectItem key={classItem} value={classItem}>
                      {isBoard ? "12th Board" : `Sem ${getRomanNumeral(classItem)}`}
                    </SelectItem>
                  );
                })}
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
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-16">
                      Sr. No.
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-48">
                      Subject
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-32">
                      Code
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-24">
                      Class
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-700 border-r border-gray-300 w-20">
                      Status
                    </TableHead>
                    <TableHead className="text-right bg-gray-100 font-semibold text-gray-700 w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-auto">
              <Table className="table-fixed">
                <TableBody>
                  {paginatedSubjects.map((subject, index) => (
                    <TableRow key={subject.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <TableCell className="border-r border-gray-300 w-16">{startIndex + index + 1}</TableCell>
                      <TableCell className="font-medium border-r border-gray-300 w-48">{subject.subject}</TableCell>
                      <TableCell className="border-r border-gray-300 w-32">
                        <Badge variant="outline">{subject.subjectCode}</Badge>
                      </TableCell>
                      <TableCell className="border-r border-gray-300 w-24">
                        <div className="flex flex-wrap gap-1">
                          {subject.classes.map((classItem, classIndex) => {
                            const isBoard = classItem === "12th";

                            // Convert semester numbers to roman numerals
                            const getRomanNumeral = (num: string) => {
                              const romanNumerals: { [key: string]: string } = {
                                "1st": "I",
                                "2nd": "II",
                                "3rd": "III",
                                "4th": "IV",
                                "5th": "V",
                                "6th": "VI",
                              };
                              return romanNumerals[num] || num;
                            };

                            return (
                              <Badge
                                key={classIndex}
                                variant="secondary"
                                className={`text-xs ${
                                  isBoard
                                    ? "bg-orange-100 text-orange-700 border-orange-300"
                                    : "bg-purple-100 text-purple-700 border-purple-300"
                                }`}
                              >
                                {isBoard ? "12th Board" : `Sem ${getRomanNumeral(classItem)}`}
                              </Badge>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-gray-300 w-20">
                        <Badge
                          variant="outline"
                          className={
                            subject.isActive
                              ? "border-green-500 text-green-700 bg-green-50"
                              : "border-red-500 text-red-700 bg-red-50"
                          }
                        >
                          {subject.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right w-24">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // setEditingSubject(subject);
                            }}
                          >
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
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(newItemsPerPage) => {
            setItemsPerPage(newItemsPerPage);
            setCurrentPage(1);
          }}
          sticky={false}
        />
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Mandatory Subject</DialogTitle>
            <DialogDescription>Configure a new mandatory subject for a specific program and course.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="e.g., Financial Accounting" className="text-gray-700" />
            </div>
            <div>
              <Label htmlFor="subjectCode">Subject Code</Label>
              <Input id="subjectCode" placeholder="e.g., FA101" className="text-gray-700" />
            </div>
            <div>
              <Label htmlFor="classes">Classes</Label>
              <Select>
                <SelectTrigger className="text-gray-700">
                  <SelectValue placeholder="Select Classes" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => {
                    const isBoard = classItem === "12th";
                    const getRomanNumeral = (num: string) => {
                      const romanNumerals: { [key: string]: string } = {
                        "1st": "I",
                        "2nd": "II",
                        "3rd": "III",
                        "4th": "IV",
                        "5th": "V",
                        "6th": "VI",
                      };
                      return romanNumerals[num] || num;
                    };

                    return (
                      <SelectItem key={classItem} value={classItem}>
                        {isBoard ? "12th Board" : `Sem ${getRomanNumeral(classItem)}`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="credits">Credits</Label>
              <Input id="credits" type="number" placeholder="4" className="text-gray-700" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddDialogOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
