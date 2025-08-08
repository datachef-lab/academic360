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
import { Download, Edit, Library, PlusCircle, Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import { ExamComponentForm } from "./exam-component-form";
import { ExamComponent } from "@/types/course-design";
import { getAllExamComponent } from "@/services/exam-component.service";
import { createExamComponent, updateExamComponent } from "@/services/course-design.api";

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
        setExamComponents(data);
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
      getAllExamComponent().then((data) => setExamComponents(data.payload));
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
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      toast.success("Parsed " + jsonData.length + " items from sheet");
    };
    reader.readAsArrayBuffer(bulkFile);
  };

  const handleEdit = (comp: ExamComponent) => {
    setSelectedExamComponent(comp);
    setIsFormOpen(true);
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
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <Library className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Exam Components
            </CardTitle>
            <div className="text-muted-foreground">A list of all the exam components offered.</div>
          </div>

          <div className="flex items-center gap-2">
            <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" /> Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent>
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

            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" /> Download Template
            </Button>

            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  onClick={handleAddNew}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {selectedExamComponent ? "Edit examComponent" : "Add New examComponent"}
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
          <div className="sticky top-[72px] z-20 bg-background p-4 border-b flex items-center gap-2 mb-0 justify-between">
            <Input
              placeholder="Search..."
              className="w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadAll}>
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>

          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[900px]" style={{ tableLayout: "fixed" }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 60 }}>ID</TableHead>
                    <TableHead style={{ width: 320 }}>Name</TableHead>
                    <TableHead style={{ width: 320 }}>Code</TableHead>
                    <TableHead style={{ width: 140 }}>Short Name</TableHead>
                    <TableHead style={{ width: 100 }}>Status</TableHead>
                    <TableHead style={{ width: 120 }}>Actions</TableHead>
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
                          {comp.disabled ? (
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
