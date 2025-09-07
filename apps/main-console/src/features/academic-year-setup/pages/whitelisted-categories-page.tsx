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
import { Textarea } from "@/components/ui/textarea";
import { Shield, Plus, Edit, Trash2, Download } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useTablePagination } from "@/hooks/useTablePagination";

// Mock data
const whitelistedCategories = [
  {
    id: 1,
    categoryName: "Core Business",
    description: "Essential business subjects",
    subjects: ["Accounting", "Finance", "Marketing"],
    programCourses: [
      "B.COM (H) - Commerce & Management",
      "BBA - Business Administration",
      "BCA - Computer Applications",
    ],
    priority: "High",
    isActive: true,
  },
  {
    id: 2,
    categoryName: "Technical Skills",
    description: "Programming and technical subjects",
    subjects: ["Java", "Python", "Database Management"],
    programCourses: ["BCA - Computer Applications", "B.Sc (IT) - Information Technology"],
    priority: "High",
    isActive: true,
  },
  {
    id: 3,
    categoryName: "General Education",
    description: "General education subjects",
    subjects: ["English Literature", "Environmental Studies", "Philosophy"],
    programCourses: [
      "B.COM (H) - Commerce & Management",
      "BBA - Business Administration",
      "BCA - Computer Applications",
    ],
    priority: "Low",
    isActive: false,
  },
  {
    id: 4,
    categoryName: "Specialized Electives",
    description: "Advanced specialized subjects",
    subjects: ["International Business", "Digital Marketing", "AI & Machine Learning"],
    programCourses: ["BBA - Business Administration", "B.Sc (IT) - Information Technology"],
    priority: "Medium",
    isActive: true,
  },
];

const programCourses = [
  "B.COM (H) - Commerce & Management",
  "BBA - Business Administration",
  "BCA - Computer Applications",
  "B.Sc (IT) - Information Technology",
];

const priorities = ["High", "Medium", "Low"];

export default function WhitelistedCategoriesPage() {
  const [selectedProgramCourse, setSelectedProgramCourse] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Use table pagination hook
  const tableData = useTablePagination({
    data: whitelistedCategories,
    searchFields: ["categoryName", "description"],
    initialItemsPerPage: 10,
  });

  // Additional filtering for dropdowns
  const filteredCategories = tableData.filteredData.filter((category) => {
    const matchesProgramCourse =
      !selectedProgramCourse ||
      selectedProgramCourse === "all" ||
      category.programCourses.includes(selectedProgramCourse);
    const matchesPriority = !selectedPriority || selectedPriority === "all" || category.priority === selectedPriority;
    return matchesProgramCourse && matchesPriority;
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
              placeholder="Search categories..."
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
              value={selectedPriority}
              onValueChange={(value) => {
                setSelectedPriority(value);
                tableData.resetToFirstPage();
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Filter by Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                {priorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    {priority}
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
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Category Name</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Description</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Subjects</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Programs</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Priority</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="text-right bg-gray-100 font-semibold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
              </Table>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-auto">
              <Table>
                <TableBody>
                  {paginatedCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.categoryName}</TableCell>
                      <TableCell className="max-w-xs truncate">{category.description}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {category.subjects.slice(0, 2).map((subject, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                          {category.subjects.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{category.subjects.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {category.programCourses.map((programCourse, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {programCourse}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            category.priority === "High"
                              ? "border-red-500 text-red-700 bg-red-50"
                              : category.priority === "Medium"
                                ? "border-orange-500 text-orange-700 bg-orange-50"
                                : "border-blue-500 text-blue-700 bg-blue-50"
                          }
                        >
                          {category.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
            <DialogTitle>Add Whitelisted Category</DialogTitle>
            <DialogDescription>Create a new whitelisted subject category.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label htmlFor="categoryName">Category Name</Label>
              <Input id="categoryName" placeholder="e.g., Core Business" />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe the category..." />
            </div>
            <div className="col-span-2">
              <Label htmlFor="subjects">Subjects (comma-separated)</Label>
              <Input id="subjects" placeholder="e.g., Accounting, Finance, Marketing" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="isActive">Active Status</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Switch id="isActive" />
                <Label htmlFor="isActive">Enable this category</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddDialogOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
