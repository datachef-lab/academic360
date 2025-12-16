// NOTE: Update './columns' to use shadcn/ui Badge for the status column:
// import { Badge } from "@/components/ui/badge";
// ...
// cell: ({ row }) => (
//   <Badge variant={row.original.isActive ? "default" : "secondary"}>
//     {row.original.isActive ? "Active" : "Inactive"}
//   </Badge>
// )

import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Download, Upload, Library, Trash2 } from "lucide-react";
import React from "react";
// import { ProgressBar } from "@/components/common/Progress";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CourseForm } from "./course-form";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { Course } from "@repo/db/index";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  bulkUploadCourses,
  BulkUploadResult,
  DeleteResult,
} from "@/services/course-design.api";
import * as XLSX from "xlsx";

const CoursesPage = () => {
  const [courses, setCourses] = React.useState<Course[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);
  const [bulkUploadResult, setBulkUploadResult] = React.useState<BulkUploadResult | null>(null);
  const [isBulkUploading, setIsBulkUploading] = React.useState(false);
  const setUploadProgress = React.useState(0)[1];

  React.useEffect(() => {
    setLoading(true);
    getCourses()
      .then((res) => {
        // Ensure we have an array, even if the API returns something unexpected
        const coursesData = Array.isArray(res) ? res : [];
        setCourses(coursesData);
        setError(null);
      })
      .catch((error) => {
        console.error("Error fetching courses:", error);
        setError("Failed to fetch courses");
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = (Array.isArray(courses) ? courses : []).filter(
    (course) =>
      (course.name ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
      (course.shortName ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
      (course.sequence?.toString() ?? "").includes(searchText.toLowerCase()),
  );

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setIsFormOpen(true);
  };

  const handleSubmit = async (data: Course) => {
    setIsSubmitting(true);
    try {
      if (selectedCourse) {
        // Update
        await updateCourse(selectedCourse.id!, data);
        toast.success("Course updated successfully");
      } else {
        // Create
        await createCourse(data);
        toast.success("Course created successfully");
      }
      // Always re-fetch after add/edit
      const freshCourses = await getCourses();
      setCourses(Array.isArray(freshCourses) ? freshCourses : []);
      setIsFormOpen(false);
    } catch {
      toast.error(`Failed to save course`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  const handleAddNew = () => {
    setSelectedCourse(null);
    setIsFormOpen(true);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;

    setIsBulkUploading(true);
    try {
      const result = await bulkUploadCourses(bulkFile, (uploadProgress) => {
        setUploadProgress(uploadProgress);
      });
      setBulkUploadResult(result);

      if (result.summary.successful > 0) {
        toast.success(`Successfully uploaded ${result.summary.successful} courses`);
        // Re-fetch the list to show new data
        const freshCourses = await getCourses();
        setCourses(Array.isArray(freshCourses) ? freshCourses : []);
      }

      if (result.summary.failed > 0) {
        toast.error(`${result.summary.failed} courses failed to upload`);
      }
    } catch {
      toast.error(`Bulk upload failed: ${"Unknown error"}`);
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Name: "Bachelor of Science",
        "Short Name": "BSc",
        Code: "BSc",
        Sequence: 1,
        "Degree ID": 1,
        Status: "Active",
      },
      {
        Name: "Bachelor of Arts",
        "Short Name": "BA",
        Code: "BA",
        Sequence: 2,
        "Degree ID": 1,
        Status: "Active",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Courses Template");
    XLSX.writeFile(wb, "course-bulk-upload-template.xlsx");
  };

  const handleDownloadAll = async () => {
    try {
      const res = await getCourses();
      const data = res.map((course) => ({
        ID: course.id,
        Name: course.name,
        "Short Name": course.shortName,

        Status: !course.isActive ? "Inactive" : "Active",
        "Created At": course.createdAt,
        "Updated At": course.updatedAt,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Courses");
      XLSX.writeFile(wb, "courses.xlsx");
    } catch {
      toast.error("Failed to download courses");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const result: DeleteResult = await deleteCourse(id);
      if (result.success) {
        toast.success(result.message || "Course deleted successfully");
        const fresh = await getCourses();
        setCourses(Array.isArray(fresh) ? fresh : []);
      } else {
        const details = (result.records || [])
          .filter((r) => r.count > 0)
          .map((r) => `${r.type}: ${r.count}`)
          .join(", ");
        toast.error(`${result.message}${details ? ` — ${details}` : ""}`);
      }
    } catch {
      toast.error("Failed to delete course");
    }
  };

  // const allSelected =
  //   filteredCourses.length > 0 &&
  //   filteredCourses.every((course) => selectedRows.includes(course.id ?? -1));

  // const toggleSelectAll = () => {
  //   if (allSelected) {
  //     setSelectedRows([]);
  //   } else {
  //     setSelectedRows(filteredCourses.map((c) => c.id ?? -1));
  //   }
  // };

  // const toggleSelectRow = (id: number) => {
  //   setSelectedRows((prev) =>
  //     prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
  //   );
  // };

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center mb-3 justify-between gap-4 border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Library className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400 flex-shrink-0" />
              <span className="truncate">Courses</span>
            </CardTitle>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">A list of all the courses offered.</div>
          </div>
          <div className="flex items-center gap-2 flex-nowrap overflow-x-auto">
            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-shrink-0">
                  <Upload className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Bulk Upload</span>
                  <span className="sm:hidden">Upload</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] sm:w-full max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk Upload Courses</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleDownloadTemplate}>
                      <Download className="mr-2 h-4 w-4" />
                      Download Template
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Download the template to see the required format
                    </span>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload Excel File</label>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  {bulkUploadResult && (
                    <div className="space-y-4 p-4 border rounded">
                      <h4 className="font-medium">Upload Results</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Total:</span> {bulkUploadResult.summary.total}
                        </div>
                        <div className="text-green-600">
                          <span className="font-medium">Successful:</span> {bulkUploadResult.summary.successful}
                        </div>
                        <div className="text-red-600">
                          <span className="font-medium">Failed:</span> {bulkUploadResult.summary.failed}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsBulkUploadOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleBulkUpload} disabled={!bulkFile || isBulkUploading}>
                    {isBulkUploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleDownloadTemplate} className="flex-shrink-0">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Download Template</span>
              <span className="sm:hidden">Template</span>
            </Button>
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  onClick={handleAddNew}
                  className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Add</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] sm:w-full max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>{selectedCourse ? "Edit Course" : "Add New Course"}</AlertDialogTitle>
                </AlertDialogHeader>
                <CourseForm
                  initialData={selectedCourse as Course}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isSubmitting={isSubmitting}
                />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-2 sm:p-4 border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-0">
            <Input
              placeholder="Search..."
              className="w-full sm:w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button variant="outline" className="flex items-center gap-2 flex-shrink-0" onClick={handleDownloadAll}>
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
          {/* Table View - Keep original table UI on all screens */}
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[900px]" style={{ tableLayout: "fixed" }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 60, background: "#f3f4f6", color: "#374151" }}>ID</TableHead>
                    <TableHead style={{ width: 320, background: "#f3f4f6", color: "#374151" }}>Name</TableHead>
                    <TableHead style={{ width: 140, background: "#f3f4f6", color: "#374151" }}>Short Name</TableHead>
                    {/* <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151" }}>Degree</TableHead> */}
                    <TableHead style={{ width: 100, background: "#f3f4f6", color: "#374151" }}>Status</TableHead>
                    <TableHead style={{ width: 140, background: "#f3f4f6", color: "#374151" }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center">
                        No courses found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCourses.map((course) => (
                      <TableRow key={course.id} className="group">
                        <TableCell style={{ width: 60 }}>{course.id}</TableCell>
                        <TableCell style={{ width: 320 }}>{course.name}</TableCell>
                        <TableCell style={{ width: 140 }}>{course.shortName}</TableCell>
                        {/* <TableCell style={{ width: 120 }}>{course.degree?.name ?? "-"}</TableCell> */}
                        <TableCell style={{ width: 100 }}>
                          {!course.isActive ? (
                            <Badge variant="secondary">Inactive</Badge>
                          ) : (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ width: 120 }}>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(course)}
                              className="h-5 w-5 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(course.id!)}
                              className="h-5 w-5 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoursesPage;
