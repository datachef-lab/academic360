import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Plus, Edit, Trash2, Download, ChevronsUpDown, Check } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

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
const subjectCategories = ["MAJOR", "MINOR", "AECC", "DSCC", "MDC", "IDC", "VAC", "CVAC"];

export default function SemesterAvailabilityPage() {
  const [selectedProgramCourse, setSelectedProgramCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  // Compute a display subject category based on program course (for demo)
  const getSubjectCategory = (programCourse: string) => {
    if (programCourse.includes("Commerce")) return "MAJOR";
    if (programCourse.includes("Business Administration")) return "AECC";
    if (programCourse.includes("Computer Applications")) return "DSCC";
    if (programCourse.includes("Information Technology")) return "VAC";
    return "MAJOR";
  };

  // Helpers
  const toRoman = (s: string) => {
    const map: Record<string, string> = {
      "1st": "I",
      "2nd": "II",
      "3rd": "III",
      "4th": "IV",
      "5th": "V",
      "6th": "VI",
      "7th": "VII",
      "8th": "VIII",
    };
    return map[s] || s;
  };

  // Add dialog state (rows)
  type AddRow = { subjectCategory: string; classes: string[] };
  const [addRows, setAddRows] = useState<AddRow[]>([{ subjectCategory: "", classes: [] }]);
  const addAddRow = () => setAddRows((p) => [...p, { subjectCategory: "", classes: [] }]);
  const deleteAddRow = (idx: number) => setAddRows((p) => p.filter((_, i) => i !== idx));
  const updateAddRow = (idx: number, patch: Partial<AddRow>) =>
    setAddRows((p) => p.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  // Edit dialog state (single item)
  const [editCategory, setEditCategory] = useState<string>("");
  const [editClasses, setEditClasses] = useState<string[]>([]);
  const openEdit = (index: number) => {
    const item = filteredAvailability[index];
    if (!item) return;
    setEditCategory(getSubjectCategory(item.programCourse));
    setEditClasses(item.availableSemesters);
    setIsEditDialogOpen(true);
  };

  const saveAdd = () => {
    setIsAddDialogOpen(false);
  };
  const saveEdit = () => {
    setIsEditDialogOpen(false);
  };

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
              <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setIsAddDialogOpen(true)}>
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

      {/* Table with Sticky Header */}
      <div className="flex-1 px-4 min-h-0">
        <Card className="h-full flex flex-col">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Scrollable area with sticky header */}
            <div className="flex-1 overflow-auto">
              <Table className="table-fixed">
                <TableHeader className="sticky top-0 z-10 bg-gray-100">
                  <TableRow>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 w-16 border-r border-gray-300">
                      Sr. No.
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 w-64 border-r border-gray-300">
                      Subject Category
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 border-r border-gray-300">
                      Classes
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 w-32 border-r border-gray-300">
                      Status
                    </TableHead>
                    <TableHead className="text-center bg-gray-100 font-semibold text-gray-900 w-24 border-r border-gray-300">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAvailability.map((item, index) => (
                    <TableRow key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <TableCell className="w-16 border-r border-gray-300">{startIndex + index + 1}</TableCell>
                      <TableCell className="w-64 border-r border-gray-300">
                        <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-50">
                          {getSubjectCategory(item.programCourse)}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-r border-gray-300">
                        <div className="flex flex-wrap gap-1">
                          {item.availableSemesters.map((semester, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs bg-indigo-50 text-indigo-700 border-indigo-300"
                            >
                              {toRoman(semester)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="w-32 border-r border-gray-300">
                        <Badge
                          variant="outline"
                          className={
                            item.isActive
                              ? "border-green-500 text-green-700 bg-green-50"
                              : "border-red-500 text-red-700 bg-red-50"
                          }
                        >
                          {item.isActive ? "Available" : "Restricted"}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-24 border-r border-gray-300">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(index)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700">
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

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-5xl h-[75vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Semester Availability</DialogTitle>
            <DialogDescription>Fill rows, then save.</DialogDescription>
          </DialogHeader>
          <div className="border rounded-md flex-1 min-h-[18rem]">
            <div className="h-[50vh] overflow-auto">
              <Table className="table-fixed">
                <TableHeader className="sticky top-0 z-10 bg-gray-100">
                  <TableRow>
                    <TableHead className="w-16 border-r border-gray-300">Sr. No.</TableHead>
                    <TableHead className="w-64 border-r border-gray-300">Subject Category</TableHead>
                    <TableHead className="w-[20rem] border-r border-gray-300">Classes</TableHead>
                    <TableHead className="text-center w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {addRows.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell className="w-16 border-r border-gray-200">{idx + 1}</TableCell>
                      <TableCell className="w-64 border-r border-gray-200">
                        <Select
                          value={row.subjectCategory}
                          onValueChange={(v) => updateAddRow(idx, { subjectCategory: v })}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjectCategories.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="w-[20rem] border-r border-gray-200">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between min-h-10 h-auto"
                            >
                              {row.classes.length === 0 ? (
                                <span className="text-muted-foreground">Select semesters</span>
                              ) : (
                                <div className="flex flex-wrap gap-1 items-center justify-start h-auto">
                                  {row.classes.map((s) => (
                                    <Badge
                                      key={s}
                                      variant="outline"
                                      className="text-xs bg-indigo-50 text-indigo-700 border-indigo-300"
                                    >
                                      {toRoman(s)}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-0 max-h-64 overflow-auto" align="start">
                            <Command className="max-h-64 overflow-auto">
                              <CommandInput placeholder="Search semesters..." className="text-gray-700" />
                              <CommandEmpty>No semesters</CommandEmpty>
                              <CommandGroup>
                                {semesters.map((s) => (
                                  <CommandItem
                                    key={s}
                                    onSelect={() => {
                                      const exists = row.classes.includes(s);
                                      const next = exists ? row.classes.filter((v) => v !== s) : [...row.classes, s];
                                      updateAddRow(idx, { classes: next });
                                    }}
                                    className="text-gray-700"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${row.classes.includes(s) ? "opacity-100" : "opacity-0"}`}
                                    />
                                    {toRoman(s)}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => deleteAddRow(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <Button onClick={addAddRow} className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Row
            </Button>
            <DialogFooter className="m-0 p-0">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveAdd} className="bg-blue-600 hover:bg-blue-700 text-white">
                Save
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Semester Availability</DialogTitle>
            <DialogDescription>Update subject category and available semesters.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium mb-1">Subject Category</div>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {subjectCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Semesters</div>
              <div className="grid grid-cols-4 gap-2">
                {semesters.map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={editClasses.includes(s)}
                      onCheckedChange={(v) => {
                        const checked = Boolean(v);
                        setEditClasses((prev) =>
                          checked ? Array.from(new Set([...prev, s])) : prev.filter((x) => x !== s),
                        );
                      }}
                    />
                    <span>{toRoman(s)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
