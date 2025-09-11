import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { XCircle, Plus, Edit, Trash2, Download, Check, ChevronsUpDown } from "lucide-react";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

// Mock data
const restrictedGroupings = [
  {
    id: 1,
    groupName: "Accounting Conflict",
    description: "Cannot take both basic and advanced accounting in same semester",
    subjects: ["Basic Accounting", "Advanced Accounting", "Cost Accounting"],
    programCourses: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    subjectCategory: "MAJOR",
    isActive: true,
  },
  {
    id: 2,
    groupName: "Programming Prerequisites",
    description: "Advanced programming requires basic programming completion",
    subjects: ["Java Programming", "Advanced Java", "Spring Framework"],
    programCourses: ["BCA - Computer Applications", "B.Sc (IT) - Information Technology"],
    subjectCategory: "DSCC",
    isActive: true,
  },
  {
    id: 3,
    groupName: "Mathematics Foundation",
    description: "Statistics requires mathematics foundation",
    subjects: ["Business Mathematics", "Statistics", "Operations Research"],
    programCourses: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    subjectCategory: "AECC",
    isActive: true,
  },
  {
    id: 4,
    groupName: "Language Restriction",
    description: "Cannot take multiple foreign languages simultaneously",
    subjects: ["French", "German", "Spanish"],
    programCourses: [
      "B.COM (H) - Commerce & Management",
      "BBA - Business Administration",
      "BCA - Computer Applications",
    ],
    subjectCategory: "VAC",
    isActive: false,
  },
  {
    id: 5,
    groupName: "Minor Alternatives",
    description: "Minor stream with alternative choices",
    subjects: ["Environmental Studies", "Sociology", "Psychology"],
    programCourses: ["B.COM (H) - Commerce & Management"],
    subjectCategory: "MINOR",
    isActive: true,
  },
];

const programCourses = [
  "B.COM (H) - Commerce & Management",
  "BBA - Business Administration",
  "BCA - Computer Applications",
  "B.Sc (IT) - Information Technology",
];

// Consistent outline color for alternative subject badges
const altBadgeColor = "bg-indigo-50 text-indigo-700 border-indigo-300";

export default function AlternativeSubjectsPage() {
  const [selectedProgramCourse, setSelectedProgramCourse] = useState("");

  // Use table pagination hook
  const tableData = useTablePagination({
    data: restrictedGroupings,
    searchFields: ["groupName", "description"],
    initialItemsPerPage: 10,
  });

  // Additional filtering for dropdowns
  const filteredGroupings = tableData.filteredData.filter((grouping) => {
    const matchesProgramCourse =
      !selectedProgramCourse ||
      selectedProgramCourse === "all" ||
      grouping.programCourses.includes(selectedProgramCourse);
    return matchesProgramCourse;
  });

  // Update pagination data with additional filters
  const totalItems = filteredGroupings.length;
  const totalPages = Math.ceil(totalItems / tableData.itemsPerPage);
  const startIndex = (tableData.currentPage - 1) * tableData.itemsPerPage;
  const endIndex = startIndex + tableData.itemsPerPage;
  const paginatedGroupings = filteredGroupings.slice(startIndex, endIndex);

  // ---------- Add/Edit Dialog State ----------
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");

  const subjectCategories = ["MAJOR", "MINOR", "AECC", "DSCC", "MDC", "IDC", "VAC", "CVAC"];

  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    restrictedGroupings.forEach((g) => g.subjects.forEach((s) => set.add(s)));
    return Array.from(set);
  }, []);

  type DialogRow = {
    programCourse: string;
    subjectCategory: string;
    targetedSubject: string;
    alternativeSubjects: string[];
  };

  const [dialogRows, setDialogRows] = useState<DialogRow[]>([]);

  // Edit-form state (single mapping form) ---------------------------------
  const [editProgramCourse, setEditProgramCourse] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string>("");
  const [editTargetSubject, setEditTargetSubject] = useState<string>("");
  const [editSelectedAlternatives, setEditSelectedAlternatives] = useState<string[]>([]);

  const editAvailableAlternatives = useMemo(() => {
    return allSubjects.filter((s) => !editSelectedAlternatives.includes(s) && s !== editTargetSubject);
  }, [allSubjects, editSelectedAlternatives, editTargetSubject]);

  const addEditAlternative = (s: string) => {
    setEditSelectedAlternatives((prev) => (prev.includes(s) ? prev : [...prev, s]));
  };
  const removeEditAlternative = (s: string) => {
    setEditSelectedAlternatives((prev) => prev.filter((x) => x !== s));
  };

  const openAddDialog = () => {
    setDialogMode("add");
    setDialogRows([{ programCourse: "", subjectCategory: "", targetedSubject: "", alternativeSubjects: [] }]);
    setIsDialogOpen(true);
  };

  const openEditDialog = (grouping: (typeof restrictedGroupings)[number]) => {
    setDialogMode("edit");
    setDialogRows([
      {
        programCourse: grouping.programCourses[0] ?? "",
        subjectCategory: grouping.subjectCategory ?? "",
        targetedSubject: grouping.subjects[0] ?? "",
        alternativeSubjects: grouping.subjects.slice(1),
      },
    ]);
    // Initialize edit form state
    setEditProgramCourse(grouping.programCourses[0] ?? "");
    setEditCategory(grouping.subjectCategory ?? "");
    setEditTargetSubject(grouping.subjects[0] ?? "");
    setEditSelectedAlternatives(grouping.subjects.slice(1));
    setIsDialogOpen(true);
  };

  const addDialogRow = () => {
    setDialogRows((prev) => [
      ...prev,
      { programCourse: "", subjectCategory: "", targetedSubject: "", alternativeSubjects: [] },
    ]);
  };

  const deleteDialogRow = (idx: number) => {
    setDialogRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRowField = <K extends keyof DialogRow>(idx: number, key: K, value: DialogRow[K]) => {
    setDialogRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)) as DialogRow[]);
  };

  const handleSaveDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 pb-0">
        <Card className="border-none">
          <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
            <div>
              <CardTitle className="flex items-center">
                <XCircle className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
                Related Subjects
              </CardTitle>
              <div className="text-muted-foreground">Configure related subjects mapping for each program-course.</div>
            </div>
            <div className="flex items-center gap-2">
              <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={openAddDialog}>
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
              placeholder="Search major or related subjects..."
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
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 w-16 border-r border-gray-300">
                      Sr. No.
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 w-64 border-r border-gray-300">
                      Program-Course
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 w-40 border-r border-gray-300">
                      Subject Category
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 w-56 border-r border-gray-300">
                      Subject
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 border-r border-gray-300">
                      Related Subjects
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 w-24 border-r border-gray-300">
                      Status
                    </TableHead>
                    <TableHead className="text-center bg-gray-100 font-semibold text-gray-900 w-24 border-r border-gray-300">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-auto">
              <Table className="table-fixed">
                <TableBody>
                  {paginatedGroupings.map((grouping, index) => (
                    <TableRow key={grouping.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <TableCell className="w-16 border-r border-gray-300">{startIndex + index + 1}</TableCell>
                      <TableCell className="w-64 border-r border-gray-300">{grouping.programCourses[0]}</TableCell>
                      <TableCell className="w-40 border-r border-gray-300">
                        <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-50 text-xs">
                          {grouping.subjectCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-56 border-r border-gray-300">
                        <Badge variant="outline" className="text-xs border-red-500 text-red-700 bg-red-50">
                          {grouping.subjects[0]}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-r border-gray-300">
                        <div className="flex flex-wrap gap-1 max-w-xl">
                          {grouping.subjects.slice(1).map((subject, i) => (
                            <Badge key={i} variant="outline" className={`text-xs ${altBadgeColor}`}>
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="w-24 border-r border-gray-300">
                        <Badge
                          variant="outline"
                          className={
                            grouping.isActive
                              ? "border-green-500 text-green-700 bg-green-50"
                              : "border-red-500 text-red-700 bg-red-50"
                          }
                        >
                          {grouping.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="w-24 border-r border-gray-300">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(grouping)}
                          >
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

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[90rem] w-[98vw] h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{dialogMode === "add" ? "Add" : "Edit"} Related Subjects</DialogTitle>
            <DialogDescription>Use the table below to add one or more mappings, then save.</DialogDescription>
          </DialogHeader>

          {dialogMode === "add" ? (
            <div className="border rounded-md flex-1 min-h-[18rem]">
              <div className="h-[60vh] overflow-auto">
                <Table className="table-fixed">
                  <TableHeader className="sticky top-0 z-10 bg-gray-100">
                    <TableRow>
                      <TableHead className="w-16 border-r border-gray-300">Sr. No.</TableHead>
                      <TableHead className="w-[24rem] border-r border-gray-300">Program-Course</TableHead>
                      <TableHead className="w-36 border-r border-gray-300">Subject Category</TableHead>
                      <TableHead className="w-48 border-r border-gray-300">Subject</TableHead>
                      <TableHead className="w-[22rem] border-r border-gray-300">Related Subjects</TableHead>
                      <TableHead className="text-center w-24">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dialogRows.map((row, idx) => (
                      <TableRow key={idx} className="hover:bg-gray-50">
                        <TableCell className="border-r border-gray-200">{idx + 1}</TableCell>
                        <TableCell className="border-r border-gray-200">
                          <Select
                            value={row.programCourse}
                            onValueChange={(v) => updateRowField(idx, "programCourse", v)}
                          >
                            <SelectTrigger className="w-[22rem]">
                              <SelectValue placeholder="Select program-course" />
                            </SelectTrigger>
                            <SelectContent>
                              {programCourses.map((pc) => (
                                <SelectItem key={pc} value={pc}>
                                  {pc}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border-r border-gray-200">
                          <Select
                            value={row.subjectCategory}
                            onValueChange={(v) => updateRowField(idx, "subjectCategory", v)}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {subjectCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border-r border-gray-200">
                          <Select
                            value={row.targetedSubject}
                            onValueChange={(v) => updateRowField(idx, "targetedSubject", v)}
                          >
                            <SelectTrigger className="w-48 truncate">
                              <SelectValue placeholder="Select subject" className="truncate" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64 overflow-auto">
                              {allSubjects.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border-r border-gray-200 w-[22rem]">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between min-h-10 h-auto"
                              >
                                {row.alternativeSubjects.length === 0 ? (
                                  <span className="text-muted-foreground">Select alternatives</span>
                                ) : (
                                  <div className="flex flex-wrap gap-1 items-center justify-start h-auto">
                                    {row.alternativeSubjects.map((label) => (
                                      <Badge key={label} variant="outline" className={`text-xs ${altBadgeColor}`}>
                                        {label}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0 max-h-64 overflow-auto" align="start">
                              <Command className="max-h-64 overflow-auto">
                                <CommandInput placeholder="Search subjects..." className="text-gray-700" />
                                <CommandEmpty>No subjects found.</CommandEmpty>
                                <CommandGroup>
                                  {allSubjects.map((opt) => (
                                    <CommandItem
                                      key={opt}
                                      onSelect={() => {
                                        const exists = row.alternativeSubjects.includes(opt);
                                        const next = exists
                                          ? row.alternativeSubjects.filter((v) => v !== opt)
                                          : [...row.alternativeSubjects, opt];
                                        updateRowField(idx, "alternativeSubjects", next);
                                      }}
                                      className="text-gray-700"
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 ${row.alternativeSubjects.includes(opt) ? "opacity-100" : "opacity-0"}`}
                                      />
                                      {opt}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => deleteDialogRow(idx)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-3">
                <Button onClick={addDialogRow} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-2" /> Add Row
                </Button>
                <DialogFooter className="m-0 p-0">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveDialog} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {dialogMode === "add" ? "Save" : "Update"}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          ) : (
            // EDIT MODE LAYOUT -------------------------------------------------
            <div className="flex flex-col gap-4 flex-1">
              {/* Top dropdowns */}
              <div className="grid grid-cols-3 gap-6 pt-2 pb-2">
                <div className="flex flex-col gap-1">
                  <Label>Program-Course</Label>
                  <Select value={editProgramCourse} onValueChange={setEditProgramCourse}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select program-course" />
                    </SelectTrigger>
                    <SelectContent>
                      {programCourses.map((pc) => (
                        <SelectItem key={pc} value={pc}>
                          {pc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label>Subject Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <Label>Subject</Label>
                  <Select value={editTargetSubject} onValueChange={setEditTargetSubject}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select targeted subject" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 overflow-auto">
                      {allSubjects.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dual cards */}
              <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
                {/* Selected Alternatives */}
                <div className="border rounded-md flex flex-col h-[52vh]">
                  <div className="px-3 py-2 bg-gray-100 border-b font-semibold">Selected Alternative Subjects</div>
                  <div className="p-3 flex-1 min-h-0 overflow-auto">
                    {editSelectedAlternatives.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No alternatives selected</div>
                    ) : (
                      <div className="space-y-2">
                        {editSelectedAlternatives.map((s) => (
                          <div key={s} className="flex items-center justify-between gap-2 border rounded-md px-2 py-1">
                            <Badge variant="outline" className={`text-xs ${altBadgeColor}`}>
                              {s}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-700 bg-red-100 hover:bg-red-200 rounded"
                              onClick={() => removeEditAlternative(s)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2 border-t bg-gray-50 flex justify-end">
                    <Button
                      variant="ghost"
                      className="bg-red-100 hover:bg-red-200 text-red-700 h-8 px-3"
                      onClick={() => setEditSelectedAlternatives([])}
                    >
                      Remove All
                    </Button>
                  </div>
                </div>

                {/* Available Subjects */}
                <div className="border rounded-md flex flex-col h-[52vh]">
                  <div className="px-3 py-2 bg-gray-100 border-b font-semibold">Available Subjects</div>
                  <div className="p-3 flex-1 min-h-0 overflow-auto">
                    {editAvailableAlternatives.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No available subjects</div>
                    ) : (
                      <div className="space-y-2">
                        {editAvailableAlternatives.map((s) => (
                          <div key={s} className="flex items-center justify-between gap-2 border rounded-md px-2 py-1">
                            <span className="text-sm text-gray-700">{s}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-purple-700 bg-purple-100 hover:bg-purple-200 rounded"
                              onClick={() => addEditAlternative(s)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2 border-t bg-gray-50 flex justify-end">
                    <Button
                      variant="ghost"
                      className="bg-purple-100 hover:bg-purple-200 text-purple-700 h-8 px-3"
                      onClick={() =>
                        setEditSelectedAlternatives((prev) =>
                          Array.from(new Set([...prev, ...editAvailableAlternatives])),
                        )
                      }
                    >
                      Select All
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveDialog} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
