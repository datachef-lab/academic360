import React from "react";
import { AffiliationTypeForm } from "./affiliation-type-form";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PlusCircle, Landmark, Download, Upload, Edit } from "lucide-react";
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
import { AffiliationType } from "@/types/course-design";
import { getAffiliationTypes, createAffiliationType, updateAffiliationType, bulkUploadAffiliationTypes, BulkUploadResult } from "@/services/course-design.api";
import * as XLSX from "xlsx";

const AffiliationTypesPage = () => {
  const [searchText, setSearchText] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selectedAffiliationType, setSelectedAffiliationType] = React.useState<AffiliationType | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState<File | null>(null);
  const [affiliationTypes, setAffiliationTypes] = React.useState<AffiliationType[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [bulkUploadResult, setBulkUploadResult] = React.useState<BulkUploadResult | null>(null);
  const [isBulkUploading, setIsBulkUploading] = React.useState(false);
  const [isFormSubmitting, setIsFormSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);

  React.useEffect(() => {
    fetchAffiliationTypes();
  }, []);

  const fetchAffiliationTypes = async () => {
    setLoading(true);
    try {
      const res = await getAffiliationTypes();
      setAffiliationTypes(Array.isArray(res) ? res : []);
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch affiliation types";
      setError(errorMessage);
      toast.error("Failed to fetch affiliation types");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (affiliationType: AffiliationType): void => {
    setSelectedAffiliationType(affiliationType);
    setIsFormOpen(true);
  };


  const handleAddNew = () => {
    setSelectedAffiliationType(null);
    setIsFormOpen(true);
  };

  const handleFormSubmit = async (data: Omit<AffiliationType, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsFormSubmitting(true);
    try {
      if (selectedAffiliationType) {
        await updateAffiliationType(selectedAffiliationType.id!, data);
        toast.success("Affiliation type updated successfully");
      } else {
        await createAffiliationType(data);
        toast.success("Affiliation type created successfully");
      }
      setIsFormOpen(false);
      fetchAffiliationTypes();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to ${selectedAffiliationType ? 'update' : 'create'} affiliation type: ${errorMessage}`);
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
    setSelectedAffiliationType(null);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setIsBulkUploading(true);
    setUploadProgress(0);
    try {
      const result = await bulkUploadAffiliationTypes(bulkFile, setUploadProgress);
      setBulkUploadResult(result);
      if (result.summary.successful > 0) {
        toast.success(`Successfully uploaded ${result.summary.successful} affiliation types`);
        fetchAffiliationTypes();
      }
      if (result.summary.failed > 0) {
        toast.error(`${result.summary.failed} affiliation types failed to upload`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Bulk upload failed: ${errorMessage}`);
    } finally {
      setIsBulkUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create template data
    const templateData = [
      { Name: "University Grants Commission", Description: "UGC affiliated", Sequence: 1, Disabled: false },
      { Name: "All India Council for Technical Education", Description: "AICTE affiliated", Sequence: 2, Disabled: false },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Affiliation Types Template");
    XLSX.writeFile(wb, "affiliation-type-bulk-upload-template.xlsx");
  };

  const handleDownloadAll = async () => {
    try {
      const res = await getAffiliationTypes();
      const data = (Array.isArray(res) ? res : []).map((type: AffiliationType) => ({
        ID: type.id,
        Name: type.name,
        Description: type.description || "-",
        Sequence: type.sequence || "-",
        Disabled: type.disabled ? "Yes" : "No",
        "Created At": type.createdAt,
        "Updated At": type.updatedAt,
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Affiliation Types");
      XLSX.writeFile(wb, "affiliation-types.xlsx");
    } catch {
      toast.error("Failed to download affiliation types");
    }
  };

  const handleDownloadFailedData = () => {
    if (!bulkUploadResult || !bulkUploadResult.errors || bulkUploadResult.errors.length === 0) {
      toast.error("No failed data to download");
      return;
    }
    try {
      const failedData = bulkUploadResult.errors.map((error: { row: number; error: string; data: Record<string, unknown> }) => ({
        "Row Number": error.row,
        "Error Message": error.error,
        "Original Data": JSON.stringify(error.data),
        Name: (error.data as unknown as string[])[0] || "",
        Description: (error.data as unknown as string[])[1] || "",
        Sequence: (error.data as unknown as string[])[2] || "",
        Disabled: (error.data as unknown as string[])[3] || ""
      }));
      const ws = XLSX.utils.json_to_sheet(failedData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Failed Affiliation Types");
      XLSX.writeFile(wb, "failed-affiliation-types-upload.xlsx");
      toast.success("Failed data downloaded successfully");
    } catch {
      toast.error("Failed to download error data");
    }
  };

  const filteredAffiliationTypes = affiliationTypes.filter((type) =>
    type.name.toLowerCase().includes(searchText.toLowerCase()) ||
    (type.description?.toLowerCase().includes(searchText.toLowerCase()) ?? false)
  );

  if (loading) {
    return (
      <div className="p-4">
        <Card className="border-none">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">Loading affiliation types...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-none">
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center text-red-600">Error: {error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 sticky top-0 z-30 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <Landmark className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Affiliation Types
            </CardTitle>
            <div className="text-muted-foreground">A list of all affiliation types.</div>
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
                  <DialogTitle>Bulk Upload Affiliation Types</DialogTitle>
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
                      onChange={e => setBulkFile(e.target.files?.[0] || null)}
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
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={handleDownloadFailedData}
                              className="text-xs"
                            >
                              <Download className="mr-1 h-3 w-3" />
                              Download Failed Data
                            </Button>
                          </div>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {bulkUploadResult.errors.map((error: { row: number; error: string; data: Record<string, unknown> }, index: number) => (
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
                    <Button 
                      onClick={handleBulkUpload} 
                      disabled={!bulkFile || isBulkUploading}
                      className="flex-1"
                    >
                      {isBulkUploading ? "Uploading..." : "Upload"}
                    </Button>
                    <Button variant="outline" onClick={() => { setIsBulkUploadOpen(false); setBulkFile(null); setBulkUploadResult(null); }}>
                      Close
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              Download Template
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
                  <AlertDialogTitle>{selectedAffiliationType ? "Edit Affiliation Type" : "Add New Affiliation Type"}</AlertDialogTitle>
                </AlertDialogHeader>
                <AffiliationTypeForm
                  initialData={selectedAffiliationType}
                  onSubmit={handleFormSubmit}
                  onCancel={handleFormCancel}
                  isLoading={isFormSubmitting}
                />
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="sticky top-[72px] z-20 bg-background p-4 border-b flex items-center gap-2 mb-0 justify-between">
            <Input placeholder="Search..." className="w-64" value={searchText} onChange={e => setSearchText(e.target.value)} />
            <Button variant="outline" onClick={handleDownloadAll}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          <div className="relative" style={{ height: '600px' }}>
            <div className="overflow-y-auto overflow-x-auto h-full">
              <Table className="border rounded-md min-w-[900px]" style={{ tableLayout: 'fixed' }}>
                <TableHeader className="sticky top-0 z-10" style={{ background: '#f3f4f6' }}>
                  <TableRow>
                    <TableHead style={{ width: 60, background: '#f3f4f6', color: '#374151' }}>#</TableHead>
                    <TableHead style={{ width: 220, background: '#f3f4f6', color: '#374151' }}>Name</TableHead>
                    <TableHead style={{ width: 320, background: '#f3f4f6', color: '#374151' }}>Description</TableHead>
                    <TableHead style={{ width: 120, background: '#f3f4f6', color: '#374151' }}>Status</TableHead>
                    <TableHead style={{ width: 120, background: '#f3f4f6', color: '#374151' }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAffiliationTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No affiliation types found.</TableCell>
                    </TableRow>
                  ) : (
                    filteredAffiliationTypes.map((type, idx) => (
                      <TableRow key={type.id} className="group">
                        <TableCell style={{ width: 60 }}>{idx + 1}</TableCell>
                        <TableCell style={{ width: 220 }}>{type.name}</TableCell>
                        <TableCell style={{ width: 320 }}>{type.description ?? "-"}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          {!type.disabled ? (
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

export default AffiliationTypesPage;
