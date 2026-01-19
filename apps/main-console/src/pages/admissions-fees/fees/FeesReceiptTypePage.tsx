import React, { useState } from "react";
import { Edit, ReceiptIndianRupee, Trash2, Download, Upload, PlusCircle } from "lucide-react";
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
import { useFeesReceiptTypes } from "@/hooks/useFees";
import { FeesReceiptType } from "@/types/fees";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { toast } from "sonner";
import * as XLSX from "xlsx";

type ReceiptTypeForm = {
  name: string;
};

const EMPTY_FORM: ReceiptTypeForm = {
  name: "",
};

const FeesReceiptTypePage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeesReceiptType | null>(null);
  const [deletingItem, setDeletingItem] = useState<FeesReceiptType | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [form, setForm] = useState<ReceiptTypeForm>(EMPTY_FORM);

  const { feesReceiptTypes, loading, addFeesReceiptType, updateFeesReceiptTypeById, deleteFeesReceiptTypeById } =
    useFeesReceiptTypes();

  // Filter receipt types based on search text
  const filteredReceiptTypes = feesReceiptTypes.filter((receipt) => {
    const searchLower = searchText.toLowerCase();
    return receipt.name?.toLowerCase().includes(searchLower);
  });

  const handleDownloadTemplate = () => {
    const templateData = [["Name"], ["Example Receipt"]];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "fees_receipt_types_template.xlsx");
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
              await addFeesReceiptType({
                name: row["Name"] || "",
              });
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
    if (!feesReceiptTypes.length) {
      toast.warning("No data to download");
      return;
    }

    const data = [["ID", "Name"], ...feesReceiptTypes.map((r) => [r.id ?? "", r.name])];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fees Receipt Types");
    XLSX.writeFile(wb, `fees_receipt_types_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Data downloaded successfully");
  };

  /* -------------------- SAVE -------------------- */
  const handleSubmit = async () => {
    const name = form.name.trim();

    if (!name) {
      toast.warning("Name is required");
      return;
    }

    const duplicate = feesReceiptTypes.find(
      (r) => r.name.toLowerCase() === name.toLowerCase() && r.id !== editingItem?.id,
    );
    if (duplicate) {
      toast.warning("Receipt type with this name already exists");
      return;
    }

    try {
      const receiptTypeData = {
        name,
      };

      if (editingItem) {
        await updateFeesReceiptTypeById(editingItem.id!, receiptTypeData);
      } else {
        await addFeesReceiptType(receiptTypeData);
      }
      handleClose();
      toast.success(editingItem ? "Receipt type updated successfully" : "Receipt type created successfully");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save receipt type");
    }
  };

  /* -------------------- HANDLERS -------------------- */
  const handleEdit = (item: FeesReceiptType) => {
    setEditingItem(item);
    setForm({
      name: item.name,
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const handleDeleteClick = (item: FeesReceiptType) => {
    setDeletingItem(item);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;
    try {
      await deleteFeesReceiptTypeById(deletingItem.id!);
      toast.success("Receipt type deleted successfully");
      setDeletingItem(null);
    } catch (error) {
      console.error("Error deleting receipt type:", error);
      toast.error("Failed to delete receipt type");
      throw error; // Re-throw to prevent modal from closing
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm(EMPTY_FORM);
  };

  /* -------------------- LOADING -------------------- */
  if (loading) {
    return (
      <div className="p-4">
        <Card className="border-none">
          <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
            <div>
              <CardTitle className="flex items-center">
                <ReceiptIndianRupee className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
                Fees Receipt Types
              </CardTitle>
              <div className="text-muted-foreground">Manage receipt & challan types</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64 text-lg">Loading receipt types...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Card className="border-none">
        <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
          <div>
            <CardTitle className="flex items-center">
              <ReceiptIndianRupee className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Fees Receipt Types
            </CardTitle>
            <div className="text-muted-foreground">Manage receipt & challan types</div>
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
                  <DialogTitle>Bulk Upload Fees Receipt Types</DialogTitle>
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
              <AlertDialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle>{editingItem ? "Edit Receipt Type" : "Add Receipt Type"}</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="py-4">
                  <div className="flex flex-col gap-2">
                    <Label>
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Enter receipt type name"
                      autoFocus
                    />
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
                    <TableHead style={{ width: 400 }}>Name</TableHead>
                    <TableHead style={{ width: 140 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceiptTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        No receipt types found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReceiptTypes.map((row) => (
                      <TableRow key={row.id} className="group">
                        <TableCell style={{ width: 60 }}>{row.id}</TableCell>
                        <TableCell style={{ width: 400 }}>{row.name}</TableCell>
                        <TableCell style={{ width: 140 }}>
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

      {/* DELETE CONFIRM */}
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={(open) => {
          setShowDeleteModal(open);
          if (!open) {
            setDeletingItem(null);
          }
        }}
        title="Delete Receipt Type"
        itemName={deletingItem?.name || ""}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default FeesReceiptTypePage;
