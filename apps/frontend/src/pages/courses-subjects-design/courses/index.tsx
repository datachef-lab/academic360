// NOTE: Update './columns' to use shadcn/ui Badge for the status column:
// import { Badge } from "@/components/ui/badge";
// ...
// cell: ({ row }) => (
//   <Badge variant={row.original.isActive ? "default" : "secondary"}>
//     {row.original.isActive ? "Active" : "Inactive"}
//   </Badge>
// )

import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, Download, Upload, Library } from "lucide-react";
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

const dummyCourses: Course[] = [
  {
    id: 1,
    name: "Bachelor of Science in Computer Science",
    shortName: "BSc CS",
    sequence: 1,
    disabled: false,
    createdAt: new Date("2022-01-01"),
    updatedAt: new Date("2023-01-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 2,
    name: "Master of Business Administration",
    shortName: "MBA",
    sequence: 2,
    disabled: false,
    createdAt: new Date("2022-02-01"),
    updatedAt: new Date("2023-02-01"),
    degree: { id: 2, name: "MBA", level: null, sequence: 2, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 3,
    name: "Bachelor of Arts in History",
    shortName: "BA History",
    sequence: 3,
    disabled: true,
    createdAt: new Date("2022-03-01"),
    updatedAt: new Date("2023-03-01"),
    degree: null,
  },
  {
    id: 4,
    name: "Bachelor of Commerce",
    shortName: "BCom",
    sequence: 4,
    disabled: false,
    createdAt: new Date("2022-04-01"),
    updatedAt: new Date("2023-04-01"),
    degree: { id: 3, name: "B.Com", level: null, sequence: 3, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 5,
    name: "Bachelor of Science in Mathematics",
    shortName: "BSc Math",
    sequence: 5,
    disabled: false,
    createdAt: new Date("2022-05-01"),
    updatedAt: new Date("2023-05-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 6,
    name: "Bachelor of Science in Physics",
    shortName: "BSc Physics",
    sequence: 6,
    disabled: false,
    createdAt: new Date("2022-06-01"),
    updatedAt: new Date("2023-06-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 7,
    name: "Bachelor of Science in Chemistry",
    shortName: "BSc Chem",
    sequence: 7,
    disabled: false,
    createdAt: new Date("2022-07-01"),
    updatedAt: new Date("2023-07-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 8,
    name: "Bachelor of Science in Botany",
    shortName: "BSc Botany",
    sequence: 8,
    disabled: false,
    createdAt: new Date("2022-08-01"),
    updatedAt: new Date("2023-08-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 9,
    name: "Bachelor of Science in Zoology",
    shortName: "BSc Zoology",
    sequence: 9,
    disabled: false,
    createdAt: new Date("2022-09-01"),
    updatedAt: new Date("2023-09-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 10,
    name: "Bachelor of Science in Statistics",
    shortName: "BSc Stats",
    sequence: 10,
    disabled: false,
    createdAt: new Date("2022-10-01"),
    updatedAt: new Date("2023-10-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 11,
    name: "Bachelor of Science in Economics",
    shortName: "BSc Econ",
    sequence: 11,
    disabled: false,
    createdAt: new Date("2022-11-01"),
    updatedAt: new Date("2023-11-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 12,
    name: "Bachelor of Science in Microbiology",
    shortName: "BSc Microbio",
    sequence: 12,
    disabled: false,
    createdAt: new Date("2022-12-01"),
    updatedAt: new Date("2023-12-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 13,
    name: "Bachelor of Science in Environmental Science",
    shortName: "BSc EnvSci",
    sequence: 13,
    disabled: false,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2024-01-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 14,
    name: "Bachelor of Science in Electronics",
    shortName: "BSc Electronics",
    sequence: 14,
    disabled: false,
    createdAt: new Date("2023-02-01"),
    updatedAt: new Date("2024-02-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 15,
    name: "Bachelor of Science in Geology",
    shortName: "BSc Geology",
    sequence: 15,
    disabled: false,
    createdAt: new Date("2023-03-01"),
    updatedAt: new Date("2024-03-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 16,
    name: "Bachelor of Science in Geography",
    shortName: "BSc Geography",
    sequence: 16,
    disabled: false,
    createdAt: new Date("2023-04-01"),
    updatedAt: new Date("2024-04-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 17,
    name: "Bachelor of Science in Psychology",
    shortName: "BSc Psychology",
    sequence: 17,
    disabled: false,
    createdAt: new Date("2023-05-01"),
    updatedAt: new Date("2024-05-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 18,
    name: "Bachelor of Science in Sociology",
    shortName: "BSc Sociology",
    sequence: 18,
    disabled: false,
    createdAt: new Date("2023-06-01"),
    updatedAt: new Date("2024-06-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 19,
    name: "Bachelor of Science in Philosophy",
    shortName: "BSc Philosophy",
    sequence: 19,
    disabled: false,
    createdAt: new Date("2023-07-01"),
    updatedAt: new Date("2024-07-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 20,
    name: "Bachelor of Science in Political Science",
    shortName: "BSc PolSci",
    sequence: 20,
    disabled: false,
    createdAt: new Date("2023-08-01"),
    updatedAt: new Date("2024-08-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 21,
    name: "Bachelor of Science in Anthropology",
    shortName: "BSc Anthropology",
    sequence: 21,
    disabled: false,
    createdAt: new Date("2023-09-01"),
    updatedAt: new Date("2024-09-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 22,
    name: "Bachelor of Science in Linguistics",
    shortName: "BSc Linguistics",
    sequence: 22,
    disabled: false,
    createdAt: new Date("2023-10-01"),
    updatedAt: new Date("2024-10-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 23,
    name: "Bachelor of Science in Computer Applications",
    shortName: "BCA",
    sequence: 23,
    disabled: false,
    createdAt: new Date("2023-11-01"),
    updatedAt: new Date("2024-11-01"),
    degree: { id: 1, name: "B.Sc", level: null, sequence: 1, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 24,
    name: "Bachelor of Business Administration",
    shortName: "BBA",
    sequence: 24,
    disabled: false,
    createdAt: new Date("2023-12-01"),
    updatedAt: new Date("2024-12-01"),
    degree: { id: 4, name: "BBA", level: null, sequence: 4, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 25,
    name: "Master of Science in Computer Science",
    shortName: "MSc CS",
    sequence: 25,
    disabled: false,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2025-01-01"),
    degree: { id: 5, name: "M.Sc", level: null, sequence: 5, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 26,
    name: "Master of Science in Mathematics",
    shortName: "MSc Math",
    sequence: 26,
    disabled: false,
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2025-02-01"),
    degree: { id: 5, name: "M.Sc", level: null, sequence: 5, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 27,
    name: "Master of Science in Physics",
    shortName: "MSc Physics",
    sequence: 27,
    disabled: false,
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2025-03-01"),
    degree: { id: 5, name: "M.Sc", level: null, sequence: 5, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 28,
    name: "Master of Science in Chemistry",
    shortName: "MSc Chem",
    sequence: 28,
    disabled: false,
    createdAt: new Date("2024-04-01"),
    updatedAt: new Date("2025-04-01"),
    degree: { id: 5, name: "M.Sc", level: null, sequence: 5, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 29,
    name: "Master of Science in Botany",
    shortName: "MSc Botany",
    sequence: 29,
    disabled: false,
    createdAt: new Date("2024-05-01"),
    updatedAt: new Date("2025-05-01"),
    degree: { id: 5, name: "M.Sc", level: null, sequence: 5, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
  {
    id: 30,
    name: "Master of Science in Zoology",
    shortName: "MSc Zoology",
    sequence: 30,
    disabled: true,
    createdAt: new Date("2024-06-01"),
    updatedAt: new Date("2025-06-01"),
    degree: { id: 5, name: "M.Sc", level: null, sequence: 5, disabled: false, createdAt: new Date(), updatedAt: new Date() },
  },
];

const CoursesPage = () => {
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedCourse, setSelectedCourse] = React.useState<Course | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  // const [selectedRows] = React.useState<number[]>([]);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);

  const filteredCourses = dummyCourses.filter((course) =>
    course.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (course.shortName?.toLowerCase().includes(searchText.toLowerCase()) ?? false) ||
    (course.degree?.name?.toLowerCase().includes(searchText.toLowerCase()) ?? false) ||
    (course.sequence?.toString().includes(searchText.toLowerCase()) ?? false)
  );

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    console.log("Delete:", id);
    toast.info("Delete functionality not implemented yet.");
  };

  const handleSubmit = async (data: unknown) => {
    setIsSubmitting(true);
    try {
      console.log("Submit:", data);
      toast.success(selectedCourse ? "Course updated successfully" : "Course created successfully");
      setIsFormOpen(false);
    } catch (error) {
      toast.error(`Failed to save course with error: ${error}`);
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
    // You can replace this with your actual template file URL
    const link = document.createElement('a');
    link.href = '/templates/course-bulk-upload-template.xlsx';
    link.download = 'course-bulk-upload-template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <Button variant="outline" className="flex items-center gap-2">
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
                  {filteredCourses.length === 0 ? (
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
                          {course.disabled ? (
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
                              onClick={() => handleDelete(course.id ?? -1)}
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
