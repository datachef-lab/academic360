import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Edit, Library, PlusCircle, Upload, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import { ExamComponentForm } from "./exam-component-form";
import type { ExamComponent } from "@repo/db/index";
import { getAllExamComponent } from "@/services/exam-component.service";
import {
  createExamComponent,
  updateExamComponent,
  deleteExamComponent,
  DeleteResult,
} from "@/services/course-design.api";

const ExamComponentesPage = () => {
  const [examComponents, setExamComponents] = React.useState<ExamComponent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedExamComponent, setSelectedExamComponent] = React.useState<ExamComponent | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);

  React.useEffect(() => {
    setLoading(true);
    getAllExamComponent()
      .then((res) => {
        const data = Array.isArray(res.payload) ? res.payload : [];
        setExamComponents(data as ExamComponent[]);
        setError(null);
      })
      .catch(() => {
        setError("Failed to fetch examComponents");
        setExamComponents([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredExamComponents = examComponents.filter((comp) => {
    return (
      comp.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      comp.shortName?.toLowerCase().includes(searchText.toLowerCase()) ||
      comp.sequence?.toString().includes(searchText)
    );
  });

  const handleSubmit = async (data: ExamComponent) => {
    setIsSubmitting(true);
    try {
      if (selectedExamComponent) {
        await updateExamComponent(selectedExamComponent.id!, data);
        toast.success("examComponent updated successfully");
      } else {
        await createExamComponent(data);
        toast.success("examComponent created successfully");
      }
      setIsFormOpen(false);
      setSelectedExamComponent(null);
      getAllExamComponent().then((data) => setExamComponents(data.payload as ExamComponent[]));
    } catch (err) {
      console.log(err);
      toast.error("Failed to save examComponent");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const worksheet = XLSX.utils.json_to_sheet([{ name: "Exam Name", shortName: "Short", type: "Type" }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "exam_components_template.xlsx");
  };

  const handleBulkUpload = () => {
    if (!bulkFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName!];
      const jsonData = XLSX.utils.sheet_to_json(sheet!);
      toast.success("Parsed " + jsonData.length + " items from sheet");
    };
    reader.readAsArrayBuffer(bulkFile);
  };

  const handleEdit = (comp: ExamComponent) => {
    setSelectedExamComponent(comp);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    try {
      const result: DeleteResult = await deleteExamComponent(id);
      if (result.success) {
        toast.success(result.message || "Exam component deleted successfully");
        const refreshed = await getAllExamComponent();
        setExamComponents(Array.isArray(refreshed.payload) ? (refreshed.payload as ExamComponent[]) : []);
      } else {
        const details = (result.records || [])
          .filter((r) => r.count > 0)
          .map((r) => `${r.type}: ${r.count}`)
          .join(", ");
        toast.error(`${result.message}${details ? ` — ${details}` : ""}`);
      }
    } catch {
      toast.error("Failed to delete exam component");
    }
  };

  const handleAddNew = () => {
    setSelectedExamComponent(null);
    setIsFormOpen(true);
  };

  const handleDownloadAll = () => {
    const worksheet = XLSX.utils.json_to_sheet(examComponents);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ExamComponents");
    XLSX.writeFile(workbook, "exam_components.xlsx");
  };

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center mb-3 justify-between gap-4 border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Library className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400 flex-shrink-0" />
              <span className="truncate">Exam Components</span>
            </CardTitle>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">
              A list of all the exam components offered.
            </div>
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
                  <DialogTitle>Bulk Upload examComponents</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  />
                  <Button onClick={handleBulkUpload} disabled={!bulkFile}>
                    Upload
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
                  <PlusCircle className="mr-2 h-4 w-4" /> Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] sm:w-full max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {selectedExamComponent ? "Edit Exam Component" : "Add New Exam Component"}
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <ExamComponentForm
                  initialData={selectedExamComponent as ExamComponent}
                  onSubmit={handleSubmit}
                  onCancel={() => setIsFormOpen(false)}
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

          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[900px]" style={{ tableLayout: "fixed" }}>
                <TableHeader style={{ position: "sticky", top: 0, zIndex: 30, background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 60, background: "#f3f4f6", color: "#374151" }}>ID</TableHead>
                    <TableHead style={{ width: 320, background: "#f3f4f6", color: "#374151" }}>Name</TableHead>
                    <TableHead style={{ width: 320, background: "#f3f4f6", color: "#374151" }}>Code</TableHead>
                    <TableHead style={{ width: 140, background: "#f3f4f6", color: "#374151" }}>Short Name</TableHead>
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
                  ) : filteredExamComponents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center">
                        No examComponents found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredExamComponents.map((comp) => (
                      <TableRow key={comp.id} className="group">
                        <TableCell style={{ width: 60 }}>{comp.id}</TableCell>
                        <TableCell style={{ width: 320 }}>{comp.name}</TableCell>
                        <TableCell style={{ width: 320 }}>{comp.code}</TableCell>
                        <TableCell style={{ width: 140 }}>{comp.shortName}</TableCell>
                        <TableCell style={{ width: 100 }}>
                          {!comp.isActive ? (
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
                              onClick={() => handleEdit(comp)}
                              className="h-5 w-5 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(comp.id)}
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

export default ExamComponentesPage;
