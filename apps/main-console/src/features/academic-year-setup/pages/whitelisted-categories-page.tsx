import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { Shield, Plus, Edit, Trash2, Download, X } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useTablePagination } from "@/hooks/useTablePagination";

// Mock data
const whitelistedCategories = [
  {
    id: 1,
    subjectCategory: "MAJOR",
    description: "Core major subjects for business programs",
    programCourses: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    isActive: true,
  },
  {
    id: 2,
    subjectCategory: "MINOR",
    description: "Minor subjects to complement major studies",
    programCourses: [
      "B.COM (H) - Commerce & Management",
      "BBA - Business Administration",
      "BCA - Computer Applications",
    ],
    isActive: true,
  },
  {
    id: 3,
    subjectCategory: "AECC",
    description: "Ability Enhancement Compulsory Courses",
    programCourses: [
      "B.COM (H) - Commerce & Management",
      "BBA - Business Administration",
      "BCA - Computer Applications",
      "B.Sc (IT) - Information Technology",
    ],
    isActive: true,
  },
  {
    id: 4,
    subjectCategory: "DSCC",
    description: "Discipline Specific Core Courses",
    programCourses: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    isActive: true,
  },
  {
    id: 5,
    subjectCategory: "MDC",
    description: "Multidisciplinary Courses",
    programCourses: ["BCA - Computer Applications", "B.Sc (IT) - Information Technology"],
    isActive: false,
  },
  {
    id: 6,
    subjectCategory: "IDC",
    description: "Interdisciplinary Courses",
    programCourses: ["BBA - Business Administration", "B.Sc (IT) - Information Technology"],
    isActive: true,
  },
];

const programCourses = [
  "B.COM (H) - Commerce & Management",
  "BBA - Business Administration",
  "BCA - Computer Applications",
  "B.Sc (IT) - Information Technology",
];

export default function WhitelistedCategoriesPage() {
  const [selectedProgramCourse, setSelectedProgramCourse] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");

  // Form state
  const subjectCategoryOptions = useMemo(
    () => Array.from(new Set(whitelistedCategories.map((c) => c.subjectCategory))),
    [],
  );
  const [formSubjectCategory, setFormSubjectCategory] = useState<string>("");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formSelectedCourses, setFormSelectedCourses] = useState<string[]>([]);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [availableSearch, setAvailableSearch] = useState<string>("");

  const availableCourses = useMemo(
    () => programCourses.filter((c) => !formSelectedCourses.includes(c)),
    [formSelectedCourses],
  );

  const filteredAvailableCourses = useMemo(
    () => availableCourses.filter((c) => c.toLowerCase().includes(availableSearch.trim().toLowerCase())),
    [availableCourses, availableSearch],
  );

  const openAddDialog = () => {
    setDialogMode("add");
    setFormSubjectCategory("");
    setFormDescription("");
    setFormSelectedCourses([]);
    setFormIsActive(true);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: (typeof whitelistedCategories)[number]) => {
    setDialogMode("edit");
    setFormSubjectCategory(item.subjectCategory);
    setFormDescription(item.description);
    setFormSelectedCourses(item.programCourses);
    setFormIsActive(item.isActive);
    setIsDialogOpen(true);
  };

  const handleAddCourse = (course: string) => {
    setFormSelectedCourses((prev) => Array.from(new Set([...prev, course])));
  };

  const handleRemoveCourse = (course: string) => {
    setFormSelectedCourses((prev) => prev.filter((c) => c !== course));
  };

  const handleSave = () => {
    // For now, we only close the dialog. Integration with backend/state can be added later.
    setIsDialogOpen(false);
  };

  const handleSelectAll = () => {
    setFormSelectedCourses((prev) => Array.from(new Set([...prev, ...filteredAvailableCourses])));
  };

  const handleClearAll = () => {
    setFormSelectedCourses([]);
  };

  // Use table pagination hook
  const tableData = useTablePagination({
    data: whitelistedCategories,
    searchFields: ["subjectCategory", "description"],
    initialItemsPerPage: 10,
  });

  // Additional filtering for dropdowns
  const filteredCategories = tableData.filteredData.filter((category) => {
    const matchesProgramCourse =
      !selectedProgramCourse ||
      selectedProgramCourse === "all" ||
      category.programCourses.includes(selectedProgramCourse);
    return matchesProgramCourse;
  });

  // Update pagination data with additional filters
  const totalItems = filteredCategories.length;
  const totalPages = Math.ceil(totalItems / tableData.itemsPerPage);
  const startIndex = (tableData.currentPage - 1) * tableData.itemsPerPage;
  const endIndex = startIndex + tableData.itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 pb-0">
        <Card className="border-none">
          <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
            <div>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
                Whitelisted Categories
              </CardTitle>
              <div className="text-muted-foreground">
                Configure whitelisted subject categories. Define approved subject categories and their priority levels.
              </div>
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
              placeholder="Search categories, programs..."
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
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10">
                  <TableRow className="bg-gray-100">
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 border-r border-gray-300 w-16">
                      Sr. No.
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 border-r border-gray-300 w-32">
                      Subject Category
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 border-r border-gray-300 min-w-48">
                      Description
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 border-r border-gray-300 min-w-64">
                      Program-Courses
                    </TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900 border-r border-gray-300 w-24">
                      Status
                    </TableHead>
                    <TableHead className="text-right bg-gray-100 font-semibold text-gray-900 w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCategories.map((category, index) => (
                    <TableRow key={category.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium border-r border-gray-200">{startIndex + index + 1}</TableCell>
                      <TableCell className="border-r border-gray-200">
                        <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-50">
                          {category.subjectCategory}
                        </Badge>
                      </TableCell>
                      <TableCell className="border-r border-gray-200 max-w-xs truncate">
                        {category.description}
                      </TableCell>
                      <TableCell className="border-r border-gray-200">
                        <div className="flex flex-wrap gap-1">
                          {category.programCourses.map((programCourse, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs bg-indigo-50 text-indigo-700 border-indigo-300"
                            >
                              {programCourse.split(" - ")[0]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="border-r border-gray-200">
                        <Badge
                          variant="outline"
                          className={
                            category.isActive
                              ? "border-green-500 text-green-700 bg-green-50"
                              : "border-red-500 text-red-700 bg-red-50"
                          }
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl h-[70vh] flex flex-col">
          <DialogHeader className="border-b pb-3">
            <DialogTitle>{dialogMode === "add" ? "Add" : "Edit"} Whitelisted Category</DialogTitle>
            <DialogDescription>
              {dialogMode === "add" ? "Create a new" : "Update the"} whitelisted subject category.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 pr-1 overflow-hidden">
            {/* Row 1: Subject Category + Description */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Subject Category</Label>
                <Select value={formSubjectCategory} onValueChange={setFormSubjectCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectCategoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  className="mt-1"
                  placeholder="Describe the subject category..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
            </div>

            {/* Row 2: Dual list for Program-Courses */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Selected */}
              <div className="border rounded-md p-3 border-green-200">
                <div className="flex items-center justify-between mb-2 bg-green-50 border border-green-200 rounded-md px-2 py-1">
                  <Label className="font-semibold text-green-700">Selected Program-Courses</Label>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleClearAll}>
                      Clear All
                    </Button>
                    <span className="text-xs text-muted-foreground">{formSelectedCourses.length}</span>
                  </div>
                </div>
                <div className="space-y-2 h-64 overflow-auto">
                  {formSelectedCourses.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      No program-courses selected
                    </div>
                  ) : (
                    formSelectedCourses.map((course) => (
                      <div key={course} className="flex items-center justify-between gap-2 border rounded-md p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">{course.split(" - ")[0]}</span>
                          {/* <span className="text-xs text-green-700">Selected</span> */}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleRemoveCourse(course)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Available */}
              <div className="border rounded-md p-3 border-blue-200">
                <div className="flex items-center justify-between mb-2 bg-blue-50 border border-blue-200 rounded-md px-2 py-1">
                  <Label className="font-semibold text-blue-700">Available Program-Courses</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-7 px-2 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={handleSelectAll}
                    >
                      Select All
                    </Button>
                    <span className="text-xs text-muted-foreground">{filteredAvailableCourses.length}</span>
                  </div>
                </div>
                <div className="mb-2">
                  <Input
                    placeholder="Search available courses..."
                    value={availableSearch}
                    onChange={(e) => setAvailableSearch(e.target.value)}
                  />
                </div>
                <div className="space-y-2 h-64 overflow-auto">
                  {filteredAvailableCourses.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      No available program-courses
                    </div>
                  ) : (
                    filteredAvailableCourses.map((course) => (
                      <div key={course} className="flex items-center justify-between gap-2 border rounded-md p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">{course.split(" - ")[0]}</span>
                          {/* <span className="text-xs text-gray-600">Available</span> */}
                        </div>
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => handleAddCourse(course)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 border-t pt-3 z-10">
            <div className="w-full flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id="active" checked={formIsActive} onCheckedChange={(v) => setFormIsActive(Boolean(v))} />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {dialogMode === "add" ? "Save" : "Update"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
