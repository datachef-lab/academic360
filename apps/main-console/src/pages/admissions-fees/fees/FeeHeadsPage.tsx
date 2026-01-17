import React, { useState } from "react";
import { Layers, Edit, Trash2, Download, Upload, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useFeesHeads } from "@/hooks/useFees";
import { FeesHead } from "@/types/fees";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { toast } from "sonner";
import { NewFeesHead } from "@/services/fees-api";
import * as XLSX from "xlsx";

const FeeHeadsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeesHead | null>(null);
  const [deletingItem, setDeletingItem] = useState<FeesHead | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [form, setForm] = useState<{
    name: string;
    sequence: number | undefined;
    remarks: string;
  }>({
    name: "",
    sequence: undefined,
    remarks: "",
  });

  const { feesHeads, loading, addFeesHead, updateFeesHeadById, deleteFeesHeadById } = useFeesHeads();

  // Filter fee heads based on search text
  const filteredFeesHeads =
    feesHeads?.filter((head) => {
      const searchLower = searchText.toLowerCase();
      return (
        head.name?.toLowerCase().includes(searchLower) ||
        head.remarks?.toLowerCase().includes(searchLower) ||
        head.sequence?.toString().includes(searchText)
      );
    }) || [];

  const handleDownloadTemplate = () => {
    const templateData = [
      ["Head Name", "Sequence", "Remarks"],
      ["Example Head", "1", "Example remarks"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "fee_heads_template.xlsx");
    toast.success("Template downloaded successfully");
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      toast.warning("Please select a file to upload");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            toast.error("The uploaded file does not contain any sheets");
            return;
          }
          const sheetName = workbook.SheetNames[0];
          if (!sheetName || typeof sheetName !== "string") {
            toast.error("The uploaded file does not contain any sheets");
            return;
          }
          const worksheet = workbook.Sheets[sheetName];
          if (!worksheet) {
            toast.error("Failed to read worksheet from the uploaded file");
            return;
          }
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Process and upload data
          let successCount = 0;
          let errorCount = 0;

          for (const row of jsonData as any[]) {
            try {
              await addFeesHead({
                name: row["Head Name"] || "",
                sequence: row["Sequence"] ? parseInt(row["Sequence"]) : undefined,
                remarks: row["Remarks"] || null,
              } as NewFeesHead);
              successCount++;
            } catch (error) {
              errorCount++;
              console.error("Error uploading row:", error);
            }
          }

          toast.success(`Bulk upload completed: ${successCount} successful, ${errorCount} failed`);
          setIsBulkUploadOpen(false);
          setBulkFile(null);
        } catch (error) {
          console.error("Error processing file:", error);
          toast.error("Failed to process file. Please check the format.");
        }
      };
      reader.readAsArrayBuffer(bulkFile);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    }
  };

  const handleDownloadAll = () => {
    if (!feesHeads || feesHeads.length === 0) {
      toast.warning("No data to download");
      return;
    }

    const data = [
      ["ID", "Head Name", "Sequence", "Remarks"],
      ...feesHeads.map((h) => [h.id || "", h.name || "", h.sequence || "", h.remarks || ""]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fee Heads");
    XLSX.writeFile(wb, `fee_heads_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Data downloaded successfully");
  };

  /* ----------------------- SUBMIT ----------------------- */
  const handleSubmit = async () => {
    const name = form.name.trim();
    const remarks = form.remarks.trim();

    if (!name) {
      toast.warning("Please enter fee head name");
      return;
    }

    // Sequence is optional, but if provided, it must be at least 1
    if (form.sequence !== undefined && form.sequence !== null && form.sequence < 1) {
      toast.warning("Sequence must be at least 1 if provided");
      return;
    }

    // Duplicate name check
    const duplicate = feesHeads?.find((h) => h.name.toLowerCase() === name.toLowerCase() && h.id !== editingItem?.id);
    if (duplicate) {
      toast.warning("Fee head with this name already exists");
      return;
    }

    try {
      const feesHeadData: NewFeesHead = {
        name,
        sequence: form.sequence ?? 0,
        remarks: remarks || null,
      };

      if (editingItem) {
        await updateFeesHeadById(editingItem.id!, feesHeadData);
      } else {
        await addFeesHead(feesHeadData);
      }
      handleClose();
      toast.success(editingItem ? "Fee head updated successfully" : "Fee head created successfully");
    } catch (error) {
      console.error("Error saving fee head:", error);
      toast.error("Failed to save fee head");
    }
  };

  /* ----------------------- HANDLERS ----------------------- */
  const handleEdit = (item: FeesHead) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      sequence: item.sequence,
      remarks: item.remarks || "",
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setForm({
      name: "",
      sequence: undefined,
      remarks: "",
    });
    setShowModal(true);
  };

  const handleDeleteClick = (item: FeesHead) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      await deleteFeesHeadById(deletingItem.id!);
      toast.success("Fee head deleted successfully");
      setDeletingItem(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete fee head");
      throw error; // Re-throw to prevent modal from closing
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({ name: "", sequence: undefined, remarks: "" });
  };

  /* ----------------------- LOADING ----------------------- */
  if (loading) {
    return (
      <div className="p-4">
        <Card className="border-none">
          <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
            <div>
              <CardTitle className="flex items-center">
                <Layers className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
                Fee Heads
              </CardTitle>
              <div className="text-muted-foreground">Define fee head types</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading fee heads...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ----------------------- UI ----------------------- */
  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <Layers className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Fee Heads
            </CardTitle>
            <div className="text-muted-foreground">Define fee head types</div>
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
                  <DialogTitle>Bulk Upload Fee Heads</DialogTitle>
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

            <AlertDialog open={showModal} onOpenChange={setShowModal}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="default"
                  onClick={handleAddNew}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-[700px]">
                <AlertDialogHeader>
                  <AlertDialogTitle>{editingItem ? "Edit Fee Head" : "Add New Fee Head"}</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Head Name */}
                    <div className="flex flex-col gap-2">
                      <Label>
                        Head Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Enter head name"
                        autoFocus
                      />
                    </div>

                    {/* Sequence */}
                    <div className="flex flex-col gap-2">
                      <Label>Sequence</Label>
                      <Input
                        type="number"
                        min="1"
                        value={form.sequence ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            sequence: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                        placeholder="Enter sequence number"
                      />
                    </div>

                    {/* Remarks – full width */}
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label>Remarks</Label>
                      <Input
                        value={form.remarks}
                        onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                        placeholder="Optional remarks"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="secondary" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!form.name.trim()}>
                      {editingItem ? "Update" : "Save"}
                    </Button>
                  </div>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <div className="bg-background p-4 border-b flex items-center gap-2 mb-0 justify-between">
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
                <TableHeader style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 60 }}>ID</TableHead>
                    <TableHead style={{ width: 250 }}>Head Name</TableHead>
                    <TableHead style={{ width: 150 }}>Sequence</TableHead>
                    <TableHead style={{ width: 300 }}>Remarks</TableHead>
                    <TableHead style={{ width: 140 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeesHeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No fee heads found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFeesHeads.map((row) => (
                      <TableRow key={row.id} className="group">
                        <TableCell style={{ width: 60 }}>{row.id}</TableCell>
                        <TableCell style={{ width: 250 }}>{row.name}</TableCell>
                        <TableCell style={{ width: 150 }}>{row.sequence || "-"}</TableCell>
                        <TableCell style={{ width: 300 }}>{row.remarks || "-"}</TableCell>
                        <TableCell style={{ width: 120 }}>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(row)} className="h-5 w-5 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteClick(row)}
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

      {/* ----------------------- DELETE MODAL ----------------------- */}
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={(open) => {
          setShowDeleteModal(open);
          if (!open) {
            setDeletingItem(null);
          }
        }}
        title="Delete Fee Head"
        itemName={deletingItem?.name || ""}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default FeeHeadsPage;
