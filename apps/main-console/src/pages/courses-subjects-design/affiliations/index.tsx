import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Landmark, Download, Upload, Edit, Trash2 } from "lucide-react";
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
import { Affiliation } from "@repo/db/index";
import {
  getAffiliations,
  createAffiliation,
  updateAffiliation,
  deleteAffiliation,
  BulkUploadResult,
  bulkUploadAffiliations,
  DeleteResult,
} from "@/services/course-design.api";
import { AffiliationForm } from "./affiliation-form";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const AffiliationsPage = () => {
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedAffiliation, setSelectedAffiliation] = React.useState<Affiliation | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);
  const [affiliations, setAffiliations] = React.useState<Affiliation[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [bulkUploadResult, setBulkUploadResult] = React.useState<BulkUploadResult | null>(null);
  const [isBulkUploading, setIsBulkUploading] = React.useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  React.useEffect(() => {
    fetchAffiliations();
  }, []);

  const fetchAffiliations = async () => {
    setLoading(true);
    try {
      const res = await getAffiliations();
      setAffiliations(Array.isArray(res) ? res : []);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch affiliations";
      setError(errorMessage);
      toast.error("Failed to fetch affiliations");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (affiliation: Affiliation): void => {
    setSelectedAffiliation(affiliation);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    try {
      const result: DeleteResult = await deleteAffiliation(id);
      if (result.success) {
        toast.success(result.message || "Affiliation deleted successfully");
        fetchAffiliations();
      } else {
        const details = (result.records || [])
          .filter((r) => r.count > 0)
          .map((r) => `${r.type}: ${r.count}`)
          .join(", ");
        toast.error(`${result.message}${details ? ` — ${details}` : ""}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to delete affiliation: ${errorMessage}`);
    }
  };

  const handleAddNew = () => {
    setSelectedAffiliation(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: Omit<Affiliation, "id" | "createdAt" | "updatedAt">) => {
    setIsFormSubmitting(true);
    try {
      if (selectedAffiliation) {
        await updateAffiliation(selectedAffiliation.id!, data);
        toast.success("Affiliation updated successfully");
      } else {
        await createAffiliation(data);
        toast.success("Affiliation created successfully");
      }
      setIsFormOpen(false);
      fetchAffiliations();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to ${selectedAffiliation ? "update" : "create"} affiliation: ${errorMessage}`);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedAffiliation(null);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setIsBulkUploading(true);
    setUploadProgress(0);
    try {
      const result = await bulkUploadAffiliations(bulkFile, setUploadProgress);
      setBulkUploadResult(result);
      if (result.summary.successful > 0) {
        toast.success(`Successfully uploaded ${result.summary.successful} affiliations`);
        fetchAffiliations();
      }
      if (result.summary.failed > 0) {
        toast.error(`${result.summary.failed} affiliations failed to upload`);
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
      { Name: "University of Calcutta", "Short Name": "CU", Sequence: 1, Disabled: false, Remarks: "Main university" },
      {
        Name: "West Bengal State University",
        "Short Name": "WBSU",
        Sequence: 2,
        Disabled: false,
        Remarks: "State university",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Affiliations Template");
    XLSX.writeFile(wb, "affiliation-bulk-upload-template.xlsx");
  };

  const handleDownloadAll = async () => {
    try {
      const res = await getAffiliations();
      const data = (Array.isArray(res) ? res : []).map((aff: Affiliation) => ({
        ID: aff.id,
        Name: aff.name,
        "Short Name": aff.shortName || "-",
        Sequence: aff.sequence || "-",
        "Is Active": aff.isActive ? "Yes" : "No",
        Remarks: aff.remarks || "-",
        "Created At": aff.createdAt,
        "Updated At": aff.updatedAt,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Affiliations");
      XLSX.writeFile(wb, "affiliations.xlsx");
    } catch {
      toast.error("Failed to download affiliations");
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
          Remarks: error.data[4] || "",
        }),
      );
      const ws = XLSX.utils.json_to_sheet(failedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Failed Affiliations");
      XLSX.writeFile(wb, "failed-affiliations-upload.xlsx");
      toast.success("Failed data downloaded successfully");
    } catch {
      toast.error("Failed to download error data");
    }
  };

  const filteredAffiliations = affiliations.filter(
    (aff) =>
      aff.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (aff.shortName?.toLowerCase().includes(searchText.toLowerCase()) ?? false) ||
      (aff.remarks?.toLowerCase().includes(searchText.toLowerCase()) ?? false),
  );

  if (loading) {
    return (
      <div className="p-2 sm:p-4">
        <Card className="border-none">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">Loading affiliations...</div>
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
              <Landmark className="mr-2 h-6 w-6 sm:h-8 sm:w-8 border rounded-md p-1 border-slate-400 flex-shrink-0" />
              <span className="truncate">Affiliations</span>
            </CardTitle>
            <div className="text-xs sm:text-sm text-muted-foreground mt-1">A list of all affiliations.</div>
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
                  <DialogTitle>Bulk Upload Affiliations</DialogTitle>
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
            <Button variant="outline" onClick={handleDownloadAll} className="flex-shrink-0">
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Download</span>
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
                    {selectedAffiliation ? "Edit Affiliation" : "Add New Affiliation"}
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <AffiliationForm
                  initialData={selectedAffiliation}
                  onSubmit={handleFormSubmit}
                  onCancel={handleFormCancel}
                  isLoading={isFormSubmitting}
                />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-2 sm:p-4 border-b">
            <Input
              placeholder="Search..."
              className="w-full sm:w-64"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          {/* Table View - Keep original table UI on all screens */}
          <div className="relative" style={{ height: "600px" }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[900px]" style={{ tableLayout: "fixed" }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 60, background: "#f3f4f6", color: "#374151" }}>#</TableHead>
                    <TableHead style={{ width: 220, background: "#f3f4f6", color: "#374151" }}>Name</TableHead>
                    <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151" }}>Short Name</TableHead>
                    <TableHead style={{ width: 320, background: "#f3f4f6", color: "#374151" }}>Remarks</TableHead>
                    <TableHead style={{ width: 120, background: "#f3f4f6", color: "#374151" }}>Status</TableHead>
                    <TableHead style={{ width: 140, background: "#f3f4f6", color: "#374151" }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffiliations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No affiliations found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAffiliations.map((aff, idx) => (
                      <TableRow key={aff.id} className="group">
                        <TableCell style={{ width: 60 }}>{idx + 1}</TableCell>
                        <TableCell style={{ width: 220 }}>{aff.name}</TableCell>
                        <TableCell style={{ width: 120 }}>{aff.shortName ?? "-"}</TableCell>
                        <TableCell style={{ width: 320 }}>{aff.remarks ?? "-"}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          {aff.isActive ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ width: 120 }}>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(aff)} className="h-5 w-5 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(aff.id)}
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

export default AffiliationsPage;
