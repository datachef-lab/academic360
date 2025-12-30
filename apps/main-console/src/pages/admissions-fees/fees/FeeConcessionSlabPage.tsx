import React, { useState } from "react";
import { Percent, Edit, Trash2, FileDown } from "lucide-react";
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
import { useFeeConcessionSlabs } from "@/hooks/useFees";
import { FeeConcessionSlab } from "@/types/fees";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { toast } from "sonner";

const FeeConcessionSlabPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<FeeConcessionSlab | null>(null);
  const [editingItem, setEditingItem] = useState<FeeConcessionSlab | null>(null);
  const [form, setForm] = useState<{
    name: string;
    description: string;
    defaultConcessionRate: number;
    sequence: number;
    legacyFeeSlabId?: number | null;
  }>({
    name: "",
    description: "",
    defaultConcessionRate: 0,
    sequence: 1,
    legacyFeeSlabId: null,
  });

  const { concessionSlabs, loading, addFeeConcessionSlab, updateFeeConcessionSlabById, deleteFeeConcessionSlabById } =
    useFeeConcessionSlabs();

  const handleExport = () => {
    if (!concessionSlabs || concessionSlabs.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const csvContent = [
      ["ID", "Slab Name", "Description", "Default Concession Rate (%)", "Sequence", "Legacy Fee Slab ID"],
      ...concessionSlabs.map((s) => [
        s.id || "",
        s.name || "",
        s.description || "",
        s.defaultConcessionRate || 0,
        s.sequence || "",
        s.legacyFeeSlabId || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell)}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fee_concession_slabs_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleSubmit = async () => {
    const trimmedName = form.name.trim();
    const trimmedDescription = form.description.trim();

    if (!trimmedName) {
      toast.warning("Please enter a slab name");
      return;
    }

    if (!trimmedDescription) {
      toast.warning("Please enter a description");
      return;
    }

    if (form.defaultConcessionRate < 0 || form.defaultConcessionRate > 100) {
      toast.warning("Default concession rate must be between 0 and 100");
      return;
    }

    if (form.sequence < 1) {
      toast.warning("Sequence must be at least 1");
      return;
    }

    // Check for duplicate names (excluding current item if editing)
    if (concessionSlabs && concessionSlabs.length > 0) {
      const duplicate = concessionSlabs.find(
        (s) => s.name.toLowerCase() === trimmedName.toLowerCase() && s.id !== editingItem?.id,
      );
      if (duplicate) {
        toast.warning("A slab with this name already exists. Please use a different name.");
        return;
      }
    }

    try {
      if (editingItem) {
        const result = await updateFeeConcessionSlabById(editingItem.id!, {
          name: trimmedName,
          description: trimmedDescription,
          defaultConcessionRate: form.defaultConcessionRate,
          sequence: form.sequence,
          legacyFeeSlabId: form.legacyFeeSlabId || null,
        });
        if (!result) {
          toast.error("Failed to update fee concession slab. Please try again.");
          return;
        }
        toast.success("Fee concession slab updated successfully");
      } else {
        const result = await addFeeConcessionSlab({
          name: trimmedName,
          description: trimmedDescription,
          defaultConcessionRate: form.defaultConcessionRate,
          sequence: form.sequence,
          legacyFeeSlabId: form.legacyFeeSlabId || null,
        } as FeeConcessionSlab);
        if (!result) {
          toast.error("Failed to create fee concession slab. Please try again.");
          return;
        }
        toast.success("Fee concession slab created successfully");
      }
      handleClose();
    } catch (error) {
      console.error("Error saving fee concession slab:", error);
      toast.error("Failed to save fee concession slab. Please try again.");
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({
      name: "",
      description: "",
      defaultConcessionRate: 0,
      sequence: 1,
      legacyFeeSlabId: null,
    });
  };

  const handleEdit = (slab: FeeConcessionSlab) => {
    setEditingItem(slab);
    setForm({
      name: slab.name,
      description: slab.description,
      defaultConcessionRate: slab.defaultConcessionRate,
      sequence: slab.sequence,
      legacyFeeSlabId: slab.legacyFeeSlabId || null,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (slab: FeeConcessionSlab) => {
    setDeletingItem(slab);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      const result = await deleteFeeConcessionSlabById(deletingItem.id!);
      if (!result) {
        toast.error("Failed to delete fee concession slab. Please try again.");
        throw new Error("Delete failed");
      }
      toast.success("Fee concession slab deleted successfully");
      setDeletingItem(null);
    } catch (error) {
      console.error("Error deleting fee concession slab:", error);
      toast.error("Failed to delete fee concession slab. Please try again.");
      throw error; // Re-throw to prevent modal from closing
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-white p-4">
        <Header title="Fee Concession Slabs" subtitle="Manage fee concession slabs" icon={Percent} />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading concession slabs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-white p-4">
      <Header
        title="Fee Concession Slabs"
        subtitle="Manage fee concession slabs"
        icon={Percent}
        actions={
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowModal(true)}>
              + Add Slab
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              disabled={!concessionSlabs || concessionSlabs.length === 0}
            >
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
              <TableHead className="text-center">Slab Name</TableHead>
              <TableHead className="text-center">Description</TableHead>
              <TableHead className="text-center">Default Rate (%)</TableHead>
              <TableHead className="text-center">Sequence</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {concessionSlabs && concessionSlabs.length > 0 ? (
              concessionSlabs.map((row, idx) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                  <TableCell className="text-center">{row.name}</TableCell>
                  <TableCell className="text-center">{row.description}</TableCell>
                  <TableCell className="text-center">{row.defaultConcessionRate}%</TableCell>
                  <TableCell className="text-center">{row.sequence}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(row)} title="Edit slab">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(row)} title="Delete slab">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6">
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Fee Concession Slab" : "Add New Fee Concession Slab"}</DialogTitle>
            <DialogDescription>
              {editingItem
                ? "Update the fee concession slab details below."
                : "Fill in the details to create a new fee concession slab."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Slab Name *
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length > 0 && value[0] === " ") return;
                  setForm({ ...form, name: value });
                }}
                className="col-span-3"
                placeholder="Enter slab name"
                maxLength={255}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description *
              </Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length > 0 && value[0] === " ") return;
                  setForm({ ...form, description: value });
                }}
                className="col-span-3"
                placeholder="Enter description"
                maxLength={500}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="defaultConcessionRate" className="text-right">
                Default Rate (%) *
              </Label>
              <Input
                id="defaultConcessionRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={form.defaultConcessionRate}
                onChange={(e) => setForm({ ...form, defaultConcessionRate: parseFloat(e.target.value) || 0 })}
                className="col-span-3"
                placeholder="Enter default concession rate (0-100)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sequence" className="text-right">
                Sequence *
              </Label>
              <Input
                id="sequence"
                type="number"
                min="1"
                value={form.sequence}
                onChange={(e) => setForm({ ...form, sequence: parseInt(e.target.value) || 1 })}
                className="col-span-3"
                placeholder="Enter sequence number"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="legacyFeeSlabId" className="text-right">
                Legacy Slab ID
              </Label>
              <Input
                id="legacyFeeSlabId"
                type="number"
                value={form.legacyFeeSlabId || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    legacyFeeSlabId: e.target.value ? parseInt(e.target.value) : null,
                  })
                }
                className="col-span-3"
                placeholder="Enter legacy fee slab ID (optional)"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!form.name.trim() || !form.description.trim()}>
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
        title="Delete Fee Concession Slab"
        itemName={deletingItem?.name || ""}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default FeeConcessionSlabPage;
