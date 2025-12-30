import React, { useMemo, useState } from "react";
import { Edit, ReceiptIndianRupee, Trash2, FileDown } from "lucide-react";

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

import { useFeesReceiptTypes, useAddons } from "@/hooks/useFees";
import { FeesReceiptType } from "@/types/fees";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { toast } from "sonner";

type ReceiptTypeForm = {
  name: string;
  chk: string;
  chkMisc: string;
  printChln: string;
  splType: string;
  addOnId: number | null;
  printReceipt: string;
  chkOnline: string;
  chkOnSequence: string;
};

const EMPTY_FORM: ReceiptTypeForm = {
  name: "",
  chk: "",
  chkMisc: "",
  printChln: "",
  splType: "",
  addOnId: null,
  printReceipt: "",
  chkOnline: "",
  chkOnSequence: "",
};

const FeesReceiptTypePage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeesReceiptType | null>(null);
  const [deletingItem, setDeletingItem] = useState<FeesReceiptType | null>(null);
  const [form, setForm] = useState<ReceiptTypeForm>(EMPTY_FORM);

  const { feesReceiptTypes, loading, addFeesReceiptType, updateFeesReceiptTypeById, deleteFeesReceiptTypeById } =
    useFeesReceiptTypes();

  const { addons } = useAddons();

  const addonMap = useMemo(() => new Map(addons.map((a) => [a.id, a.name])), [addons]);

  /* -------------------- EXPORT -------------------- */
  const handleExport = () => {
    if (!feesReceiptTypes.length) {
      toast.warning("No data to export");
      return;
    }

    const csv = [
      ["ID", "Name", "Chk", "ChkMisc", "PrintChln", "SplType", "AddOn", "PrintReceipt", "ChkOnline", "ChkOnSequence"],
      ...feesReceiptTypes.map((r) => [
        r.id ?? "",
        r.name,
        r.chk ?? "",
        r.chkMisc ?? "",
        r.printChln ?? "",
        r.splType ?? "",
        r.addOnId ?? "",
        r.printReceipt ?? "",
        r.chkOnline ?? "",
        r.chkOnSequence ?? "",
      ]),
    ]
      .map((row) => row.map((c) => `"${String(c)}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fees_receipt_types_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      // Convert form data to match NewFeesReceiptType interface (empty strings to null)
      const receiptTypeData = {
        name,
        chk: form.chk.trim() || null,
        chkMisc: form.chkMisc.trim() || null,
        printChln: form.printChln.trim() || null,
        splType: form.splType.trim() || null,
        addOnId: form.addOnId,
        printReceipt: form.printReceipt.trim() || null,
        chkOnline: form.chkOnline.trim() || null,
        chkOnSequence: form.chkOnSequence.trim() || null,
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
      chk: item.chk ?? "",
      chkMisc: item.chkMisc ?? "",
      printChln: item.printChln ?? "",
      splType: item.splType ?? "",
      addOnId: item.addOnId ?? null,
      printReceipt: item.printReceipt ?? "",
      chkOnline: item.chkOnline ?? "",
      chkOnSequence: item.chkOnSequence ?? "",
    });
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
      <div className="min-h-[80vh] bg-white p-4">
        <Header title="Fees Receipt Types" subtitle="Manage receipt & challan types" icon={ReceiptIndianRupee} />
        <div className="flex items-center justify-center h-64 text-lg">Loading receipt types...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-white p-4">
      <Header
        title="Fees Receipt Types"
        subtitle="Manage receipt & challan types"
        icon={ReceiptIndianRupee}
        actions={
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setShowModal(true)}>
              + Add Receipt
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport} disabled={!feesReceiptTypes.length}>
              <FileDown className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        }
      />

      {/* TABLE */}
      <div className="overflow-x-auto rounded-xl shadow-md bg-white mt-6">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="text-center">#</TableHead>
              <TableHead className="text-center">Name</TableHead>
              <TableHead className="text-center">Chk</TableHead>
              <TableHead className="text-center">Spl Type</TableHead>
              <TableHead className="text-center">AddOn</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feesReceiptTypes.length ? (
              feesReceiptTypes.map((row, idx) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                  <TableCell className="text-center">{row.name}</TableCell>
                  <TableCell className="text-center">{row.chk || "-"}</TableCell>
                  <TableCell className="text-center">{row.splType || "-"}</TableCell>
                  <TableCell className="text-center">
                    {row.addOnId ? (addonMap.get(row.addOnId) ?? row.addOnId) : "-"}
                  </TableCell>
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
                <TableCell colSpan={6} className="text-center py-6">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ADD / EDIT MODAL */}
      <Dialog open={showModal} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Receipt Type" : "Add Receipt Type"}</DialogTitle>
            <DialogDescription>Manage receipt and challan configuration</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {(
              [
                ["name", "Name *"],
                ["chk", "Chk"],
                ["chkMisc", "ChkMisc"],
                ["printChln", "PrintChln"],
                ["splType", "SplType"],
                ["printReceipt", "PrintReceipt"],
                ["chkOnline", "ChkOnline"],
                ["chkOnSequence", "ChkOnSequence"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">{label}</Label>
                <Input
                  className="col-span-3"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">AddOn</Label>
              <select
                className="col-span-3 px-3 py-2 border rounded-md"
                value={form.addOnId ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    addOnId: e.target.value ? Number(e.target.value) : null,
                  })
                }
              >
                <option value="">Select AddOn (optional)</option>
                {addons.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
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
