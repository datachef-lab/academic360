import React, { useState } from "react";
import { PlusCircle, Edit, Trash2, Download, Upload } from "lucide-react";
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
import { useAddons } from "@/hooks/useFees";
import { AddOn } from "@/types/fees";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const AddonPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<AddOn | null>(null);
  const [editingItem, setEditingItem] = useState<AddOn | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [form, setForm] = useState<{ name: string }>({ name: "" });

  const { addons, loading, addAddon, updateAddonById, deleteAddonById } = useAddons();

  // Filter addons based on search text
  const filteredAddons =
    addons?.filter((addon) => {
      const searchLower = searchText.toLowerCase();
      return addon.name?.toLowerCase().includes(searchLower);
    }) || [];

  const handleDownloadTemplate = () => {
    const templateData = [["Addon Name"], ["Example Addon"]];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "addons_template.xlsx");
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
              await addAddon({
                name: row["Addon Name"] || "",
              } as AddOn);
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
    if (!addons || addons.length === 0) {
      toast.warning("No data to download");
      return;
    }

    const data = [
      ["ID", "Addon Name", "Created At", "Updated At"],
      ...addons.map((a) => [
        a.id || "",
        a.name || "",
        a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "",
        a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : "",
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Addons");
    XLSX.writeFile(wb, `addons_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Data downloaded successfully");
  };

  const handleSubmit = async () => {
    const trimmedName = form.name.trim();

    if (!trimmedName) {
      toast.warning("Please enter an addon name");
      return;
    }

    // Check for duplicate names (excluding current item if editing)
    if (addons && addons.length > 0) {
      const duplicate = addons.find(
        (a) => a.name.toLowerCase() === trimmedName.toLowerCase() && a.id !== editingItem?.id,
      );
      if (duplicate) {
        toast.warning("An addon with this name already exists. Please use a different name.");
        return;
      }
    }

    try {
      if (editingItem) {
        const result = await updateAddonById(editingItem.id!, { name: trimmedName });
        if (!result) {
          toast.error("Failed to update addon. Please try again.");
          return;
        }
        toast.success("Addon updated successfully");
      } else {
        const result = await addAddon({ name: trimmedName } as AddOn);
        if (!result) {
          toast.error("Failed to create addon. Please try again.");
          return;
        }
        toast.success("Addon created successfully");
      }
      handleClose();
    } catch (error) {
      console.error("Error saving addon:", error);
      toast.error("Failed to save addon. Please try again.");
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({ name: "" });
  };

  const handleEdit = (addon: AddOn) => {
    setEditingItem(addon);
    setForm({ name: addon.name });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setForm({ name: "" });
    setShowModal(true);
  };

  const handleDeleteClick = (addon: AddOn) => {
    setDeletingItem(addon);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      const result = await deleteAddonById(deletingItem.id!);
      if (result) {
        toast.success("Addon deleted successfully");
        setDeletingItem(null);
      }
      // Error message is already shown by the hook via showError
    } catch (error) {
      console.error("Error deleting addon:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete addon. Please try again.";
      toast.error(errorMessage);
      throw error; // Re-throw to prevent modal from closing
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <Card className="border-none">
          <CardHeader className="flex flex-row items-center mb-3 justify-between border rounded-md p-4 bg-background">
            <div>
              <CardTitle className="flex items-center">
                <PlusCircle className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
                Addon Fees
              </CardTitle>
              <div className="text-muted-foreground">Manage addon fees details</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading addons...</div>
            </div>
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
              <PlusCircle className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Addon Fees
            </CardTitle>
            <div className="text-muted-foreground">Manage addon fees details</div>
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
                  <DialogTitle>Bulk Upload Addons</DialogTitle>
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
              <AlertDialogContent className="sm:max-w-[500px]">
                <AlertDialogHeader>
                  <AlertDialogTitle>{editingItem ? "Edit Addon" : "Add New Addon"}</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="py-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="name">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length > 0 && value[0] === " ") return;
                        setForm({ name: value });
                      }}
                      placeholder="Enter addon name"
                      maxLength={255}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && form.name.trim()) handleSubmit();
                        if (e.key === "Escape") handleClose();
                      }}
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
              <Table className="border rounded-md min-w-[600px]" style={{ tableLayout: "fixed" }}>
                <TableHeader style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 60 }}>ID</TableHead>
                    <TableHead style={{ width: 400 }}>Addon Name</TableHead>
                    <TableHead style={{ width: 140 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAddons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        No addons found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAddons.map((row) => (
                      <TableRow key={row.id} className="group">
                        <TableCell style={{ width: 60 }}>{row.id}</TableCell>
                        <TableCell style={{ width: 400 }}>{row.name}</TableCell>
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={(open) => {
          setShowDeleteModal(open);
          if (!open) {
            setDeletingItem(null);
          }
        }}
        title="Delete Addon"
        itemName={deletingItem?.name || ""}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default AddonPage;
