import React, { useState } from "react";
import { Layers, Edit, Trash2, FileDown } from "lucide-react";
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
import { useFeesHeads } from "@/hooks/useFees";
import { FeesHead } from "@/types/fees";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { toast } from "sonner";
import { NewFeesHead } from "@/services/fees-api";

const FeeHeadsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeesHead | null>(null);
  const [deletingItem, setDeletingItem] = useState<FeesHead | null>(null);

  const [form, setForm] = useState<{
    name: string;
    sequence: number;
    remarks: string;
  }>({
    name: "",
    sequence: 1,
    remarks: "",
  });

  const { feesHeads, loading, addFeesHead, updateFeesHeadById, deleteFeesHeadById } = useFeesHeads();

  /* ----------------------- EXPORT CSV ----------------------- */
  const handleExport = () => {
    if (!feesHeads || feesHeads.length === 0) {
      toast.warning("No data to export");
      return;
    }

    const csvContent = [
      ["ID", "Head Name", "Sequence", "Remarks"],
      ...feesHeads.map((h) => [h.id || "", h.name || "", h.sequence || "", h.remarks || ""]),
    ]
      .map((row) => row.map((c) => `"${String(c)}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `fee_heads_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  /* ----------------------- SUBMIT ----------------------- */
  const handleSubmit = async () => {
    const name = form.name.trim();
    const remarks = form.remarks.trim();

    if (!name) {
      toast.warning("Please enter fee head name");
      return;
    }

    if (form.sequence < 1) {
      toast.warning("Sequence must be at least 1");
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
        sequence: form.sequence,
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
    setForm({ name: "", sequence: 1, remarks: "" });
  };

  /* ----------------------- LOADING ----------------------- */
  if (loading) {
    return (
      <div className="min-h-[80vh] bg-white p-4">
        <Header title="Fee Heads " subtitle="Define fee head types" icon={Layers} />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading fee heads...</div>
        </div>
      </div>
    );
  }

  /* ----------------------- UI ----------------------- */
  return (
    <div className="min-h-[80vh] bg-white p-4">
      <Header
        title="Fee Heads "
        subtitle="Define fee head types"
        icon={Layers}
        actions={
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowModal(true)}>
              + Add Head
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport} disabled={!feesHeads || feesHeads.length === 0}>
              <FileDown className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        }
      />

      {/* ----------------------- TABLE ----------------------- */}
      <div className="overflow-x-auto rounded-xl shadow-md bg-white mt-6">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="text-center">S.No</TableHead>
              <TableHead className="text-center">Head Name</TableHead>
              <TableHead className="text-center">Sequence</TableHead>
              <TableHead className="text-center">Remarks</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feesHeads && feesHeads.length > 0 ? (
              feesHeads.map((row, idx) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                  <TableCell className="text-center">{row.name}</TableCell>
                  <TableCell className="text-center">{row.sequence}</TableCell>
                  <TableCell className="text-center">{row.remarks || "-"}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(row)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ----------------------- ADD / EDIT MODAL ----------------------- */}
      <Dialog open={showModal} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Fee Head" : "Add New Fee Head"}</DialogTitle>
            <DialogDescription>{editingItem ? "Update fee head details" : "Create a new fee head"}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Head Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="col-span-3"
                placeholder="Enter head name"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Sequence *</Label>
              <Input
                type="number"
                min="1"
                value={form.sequence}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sequence: parseInt(e.target.value) || 1,
                  })
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Remarks</Label>
              <Input
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="col-span-3"
                placeholder="Optional remarks"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{editingItem ? "Update" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
