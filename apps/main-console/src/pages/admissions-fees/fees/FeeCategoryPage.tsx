import React, { useState } from "react";
import { FolderTree, Edit, Trash2, Download, Upload, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useFeeCategories, useFeeConcessionSlabs } from "@/hooks/useFees";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { FeeCategoryDto } from "@repo/db/dtos/fees";
import { toast } from "sonner";
import { NewFeeCategory } from "@/services/fees-api";
import * as XLSX from "xlsx";

const FeeCategoryPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<FeeCategoryDto | null>(null);
  const [editingItem, setEditingItem] = useState<FeeCategoryDto | null>(null);
  const [searchText, setSearchText] = useState("");
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [form, setForm] = useState<{
    feeConcessionSlabId: number | undefined;
    name: string;
    description: string;
    priority: number | undefined;
    validityType: "SEMESTER" | "ACADEMIC_YEAR" | "PROGRAM_COURSE";
    isCarryForwarded: boolean;
  }>({
    feeConcessionSlabId: undefined,
    name: "",
    description: "",
    priority: undefined,
    validityType: "SEMESTER",
    isCarryForwarded: false,
  });

  const { feeCategories, loading, addFeeCategory, updateFeeCategoryById, deleteFeeCategoryById } = useFeeCategories();
  const { concessionSlabs } = useFeeConcessionSlabs();

  // Filter fee categories based on search text
  const filteredFeeCategories =
    feeCategories?.filter((category) => {
      const searchLower = searchText.toLowerCase();
      return (
        category.name?.toLowerCase().includes(searchLower) ||
        category.description?.toLowerCase().includes(searchLower) ||
        category.priority?.toString().includes(searchText) ||
        category.validityType?.toLowerCase().includes(searchLower) ||
        category.feeConcessionSlab?.name?.toLowerCase().includes(searchLower)
      );
    }) || [];

  const handleDownloadTemplate = () => {
    const templateData = [
      ["Concession Slab ID", "Category Name", "Description", "Priority", "Validity Type", "Carry Forwarded"],
      ["1", "Example Category", "Example description", "1", "SEMESTER", "false"],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "fee_categories_template.xlsx");
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

          for (const row of jsonData as Record<string, unknown>[]) {
            try {
              await addFeeCategory({
                feeConcessionSlabId: parseInt(String(row["Concession Slab ID"] || "0")),
                name: String(row["Category Name"] || ""),
                description: String(row["Description"] || ""),
                priority: parseInt(String(row["Priority"] || "0")),
                validityType: String(row["Validity Type"] || "SEMESTER") as
                  | "SEMESTER"
                  | "ACADEMIC_YEAR"
                  | "PROGRAM_COURSE",
                isCarryForwarded: String(row["Carry Forwarded"] || "false").toLowerCase() === "true",
              } as NewFeeCategory);
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
    if (!feeCategories || feeCategories.length === 0) {
      toast.warning("No data to download");
      return;
    }

    const data = [
      ["ID", "Concession Slab", "Category Name", "Description", "Priority", "Validity Type", "Carry Forwarded"],
      ...feeCategories.map((c) => [
        c.id || "",
        c.feeConcessionSlab?.name || "",
        c.name || "",
        c.description || "",
        c.priority || "",
        c.validityType || "",
        c.isCarryForwarded ? "Yes" : "No",
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fee Categories");
    XLSX.writeFile(wb, `fee_categories_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Data downloaded successfully");
  };

  const handleSubmit = async () => {
    const trimmedName = form.name.trim();
    const trimmedDescription = form.description.trim();

    if (!trimmedName) {
      toast.warning("Please enter a category name");
      return;
    }

    if (!form.feeConcessionSlabId) {
      toast.warning("Please select a fee concession slab");
      return;
    }

    if (form.priority === undefined || form.priority === null || form.priority < 1) {
      toast.warning("Priority must be at least 1");
      return;
    }

    // Check for duplicate name + concession slab + validity type combination
    if (feeCategories && feeCategories.length > 0) {
      const duplicate = feeCategories.find(
        (c) =>
          c.name.toLowerCase() === trimmedName.toLowerCase() &&
          c.feeConcessionSlab?.id === form.feeConcessionSlabId &&
          c.validityType === form.validityType &&
          c.id !== editingItem?.id,
      );
      if (duplicate) {
        toast.warning("A category with this name, concession slab, and validity type already exists.");
        return;
      }
    }

    // Check for duplicate priority
    if (feeCategories && feeCategories.length > 0) {
      const duplicatePriority = feeCategories.find((c) => c.priority === form.priority && c.id !== editingItem?.id);
      if (duplicatePriority) {
        toast.warning("A category with this priority already exists. Priority must be unique.");
        return;
      }
    }

    try {
      const categoryData: NewFeeCategory = {
        feeConcessionSlabId: form.feeConcessionSlabId!,
        name: trimmedName,
        description: trimmedDescription || "",
        priority: form.priority!,
        validityType: form.validityType,
        isCarryForwarded: form.isCarryForwarded,
      };

      if (editingItem) {
        const result = await updateFeeCategoryById(editingItem.id!, categoryData);
        if (!result) {
          toast.error("Failed to update fee category. Please try again.");
          return;
        }
        toast.success("Fee category updated successfully");
      } else {
        const result = await addFeeCategory(categoryData);
        if (!result) {
          toast.error("Failed to create fee category. Please try again.");
          return;
        }
        toast.success("Fee category created successfully");
      }
      handleClose();
    } catch (error) {
      console.error("Error saving fee category:", error);
      toast.error("Failed to save fee category. Please try again.");
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({
      feeConcessionSlabId: undefined,
      name: "",
      description: "",
      priority: undefined,
      validityType: "SEMESTER",
      isCarryForwarded: false,
    });
  };

  const handleEdit = (category: FeeCategoryDto) => {
    setEditingItem(category);
    setForm({
      feeConcessionSlabId: category.feeConcessionSlab?.id,
      name: category.name,
      description: category.description || "",
      priority: category.priority,
      validityType: category.validityType as "SEMESTER" | "ACADEMIC_YEAR" | "PROGRAM_COURSE",
      isCarryForwarded: category.isCarryForwarded ?? false,
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setForm({
      feeConcessionSlabId: undefined,
      name: "",
      description: "",
      priority: undefined,
      validityType: "SEMESTER",
      isCarryForwarded: false,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (category: FeeCategoryDto) => {
    setDeletingItem(category);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      const result = await deleteFeeCategoryById(deletingItem.id!);
      if (!result) {
        toast.error("Failed to delete fee category. Please try again.");
        throw new Error("Delete failed");
      }
      toast.success("Fee category deleted successfully");
      setDeletingItem(null);
    } catch (error) {
      console.error("Error deleting fee category:", error);
      toast.error("Failed to delete fee category. Please try again.");
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
                <FolderTree className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
                Fee Categories
              </CardTitle>
              <div className="text-muted-foreground">Manage fee categories</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading fee categories...</div>
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
              <FolderTree className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Fee Categories
            </CardTitle>
            <div className="text-muted-foreground">Manage fee categories</div>
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
                  <DialogTitle>Bulk Upload Fee Categories</DialogTitle>
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
              <AlertDialogContent className="sm:max-w-[800px]">
                <AlertDialogHeader>
                  <AlertDialogTitle>{editingItem ? "Edit Fee Category" : "Add New Fee Category"}</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Fee Concession Slab */}
                    <div className="flex flex-col gap-2">
                      <Label>
                        Fee Concession Slab <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.feeConcessionSlabId?.toString() || ""}
                        onValueChange={(value) => setForm({ ...form, feeConcessionSlabId: parseInt(value) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select concession slab" />
                        </SelectTrigger>
                        <SelectContent>
                          {concessionSlabs?.map((slab) => (
                            <SelectItem key={slab.id} value={slab.id!.toString()}>
                              {slab.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Category Name */}
                    <div className="flex flex-col gap-2">
                      <Label>
                        Category Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length > 0 && value[0] === " ") return;
                          setForm({ ...form, name: value });
                        }}
                        placeholder="Enter category name"
                        maxLength={255}
                        autoFocus
                      />
                    </div>

                    {/* Priority */}
                    <div className="flex flex-col gap-2">
                      <Label>
                        Priority <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={form.priority ?? ""}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            priority: e.target.value ? parseInt(e.target.value) : undefined,
                          })
                        }
                        placeholder="Enter priority (must be unique)"
                      />
                    </div>

                    {/* Validity Type */}
                    <div className="flex flex-col gap-2">
                      <Label>
                        Validity Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.validityType}
                        onValueChange={(value) => {
                          const validityType = value as "SEMESTER" | "ACADEMIC_YEAR" | "PROGRAM_COURSE";
                          // Auto-select carry forwarded for PROGRAM_COURSE and ACADEMIC_YEAR
                          const shouldCarryForward =
                            validityType === "PROGRAM_COURSE" || validityType === "ACADEMIC_YEAR";
                          setForm({
                            ...form,
                            validityType,
                            isCarryForwarded: shouldCarryForward ? true : form.isCarryForwarded,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SEMESTER">Semester</SelectItem>
                          <SelectItem value="ACADEMIC_YEAR">Academic Year</SelectItem>
                          <SelectItem value="PROGRAM_COURSE">Program Course</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description – full width */}
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label>Description</Label>
                      <Textarea
                        value={form.description}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length > 0 && value[0] === " ") return;
                          setForm({ ...form, description: value });
                        }}
                        placeholder="Enter description"
                        maxLength={500}
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    {/* Carry Forwarded */}
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isCarryForwarded"
                          checked={form.isCarryForwarded}
                          onChange={(e) => setForm({ ...form, isCarryForwarded: e.target.checked })}
                          disabled={form.validityType === "PROGRAM_COURSE" || form.validityType === "ACADEMIC_YEAR"}
                          className="h-4 w-4 rounded border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <Label htmlFor="isCarryForwarded" className="cursor-pointer">
                          Carry Forwarded
                        </Label>
                      </div>
                      {/* Reserve space for note to prevent layout shifting */}
                      <div className="min-h-[20px] ml-6">
                        {form.validityType === "ACADEMIC_YEAR" && (
                          <p className="text-sm text-red-600 font-medium">
                            Note: Carry Forwarded is automatically enabled for Academic Year validity type and applies
                            only for that academic year.
                          </p>
                        )}
                        {form.validityType === "PROGRAM_COURSE" && (
                          <p className="text-sm text-red-600 font-medium">
                            Note: Carry Forwarded is automatically enabled for Program Course validity type.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="secondary" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={!form.name.trim() || !form.feeConcessionSlabId || !form.priority}
                    >
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
              <Table className="border rounded-md" style={{ tableLayout: "fixed", width: "100%" }}>
                <TableHeader style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: "5%" }}>ID</TableHead>
                    <TableHead style={{ width: "15%" }}>Concession Slab</TableHead>
                    <TableHead style={{ width: "18%" }}>Category Name</TableHead>
                    <TableHead style={{ width: "22%" }}>Description</TableHead>
                    <TableHead style={{ width: "8%" }}>Priority</TableHead>
                    <TableHead style={{ width: "12%" }}>Validity Type</TableHead>
                    <TableHead style={{ width: "10%" }}>Carry Forward</TableHead>
                    <TableHead style={{ width: "10%" }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeeCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        No fee categories found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFeeCategories.map((row) => (
                      <TableRow key={row.id} className="group">
                        <TableCell style={{ width: "5%" }}>{row.id}</TableCell>
                        <TableCell style={{ width: "15%" }}>
                          {row.feeConcessionSlab?.name ? (
                            <Badge variant="outline" className="text-xs border-purple-300 text-purple-700 bg-purple-50">
                              {row.feeConcessionSlab.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell style={{ width: "18%" }} className="truncate" title={row.name}>
                          {row.name}
                        </TableCell>
                        <TableCell style={{ width: "22%" }} className="truncate" title={row.description || ""}>
                          {row.description || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell style={{ width: "8%" }}>
                          {row.priority || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell style={{ width: "12%" }}>
                          {row.validityType ? (
                            <Badge
                              variant="outline"
                              className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50"
                            >
                              {row.validityType.replace(/_/g, " ")}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell style={{ width: "10%" }}>
                          {row.isCarryForwarded ? (
                            <Badge variant="outline" className="text-xs border-green-300 text-green-700 bg-green-50">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs border-gray-300 text-gray-700 bg-gray-50">
                              No
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell style={{ width: "10%" }}>
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
        title="Delete Fee Category"
        itemName={deletingItem?.name || ""}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default FeeCategoryPage;
