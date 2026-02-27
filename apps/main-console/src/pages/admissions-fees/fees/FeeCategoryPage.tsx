import React, { useState } from "react";
import { FolderTree, Edit, Trash2, Download, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useFeeCategories } from "@/hooks/useFees";
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
  const [form, setForm] = useState<{
    name: string;
    description: string;
  }>({
    name: "",
    description: "",
  });

  const { feeCategories, loading, addFeeCategory, updateFeeCategoryById, deleteFeeCategoryById } = useFeeCategories();

  // Filter fee categories based on search text
  const filteredFeeCategories =
    feeCategories?.filter((category) => {
      const searchLower = searchText.toLowerCase();
      return (
        category.name?.toLowerCase().includes(searchLower) || category.description?.toLowerCase().includes(searchLower)
      );
    }) || [];

  const handleDownloadAll = () => {
    if (!feeCategories || feeCategories.length === 0) {
      toast.warning("No data to download");
      return;
    }

    const data = [
      ["ID", "Category Name", "Description"],
      ...feeCategories.map((c) => [c.id || "", c.name || "", c.description || ""]),
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

    // Check for duplicate name
    if (feeCategories && feeCategories.length > 0) {
      const duplicate = feeCategories.find(
        (c) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== editingItem?.id,
      );
      if (duplicate) {
        toast.warning("A category with this name already exists.");
        return;
      }
    }

    try {
      const categoryData: NewFeeCategory = {
        name: trimmedName,
        description: trimmedDescription || null,
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
      name: "",
      description: "",
    });
  };

  const handleEdit = (category: FeeCategoryDto) => {
    setEditingItem(category);
    setForm({
      name: category.name,
      description: category.description || "",
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setForm({
      name: "",
      description: "",
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
            <div className="overflow-y-auto h-full">
              <Table className="border rounded-md" style={{ tableLayout: "fixed", width: "100%" }}>
                <TableHeader style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: "5%", whiteSpace: "nowrap" }}>Sr. No.</TableHead>
                    <TableHead style={{ width: "30%" }}>Category Name</TableHead>
                    <TableHead style={{ width: "50%" }}>Description</TableHead>
                    <TableHead style={{ width: "15%" }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeeCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        No fee categories found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFeeCategories.map((row, index) => (
                      <TableRow key={row.id} className="group">
                        <TableCell style={{ width: "5%" }}>{index + 1}</TableCell>
                        <TableCell style={{ width: "30%" }} className="truncate" title={row.name}>
                          {row.name}
                        </TableCell>
                        <TableCell style={{ width: "50%" }} className="truncate" title={row.description || ""}>
                          {row.description || <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell style={{ width: "15%" }}>
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
