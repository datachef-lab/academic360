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
import { XCircle, Plus, Edit, Trash2, Download } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useTablePagination } from "@/hooks/useTablePagination";

// Mock data
const restrictedGroupings = [
  {
    id: 1,
    groupName: "Accounting Conflict",
    description: "Cannot take both basic and advanced accounting in same semester",
    subjects: ["Basic Accounting", "Advanced Accounting", "Cost Accounting"],
    programCourses: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    restrictionType: "Mutual Exclusion",
    severity: "High",
    isActive: true,
  },
  {
    id: 2,
    groupName: "Programming Prerequisites",
    description: "Advanced programming requires basic programming completion",
    subjects: ["Java Programming", "Advanced Java", "Spring Framework"],
    programCourses: ["BCA - Computer Applications", "B.Sc (IT) - Information Technology"],
    restrictionType: "Prerequisite",
    severity: "High",
    isActive: true,
  },
  {
    id: 3,
    groupName: "Mathematics Foundation",
    description: "Statistics requires mathematics foundation",
    subjects: ["Business Mathematics", "Statistics", "Operations Research"],
    programCourses: ["B.COM (H) - Commerce & Management", "BBA - Business Administration"],
    restrictionType: "Prerequisite",
    severity: "Medium",
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
    restrictionType: "Mutual Exclusion",
    severity: "Low",
    isActive: false,
  },
];

const programCourses = [
  "B.COM (H) - Commerce & Management",
  "BBA - Business Administration",
  "BCA - Computer Applications",
  "B.Sc (IT) - Information Technology",
];

const restrictionTypes = ["Mutual Exclusion", "Prerequisite", "Time Conflict", "Credit Limit"];
const severities = ["High", "Medium", "Low"];

export default function AlternativeSubjectsPage() {
  const [selectedProgramCourse, setSelectedProgramCourse] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Use table pagination hook
  const tableData = useTablePagination({
    data: restrictedGroupings,
    searchFields: ["groupName", "description", "restrictionType"],
    initialItemsPerPage: 10,
  });

  // Additional filtering for dropdowns
  const filteredGroupings = tableData.filteredData.filter((grouping) => {
    const matchesProgramCourse =
      !selectedProgramCourse ||
      selectedProgramCourse === "all" ||
      grouping.programCourses.includes(selectedProgramCourse);
    const matchesType = !selectedType || selectedType === "all" || grouping.restrictionType === selectedType;
    return matchesProgramCourse && matchesType;
  });

  // Update pagination data with additional filters
  const totalItems = filteredGroupings.length;
  const totalPages = Math.ceil(totalItems / tableData.itemsPerPage);
  const startIndex = (tableData.currentPage - 1) * tableData.itemsPerPage;
  const endIndex = startIndex + tableData.itemsPerPage;
  const paginatedGroupings = filteredGroupings.slice(startIndex, endIndex);

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 pb-0">
        <Card className="border-none">
          <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
            <div>
              <CardTitle className="flex items-center">
                <XCircle className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
                Alternative Subjects
              </CardTitle>
              <div className="text-muted-foreground">
                Configure restricted subject groupings and combinations. Define rules that prevent certain subject
                combinations or enforce prerequisites.
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
              placeholder="Search groupings..."
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
              value={selectedType}
              onValueChange={(value) => {
                setSelectedType(value);
                tableData.resetToFirstPage();
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {restrictionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
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
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Group Name</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Description</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Subjects</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Programs</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Type</TableHead>
                    <TableHead className="bg-gray-100 font-semibold text-gray-900">Severity</TableHead>
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
                  {paginatedGroupings.map((grouping) => (
                    <TableRow key={grouping.id}>
                      <TableCell className="font-medium">{grouping.groupName}</TableCell>
                      <TableCell className="max-w-xs truncate">{grouping.description}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {grouping.subjects.slice(0, 2).map((subject, subjectIndex) => (
                            <Badge key={subjectIndex} variant="outline" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                          {grouping.subjects.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{grouping.subjects.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {grouping.programCourses.map((programCourse, programIndex) => (
                            <Badge key={programIndex} variant="secondary" className="text-xs">
                              {programCourse}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{grouping.restrictionType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            grouping.severity === "High"
                              ? "border-red-500 text-red-700 bg-red-50"
                              : grouping.severity === "Medium"
                                ? "border-orange-500 text-orange-700 bg-orange-50"
                                : "border-blue-500 text-blue-700 bg-blue-50"
                          }
                        >
                          {grouping.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
            <DialogTitle>Add Restricted Grouping</DialogTitle>
            <DialogDescription>Create a new restriction rule for subject combinations.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label htmlFor="groupName">Group Name</Label>
              <Input id="groupName" placeholder="e.g., Accounting Conflict" />
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Describe the restriction rule..." />
            </div>
            <div>
              <Label htmlFor="restrictionType">Restriction Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  {restrictionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Severity" />
                </SelectTrigger>
                <SelectContent>
                  {severities.map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      {severity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="isActive">Active Status</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Switch id="isActive" />
                <Label htmlFor="isActive">Enable this restriction</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setIsAddDialogOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add Restriction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
