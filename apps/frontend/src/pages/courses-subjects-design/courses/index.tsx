// NOTE: Update './columns' to use shadcn/ui Badge for the status column:
// import { Badge } from "@/components/ui/badge";
// ...
// cell: ({ row }) => (
//   <Badge variant={row.original.isActive ? "default" : "secondary"}>
//     {row.original.isActive ? "Active" : "Inactive"}
//   </Badge>
// )

import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Download, Upload, Library } from "lucide-react";
import React from "react";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  
} from "@/components/ui/table";
import { Course } from "@/types/course-design";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  getCourses,
  createCourse,
  updateCourse,
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

  React.useEffect(() => {
    setLoading(true);
    getCourses()
      .then(res => {
        // Ensure we have an array, even if the API returns something unexpected
        const coursesData = Array.isArray(res) ? res : [];
        setCourses(coursesData);
        setError(null);
      })
      .catch((error) => {
        console.error('Error fetching courses:', error);
        setError("Failed to fetch courses");
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = (Array.isArray(courses) ? courses : []).filter((course) =>
    (course.name ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
    (course.shortName ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
    (course.degree?.name ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
    (course.sequence?.toString() ?? '').includes(searchText.toLowerCase())
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

  const handleBulkUpload = () => {
    if (!bulkFile) return;
    // TODO: Implement actual upload logic
    toast.success("Bulk upload successful (mock)");
    setIsBulkUploadOpen(false);
    setBulkFile(null);
  };

  const handleDownloadTemplate = () => {
    // For now, just download a static file or trigger a download
    const link = document.createElement('a');
    link.href = '/templates/course-bulk-upload-template.xlsx';
    link.download = 'course-bulk-upload-template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = async () => {
    try {
      const res = await getCourses();
      const data = res.map(course => ({
        ID: course.id,
        Name: course.name,
        "Short Name": course.shortName,
        Degree: course.degree?.name ?? "-",
        Status: course.disabled ? "Inactive" : "Active",
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
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <Library className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
            Courses</CardTitle>
            <div className="text-muted-foreground">A list of all the courses offered.</div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Upload Courses</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={e => setBulkFile(e.target.files?.[0] || null)}
                  />
                  <Button onClick={handleBulkUpload} disabled={!bulkFile}>
                    Upload
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="default" onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
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
          <div className="sticky top-[72px] z-20 bg-background p-4 border-b flex items-center gap-2 mb-0 justify-between">
            <Input placeholder="Search..." className="w-64" value={searchText} onChange={e => setSearchText(e.target.value)} />
            <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadAll}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
          <div className="relative" style={{ height: '600px' }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[900px]" style={{ tableLayout: 'fixed' }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: '#f3f4f6' }}>
                  <TableRow>
                    <TableHead style={{ width: 60, background: '#f3f4f6', color: '#374151' }}>ID</TableHead>
                    <TableHead style={{ width: 320, background: '#f3f4f6', color: '#374151' }}>Name</TableHead>
                    <TableHead style={{ width: 140, background: '#f3f4f6', color: '#374151' }}>Short Name</TableHead>
                    <TableHead style={{ width: 120, background: '#f3f4f6', color: '#374151' }}>Degree</TableHead>
                    <TableHead style={{ width: 100, background: '#f3f4f6', color: '#374151' }}>Status</TableHead>
                    <TableHead style={{ width: 120, background: '#f3f4f6', color: '#374151' }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center text-red-500">{error}</TableCell>
                    </TableRow>
                  ) : filteredCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center">No courses found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredCourses.map((course) => (
                      <TableRow key={course.id} className="group">
                        <TableCell style={{ width: 60 }}>{course.id}</TableCell>
                        <TableCell style={{ width: 320 }}>{course.name}</TableCell>
                        <TableCell style={{ width: 140 }}>{course.shortName}</TableCell>
                        <TableCell style={{ width: 120 }}>{course.degree?.name ?? "-"}</TableCell>
                        <TableCell style={{ width: 100 }}>
                          {course.disabled === true ? (
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
