import React, { useState } from "react";
import { PlusCircle, Edit, Trash2, FileDown } from "lucide-react";
import Header from "@/components/common/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAddons } from "@/hooks/useFees";
import { AddOn } from "@/types/fees";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { toast } from "sonner";

const AddonPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<AddOn | null>(null);
  const [editingItem, setEditingItem] = useState<AddOn | null>(null);
  const [form, setForm] = useState<{ name: string }>({ name: "" });

  const { addons, loading, addAddon, updateAddonById, deleteAddonById } = useAddons();

  const handleExport = () => {
    if (!addons || addons.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const csvContent = [
      ["ID", "Addon Name", "Created At", "Updated At"],
      ...addons.map((a) => [
        a.id || "",
        a.name || "",
        a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "",
        a.updatedAt ? new Date(a.updatedAt).toLocaleDateString() : "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `addons_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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

  const handleDeleteClick = (addon: AddOn) => {
    setDeletingItem(addon);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      const result = await deleteAddonById(deletingItem.id!);
      if (result) {
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
      <div className="min-h-[80vh] bg-white p-4">
        <Header title="Addon Fees" subtitle="Manage addon fees details" icon={PlusCircle} />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading addons...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-white p-4">
      <Header
        title="Addon Fees"
        subtitle="Manage addon fees details"
        icon={PlusCircle}
        actions={
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowModal(true)}>
              + Add New
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport} disabled={!addons || addons.length === 0}>
              <FileDown className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        }
      />

      <div className="overflow-x-auto rounded-xl shadow-md bg-white mt-6">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="text-center">S.No</TableHead>
              <TableHead className="text-center">Addon Name</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {addons && addons.length > 0 ? (
              addons.map((row, idx) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                  <TableCell className="text-center">{row.name}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} title="Edit addon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(row)} title="Delete addon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          } else {
            setShowModal(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Addon" : "Add New Addon"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the addon details below." : "Enter the addon details to create a new addon."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-1  py-4">
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

            {/* Example Second Field (optional / future-ready) */}
            {/* <div className="flex flex-col gap-2">
      <Label htmlFor="description">Description</Label>
      <Input
        id="description"
        placeholder="Optional description"
      />
    </div> */}
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim()}>
              {editingItem ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
