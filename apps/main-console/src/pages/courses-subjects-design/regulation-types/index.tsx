import React from "react";
import { RegulationTypeForm } from "./regulation-type-form";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Scale, Download, Upload, Edit, Trash2 } from "lucide-react";
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
import { RegulationType } from "@repo/db/index";
import {
  getRegulationTypes,
  createRegulationType,
  updateRegulationType,
  deleteRegulationType,
  bulkUploadRegulationTypes,
  BulkUploadResult,
  DeleteResult,
} from "@/services/course-design.api";
import * as XLSX from "xlsx";

const RegulationTypesPage = () => {
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedRegulationType, setSelectedRegulationType] = React.useState<RegulationType | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);
  const [regulationTypes, setRegulationTypes] = React.useState<RegulationType[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [bulkUploadResult, setBulkUploadResult] = React.useState<BulkUploadResult | null>(null);
  const [isBulkUploading, setIsBulkUploading] = React.useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetchRegulationTypes();
  }, []);

  const fetchRegulationTypes = async () => {
    setLoading(true);
    try {
      const res = await getRegulationTypes();
      setRegulationTypes(Array.isArray(res) ? res : []);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch regulation types";
      setError(errorMessage);
      toast.error("Failed to fetch regulation types");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (regulationType: RegulationType): void => {
    setSelectedRegulationType(regulationType);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    try {
      const result: DeleteResult = await deleteRegulationType(id);
      if (result.success) {
        toast.success(result.message || "Regulation type deleted successfully");
        fetchRegulationTypes();
      } else {
        const details = (result.records || [])
          .filter((r) => r.count > 0)
          .map((r) => `${r.type}: ${r.count}`)
          .join(", ");
        toast.error(`${result.message}${details ? ` — ${details}` : ""}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to delete regulation type: ${errorMessage}`);
    }
  };

  const handleAddNew = () => {
    setSelectedRegulationType(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: Omit<RegulationType, "id" | "createdAt" | "updatedAt">) => {
    setIsFormSubmitting(true);
    try {
      if (selectedRegulationType) {
        await updateRegulationType(selectedRegulationType.id!, data);
        toast.success("Regulation type updated successfully");
      } else {
        await createRegulationType(data);
        toast.success("Regulation type created successfully");
      }
      setIsFormOpen(false);
      fetchRegulationTypes();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to ${selectedRegulationType ? "update" : "create"} regulation type: ${errorMessage}`);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedRegulationType(null);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setIsBulkUploading(true);
    try {
      const result = await bulkUploadRegulationTypes(bulkFile);
      setBulkUploadResult(result);
      if (result.summary.successful > 0) {
        toast.success(`Successfully uploaded ${result.summary.successful} regulation types`);
        fetchRegulationTypes();
      }
      if (result.summary.failed > 0) {
        toast.error(`${result.summary.failed} regulation types failed to upload`);
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
      { Name: "Choice Based Credit System", ShortName: "CBCS", Sequence: 1, Disabled: false },
      { Name: "Outcome Based Education", ShortName: "OBE", Sequence: 2, Disabled: false },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Regulation Types Template");
    XLSX.writeFile(wb, "regulation-type-bulk-upload-template.xlsx");
  };

  const handleDownloadAll = async () => {
    try {
      const res = await getRegulationTypes();
      const data = (Array.isArray(res) ? res : []).map((type: RegulationType) => ({
        ID: type.id,
        Name: type.name,
        "Short Name": type.shortName || "-",
        Sequence: type.sequence || "-",
        Active: type.isActive ? "Yes" : "No",
        "Created At": type.createdAt,
        "Updated At": type.updatedAt,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Regulation Types");
      XLSX.writeFile(wb, "regulation-types.xlsx");
    } catch {
      toast.error("Failed to download regulation types");
    }
  };

  const handleDownloadFailedData = () => {
    if (!bulkUploadResult || !bulkUploadResult.errors || bulkUploadResult.errors.length === 0) {
      toast.error("No failed data to download");
      return;
    }
    try {
      const failedData = bulkUploadResult.errors.map(
        (error: { row: number; error: string; data: Record<string, unknown> }) => ({
          "Row Number": error.row,
          "Error Message": error.error,
          "Original Data": JSON.stringify(error.data),
          Name: error.data[0] || "",
          "Short Name": error.data[1] || "",
          Sequence: error.data[2] || "",
          Disabled: error.data[3] || "",
        }),
      );
      const ws = XLSX.utils.json_to_sheet(failedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Failed Regulation Types");
      XLSX.writeFile(wb, "failed-regulation-types-upload.xlsx");
      toast.success("Failed data downloaded successfully");
    } catch {
      toast.error("Failed to download error data");
    }
  };

  const filteredRegulationTypes = regulationTypes.filter(
    (type) =>
      type.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (type.shortName?.toLowerCase().includes(searchText.toLowerCase()) ?? false),
  );

  if (loading) {
    return (
      <div className="p-2 sm:p-4">
        <Card className="border-none">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">Loading regulation types...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 sm:p-4">
        <Card className="border-none">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-red-600">Error: {error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center mb-3 justify-between gap-4 border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <Scale className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400 flex-shrink-0" />
              <span className="truncate">Regulation Types</span>
            </CardTitle>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">A list of all regulation types.</div>
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
                  <DialogTitle>Bulk Upload Regulation Types</DialogTitle>
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
                            {bulkUploadResult.errors.map(
                              (error: { row: number; error: string; data: Record<string, unknown> }, index: number) => (
                                <div key={index} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                                  <span className="font-medium">Row {error.row}:</span> {error.error}
                                </div>
                              ),
                            )}
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
            <Button variant="outline" onClick={handleDownloadTemplate} className="flex-shrink-0">
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Download Template</span>
              <span className="sm:hidden">Template</span>
            </Button>
            <AlertDialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <AlertDialogTrigger asChild>
                <Button onClick={handleAddNew} className="bg-purple-600 hover:bg-purple-700 text-white flex-shrink-0">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-[95vw] sm:w-full max-w-lg">
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {selectedRegulationType ? "Edit Regulation Type" : "Add New Regulation Type"}
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <RegulationTypeForm
                  initialData={selectedRegulationType}
                  onSubmit={handleFormSubmit}
                  onCancel={handleFormCancel}
                  isLoading={isFormSubmitting}
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
            <Button variant="outline" onClick={handleDownloadAll} className="flex-shrink-0">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Download</span>
            </Button>
          </div>
          {/* Table View - Keep original table UI on all screens */}
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[900px]" style={{ tableLayout: "fixed" }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 60, background: "#f3f4f6", color: "#374151" }}>#</TableHead>
                    <TableHead style={{ width: 220, background: "#f3f4f6", color: "#374151" }}>Name</TableHead>
                    <TableHead style={{ width: 220, background: "#f3f4f6", color: "#374151" }}>Short Name</TableHead>
                    <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151" }}>Status</TableHead>
                    <TableHead style={{ width: 140, background: "#f3f4f6", color: "#374151" }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegulationTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No regulation types found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRegulationTypes.map((type, idx) => (
                      <TableRow key={type.id} className="group">
                        <TableCell style={{ width: 60 }}>{idx + 1}</TableCell>
                        <TableCell style={{ width: 220 }}>{type.name}</TableCell>
                        <TableCell style={{ width: 220 }}>{type.shortName ?? "-"}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          {type.isActive ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ width: 120 }}>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(type)}
                              className="h-5 w-5 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(type.id)}
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

export default RegulationTypesPage;
