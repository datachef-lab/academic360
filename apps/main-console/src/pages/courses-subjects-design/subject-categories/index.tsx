import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Tag, Download, Upload, Edit, Trash2 } from "lucide-react";
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
import { SubjectCategoryForm } from "./subject-category-form";
import type { SubjectType } from "@repo/db";
import {
  getSubjectTypes,
  createSubjectType,
  updateSubjectType,
  deleteSubjectType,
  bulkUploadSubjectTypes,
  DeleteResult,
} from "@/services/course-design.api";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const SubjectCategoriesPage = () => {
  const [categories, setCategories] = React.useState<SubjectType[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<SubjectType | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);
  const [bulkUploadResult, setBulkUploadResult] = React.useState<{
    summary: { total: number; successful: number; failed: number };
    errors: Array<{ row: number; error: string; data: Record<string, unknown> }>;
  } | null>(null);
  const [isBulkUploading, setIsBulkUploading] = React.useState(false);

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await getSubjectTypes();
      setCategories(Array.isArray(res) ? res : []);
      setError(null);
    } catch {
      setError("Failed to fetch subject categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: SubjectType): void => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    try {
      const result: DeleteResult = await deleteSubjectType(id);
      if (result.success) {
        toast.success(result.message || "Subject category deleted successfully");
        fetchCategories();
      } else {
        const details = (result.records || [])
          .filter((r) => r.count > 0)
          .map((r) => `${r.type}: ${r.count}`)
          .join(", ");
        toast.error(`${result.message}${details ? ` — ${details}` : ""}`);
      }
    } catch {
      toast.error("Failed to delete subject category");
    }
  };

  const handleAddNew = () => {
    setSelectedCategory(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: Omit<SubjectType, "id" | "createdAt" | "updatedAt">) => {
    try {
      if (selectedCategory && selectedCategory.id) {
        await updateSubjectType(selectedCategory.id, data);
        toast.success("Subject category updated successfully");
      } else {
        await createSubjectType(data);
        toast.success("Subject category created successfully");
      }
      setIsFormOpen(false);
      fetchCategories();
    } catch {
      toast.error("Failed to save subject category");
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setIsBulkUploading(true);
    try {
      const result = await bulkUploadSubjectTypes(bulkFile);
      setBulkUploadResult(result);
      if (result.summary.successful > 0) {
        toast.success(`Successfully uploaded ${result.summary.successful} subject categories`);
        fetchCategories();
      }
      if (result.summary.failed > 0) {
        toast.error(`${result.summary.failed} subject categories failed to upload`);
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
      { Name: "Core", Code: "CORE", Sequence: 1, Disabled: false },
      { Name: "Elective", Code: "ELEC", Sequence: 2, Disabled: false },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SubjectTypes Template");
    XLSX.writeFile(wb, "subject-type-bulk-upload-template.xlsx");
  };

  const handleDownloadAll = async () => {
    try {
      const res = await getSubjectTypes();
      const data = (Array.isArray(res) ? res : []).map((cat: SubjectType) => ({
        ID: cat.id,
        Name: cat.name,
        Code: cat.code || "-",
        Sequence: cat.sequence || "-",
        Disabled: cat.disabled ? "Yes" : "No",
        "Created At": cat.createdAt,
        "Updated At": cat.updatedAt,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "SubjectTypes");
      XLSX.writeFile(wb, "subject-types.xlsx");
    } catch {
      toast.error("Failed to download subject categories");
    }
  };

  const handleDownloadFailedData = () => {
    if (!bulkUploadResult || !bulkUploadResult.errors || bulkUploadResult.errors.length === 0) {
      toast.error("No failed data to download");
      return;
    }
    try {
      const failedData = bulkUploadResult.errors.map((error) => {
        const errorData = error.data as Record<string, unknown>;
        return {
          "Row Number": error.row,
          "Error Message": error.error,
          "Original Data": JSON.stringify(error.data),
          Name: (errorData.Name as string) || "",
          Code: (errorData.Code as string) || "",
          Sequence: (errorData.Sequence as string) || "",
          Disabled: (errorData.Disabled as string) || "",
        };
      });
      const ws = XLSX.utils.json_to_sheet(failedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Failed SubjectTypes");
      XLSX.writeFile(wb, "failed-subject-types-upload.xlsx");
      toast.success("Failed data downloaded successfully");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to download error data: ${errorMessage}`);
    }
  };

  const filteredCategories = categories.filter(
    (category) =>
      (category.name ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
      (category.code ?? "").toLowerCase().includes(searchText.toLowerCase()),
  );

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <Tag className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Subject Categories
            </CardTitle>
            <div className="text-muted-foreground">A list of all subject categories.</div>
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
                  <DialogTitle>Bulk Upload Subject Categories</DialogTitle>
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
                      {bulkUploadResult.errors && bulkUploadResult.errors.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-red-600">Errors:</h5>
                            <Button variant="outline" size="sm" onClick={handleDownloadFailedData} className="text-xs">
                              <Download className="mr-1 h-3 w-3" />
                              Download Failed Data
                            </Button>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {bulkUploadResult.errors.map((error, index: number) => (
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
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsBulkUploadOpen(false);
                        setBulkFile(null);
                        setBulkUploadResult(null);
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleDownloadAll}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {selectedCategory ? "Edit Subject Category" : "Add New Subject Category"}
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <SubjectCategoryForm
                  initialData={selectedCategory}
                  onSubmit={handleFormSubmit}
                  onCancel={() => setIsFormOpen(false)}
                  isLoading={false}
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
            <Button variant="outline" onClick={() => {}}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[700px]" style={{ tableLayout: "fixed" }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 60, background: "#f3f4f6", color: "#374151" }}>#</TableHead>
                    <TableHead style={{ width: 220, background: "#f3f4f6", color: "#374151" }}>Name</TableHead>
                    <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151" }}>Code</TableHead>
                    <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151" }}>Status</TableHead>
                    <TableHead style={{ width: 140, background: "#f3f4f6", color: "#374151" }}>Actions</TableHead>
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
                  ) : filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No subject categories found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category, idx) => (
                      <TableRow key={category.id} className="group">
                        <TableCell style={{ width: 60 }}>{idx + 1}</TableCell>
                        <TableCell style={{ width: 220 }}>{category.name}</TableCell>
                        <TableCell style={{ width: 120 }}>{category.code}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          {category.disabled ? (
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
                              onClick={() => handleEdit(category)}
                              className="h-5 w-5 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(category.id)}
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

export default SubjectCategoriesPage;
