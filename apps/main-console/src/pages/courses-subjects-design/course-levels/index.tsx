import React from "react";
// import { CustomPaginationState } from "@/components/settings/SettingsContent";
import { CourseLevelForm } from "./course-level-form";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Sliders, Download, Upload, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { ProgressBar } from "@/components/common/Progress";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  CourseLevel,
  getAllCourseLevels,
  createCourseLevel,
  updateCourseLevel,
  bulkUploadCourseLevels,
  BulkUploadResult,
} from "@/services/course-level.api";
import { deleteCourseLevel, DeleteResult } from "@/services/course-design.api";
import * as XLSX from "xlsx";

const CourseLevelsPage = () => {
  const [courseLevels, setCourseLevels] = React.useState<CourseLevel[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedCourseLevel, setSelectedCourseLevel] = React.useState<CourseLevel | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);
  const [bulkUploadResult, setBulkUploadResult] = React.useState<BulkUploadResult | null>(null);
  const [isBulkUploading, setIsBulkUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  React.useEffect(() => {
    setLoading(true);
    getAllCourseLevels()
      .then((res) => {
        const courseLevelsData = Array.isArray(res) ? res : [];
        setCourseLevels(courseLevelsData);
        setError(null);
      })
      .catch((error) => {
        console.error("Error fetching course levels:", error);
        setError("Failed to fetch course levels");
        setCourseLevels([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleEdit = (courseLevel: CourseLevel) => {
    setSelectedCourseLevel(courseLevel);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const result: DeleteResult = await deleteCourseLevel(id);
      if (result.success) {
        setCourseLevels((prev) => prev.filter((cl) => cl.id !== id));
        toast.success(result.message || "Course level deleted successfully");
      } else {
        const details = (result.records || [])
          .filter((r) => r.count > 0)
          .map((r) => `${r.type}: ${r.count}`)
          .join(", ");
        toast.error(`${result.message}${details ? ` — ${details}` : ""}`);
      }
    } catch {
      toast.error("Failed to delete course level");
    }
  };

  const handleSubmit = async (data: CourseLevel) => {
    setIsSubmitting(true);
    try {
      if (selectedCourseLevel) {
        // Update
        await updateCourseLevel(selectedCourseLevel.id!, data);
        toast.success("Course level updated successfully");
      } else {
        // Create
        await createCourseLevel(data);
        toast.success("Course level created successfully");
      }
      // Always re-fetch after add/edit
      const freshCourseLevels = await getAllCourseLevels();
      setCourseLevels(Array.isArray(freshCourseLevels) ? freshCourseLevels : []);
      setIsFormOpen(false);
    } catch (error) {
      toast.error(`Failed to save course level: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsFormOpen(false);
  };

  const handleAddNew = () => {
    setSelectedCourseLevel(null);
    setIsFormOpen(true);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;

    setIsBulkUploading(true);
    setUploadProgress(0);
    try {
      const result = await bulkUploadCourseLevels(bulkFile, setUploadProgress);
      setBulkUploadResult(result);

      if (result.summary.successful > 0) {
        toast.success(`Successfully uploaded ${result.summary.successful} course levels`);
        // Re-fetch the list to show new data
        const freshCourseLevels = await getAllCourseLevels();
        setCourseLevels(Array.isArray(freshCourseLevels) ? freshCourseLevels : []);
      }

      if (result.summary.failed > 0) {
        toast.error(`${result.summary.failed} course levels failed to upload`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Bulk upload failed: ${errorMessage}`);
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create template data
    const templateData = [
      {
        Name: "Bachelor of Science",
        "Short Name": "BSc",
        Sequence: 1,
        Status: "Active",
      },
      {
        Name: "Master of Science",
        "Short Name": "MSc",
        Sequence: 2,
        Status: "Active",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Course Levels Template");
    XLSX.writeFile(wb, "course-level-bulk-upload-template.xlsx");
  };

  const handleDownloadAll = async () => {
    try {
      const res = await getAllCourseLevels();
      const data = res.map((level) => ({
        ID: level.id,
        Name: level.name,
        "Short Name": level.shortName || "-",
        Sequence: level.sequence || "-",
        Status: level.disabled ? "Inactive" : "Active",
        "Created At": level.createdAt,
        "Updated At": level.updatedAt,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Course Levels");
      XLSX.writeFile(wb, "course-levels.xlsx");
    } catch {
      toast.error("Failed to download course levels");
    }
  };

  const handleCloseBulkUpload = () => {
    setIsBulkUploadOpen(false);
    setBulkFile(null);
    setBulkUploadResult(null);
  };

  const handleDownloadFailedData = () => {
    if (!bulkUploadResult || bulkUploadResult.errors.length === 0) {
      toast.error("No failed data to download");
      return;
    }

    try {
      // Create failed data with error details
      const failedData = bulkUploadResult.errors.map((error) => ({
        "Row Number": error.row,
        "Error Message": error.error,
        "Original Data": JSON.stringify(error.data),
        Name: (error.data as unknown as string[])[0] || "",
        "Short Name": (error.data as unknown as string[])[1] || "",
        Sequence: (error.data as unknown as string[])[2] || "",
        Status: (error.data as unknown as string[])[3] || "",
      }));

      const ws = XLSX.utils.json_to_sheet(failedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Failed Course Levels");
      XLSX.writeFile(wb, "failed-course-levels-upload.xlsx");

      toast.success("Failed data downloaded successfully");
    } catch {
      toast.error("Failed to download error data");
    }
  };

  const filteredCourseLevels = (Array.isArray(courseLevels) ? courseLevels : []).filter(
    (level) =>
      (level.name ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
      (level.shortName ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
      (level.sequence?.toString() ?? "").includes(searchText.toLowerCase()),
  );

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center mb-3 justify-between gap-4 border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Sliders className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400 flex-shrink-0" />
              <span className="truncate">Course Levels</span>
            </CardTitle>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">A list of all course levels.</div>
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
              <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Bulk Upload Course Levels</DialogTitle>
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

                  {isBulkUploading && <ProgressBar progress={uploadProgress} />}

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

                      {bulkUploadResult.errors.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-red-600">Errors:</h5>
                            <Button variant="outline" size="sm" onClick={handleDownloadFailedData} className="text-xs">
                              <Download className="mr-1 h-3 w-3" />
                              Download Failed Data
                            </Button>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {bulkUploadResult.errors.map((error, index) => (
                              <div key={index} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                                <span className="font-medium">Row {error.row}:</span> {error.error}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleBulkUpload} disabled={!bulkFile || isBulkUploading} className="flex-1">
                      {isBulkUploading ? "Uploading..." : "Upload"}
                    </Button>
                    <Button variant="outline" onClick={handleCloseBulkUpload}>
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Add Course Level</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] sm:w-full max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {selectedCourseLevel ? "Edit Course Level" : "Add New Course Level"}
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <CourseLevelForm
                  initialData={selectedCourseLevel}
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
              <Table className="border rounded-md min-w-[700px]" style={{ tableLayout: "fixed" }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 60, background: "#f3f4f6", color: "#374151" }}>ID</TableHead>
                    <TableHead style={{ width: 220, background: "#f3f4f6", color: "#374151" }}>Name</TableHead>
                    <TableHead style={{ width: 200, background: "#f3f4f6", color: "#374151" }}>Short Name</TableHead>
                    <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151" }}>Sequence</TableHead>
                    <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151" }}>Status</TableHead>
                    <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151" }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredCourseLevels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No course levels found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCourseLevels.map((level) => (
                      <TableRow key={level.id} className="group">
                        <TableCell style={{ width: 60 }}>{level.id}</TableCell>
                        <TableCell style={{ width: 220 }}>{level.name}</TableCell>
                        <TableCell style={{ width: 200 }}>{level.shortName || "-"}</TableCell>
                        <TableCell style={{ width: 120 }}>{level.sequence || "-"}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          {level.disabled ? (
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
                              onClick={() => handleEdit(level)}
                              className="h-5 w-5 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(level.id!)}
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

export default CourseLevelsPage;
