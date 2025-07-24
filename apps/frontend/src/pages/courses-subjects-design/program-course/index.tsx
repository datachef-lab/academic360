import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Library, Download, Upload, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ProgramCourse } from "@/types/course-design";

// Dummy lookup data for names
const streams: Record<number, string> = { 1: "Science", 2: "Commerce" };
const courses: Record<number, string> = { 1: "B.Sc", 2: "B.Com" };
const courseTypes: Record<number, string> = { 1: "Honours", 2: "General" };
const courseLevels: Record<number, string> = { 1: "UG", 2: "PG" };
const affiliationTypes: Record<number, string> = { 1: "CU", 2: "WBSU" };
const regulationTypes: Record<number, string> = { 1: "CBCS", 2: "OBE" };

const dummyProgramCourses: ProgramCourse[] = [
  {
    id: 1,
    streamId: 1,
    courseId: 1,
    courseTypeId: 1,
    courseLevelId: 1,
    duration: 3,
    totalSemesters: 6,
    affiliationTypeId: 1,
    regulationTypeId: 1,
    disabled: false,
  },
  {
    id: 2,
    streamId: 2,
    courseId: 2,
    courseTypeId: 2,
    courseLevelId: 2,
    duration: 2,
    totalSemesters: 4,
    affiliationTypeId: 2,
    regulationTypeId: 2,
    disabled: true,
  },
];

const ProgramCoursesPage = () => {
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<ProgramCourse | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);

  const filtered = dummyProgramCourses.filter((pc) =>
    Object.values({
      stream: streams[pc.streamId] ?? "-",
      course: courses[pc.courseId] ?? "-",
      courseType: courseTypes[pc.courseTypeId] ?? "-",
      courseLevel: courseLevels[pc.courseLevelId] ?? "-",
      affiliationType: affiliationTypes[pc.affiliationTypeId] ?? "-",
      regulationType: regulationTypes[pc.regulationTypeId] ?? "-",
    })
      .join(" ")
      .toLowerCase()
      .includes(searchText.toLowerCase())
  );

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <Library className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Program Courses
            </CardTitle>
            <div className="text-muted-foreground">A list of all program courses.</div>
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
                  <DialogTitle>Bulk Upload Program Courses</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={e => setBulkFile(e.target.files?.[0] || null)}
                  />
                  <Button onClick={() => {}} disabled={!bulkFile}>
                    Upload
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => {}}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
            </Button>
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={() => setIsFormOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{selected ? "Edit Program Course" : "Add New Program Course"}</AlertDialogTitle>
                </AlertDialogHeader>
                {/* ProgramCourseForm goes here */}
                <div>ProgramCourse form goes here.</div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-4 border-b flex items-center gap-2 mb-0 justify-between">
            <Input placeholder="Search..." className="w-64" value={searchText} onChange={e => setSearchText(e.target.value)} />
            <Button variant="outline" onClick={() => {}}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          <div className="relative" style={{ height: '600px' }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[1200px]" style={{ tableLayout: 'fixed' }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: '#f3f4f6' }}>
                  <TableRow>
                    <TableHead style={{ width: 40 }}>#</TableHead>
                    <TableHead style={{ width: 120 }}>Stream</TableHead>
                    <TableHead style={{ width: 120 }}>Course</TableHead>
                    <TableHead style={{ width: 120 }}>Course Type</TableHead>
                    <TableHead style={{ width: 120 }}>Course Level</TableHead>
                    <TableHead style={{ width: 80 }}>Duration</TableHead>
                    <TableHead style={{ width: 80 }}>Semesters</TableHead>
                    <TableHead style={{ width: 120 }}>Affiliation Type</TableHead>
                    <TableHead style={{ width: 120 }}>Regulation Type</TableHead>
                    <TableHead style={{ width: 100 }}>Status</TableHead>
                    <TableHead style={{ width: 120 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center">No program courses found.</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((pc, idx) => (
                      <TableRow key={pc.id} className="group">
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{streams[pc.streamId] ?? "-"}</TableCell>
                        <TableCell>{courses[pc.courseId] ?? "-"}</TableCell>
                        <TableCell>{courseTypes[pc.courseTypeId] ?? "-"}</TableCell>
                        <TableCell>{courseLevels[pc.courseLevelId] ?? "-"}</TableCell>
                        <TableCell>{pc.duration}</TableCell>
                        <TableCell>{pc.totalSemesters}</TableCell>
                        <TableCell>{affiliationTypes[pc.affiliationTypeId] ?? "-"}</TableCell>
                        <TableCell>{regulationTypes[pc.regulationTypeId] ?? "-"}</TableCell>
                        <TableCell>
                          {!pc.disabled ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setSelected(pc); setIsFormOpen(true); }}
                              className="h-5 w-5 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {}}
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

export default ProgramCoursesPage;
