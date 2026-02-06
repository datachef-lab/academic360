import React, { useState } from "react";
import { Percent, Edit, Trash2, Download, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useFeeConcessionSlabs } from "@/hooks/useFees";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { FeeSlabT } from "@/schemas";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const FeeConcessionSlabPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingItem, setDeletingItem] = useState<FeeSlabT | null>(null);
  const [editingItem, setEditingItem] = useState<FeeSlabT | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form, setForm] = useState<{
    name: string;
    description: string;
    defaultConcessionRate: number;
    sequence: number | undefined;
  }>({
    name: "",
    description: "",
    defaultConcessionRate: 0,
    sequence: undefined,
  });

  const { concessionSlabs, loading, addFeeConcessionSlab, updateFeeConcessionSlabById, deleteFeeConcessionSlabById } =
    useFeeConcessionSlabs();

  // Filter concession slabs based on search text
  const filteredConcessionSlabs =
    concessionSlabs?.filter((slab) => {
      const searchLower = searchText.toLowerCase();
      return (
        slab.name?.toLowerCase().includes(searchLower) ||
        slab.description?.toLowerCase().includes(searchLower) ||
        slab.defaultRate?.toString().includes(searchText) ||
        slab.sequence?.toString().includes(searchText)
      );
    }) || [];

  const handleDownloadAll = () => {
    if (!concessionSlabs || concessionSlabs.length === 0) {
      toast.warning("No data to download");
      return;
    }

    const data = [
      ["ID", "Slab Name", "Description", "Default Concession Rate (%)", "Sequence"],
      ...concessionSlabs.map((s) => [
        s.id || "",
        s.name || "",
        s.description || "",
        s.defaultRate || 0,
        s.sequence || "",
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fee Slabs");
    XLSX.writeFile(wb, `fee_slabs_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Data downloaded successfully");
  };

  const handleSubmit = async () => {
    const trimmedName = form.name.trim();
    const trimmedDescription = form.description.trim();

    if (!trimmedName) {
      toast.warning("Please enter a slab name");
      return;
    }

    if (form.defaultConcessionRate < 0 || form.defaultConcessionRate > 100) {
      toast.warning("Default concession rate must be between 0 and 100");
      return;
    }

    // Sequence is optional, but if provided, it must be at least 1
    if (form.sequence !== undefined && form.sequence !== null && form.sequence < 1) {
      toast.warning("Sequence must be at least 1 if provided");
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
      // Only include sequence if it's provided (not undefined/null)
      const payload: any = {
        name: trimmedName,
        description: trimmedDescription || null,
        defaultConcessionRate: form.defaultConcessionRate,
      };

      // Only add sequence if it's actually provided
      if (form.sequence !== undefined && form.sequence !== null) {
        payload.sequence = form.sequence;
      }

      if (editingItem) {
        const result = await updateFeeConcessionSlabById(editingItem.id!, payload);
        if (!result) {
          toast.error("Failed to update fee slab. Please try again.");
          return;
        }
        toast.success("Fee slab updated successfully");
      } else {
        const result = await addFeeConcessionSlab(payload as FeeSlabT);
        if (!result) {
          toast.error("Failed to create fee slab. Please try again.");
          return;
        }
        toast.success("Fee slab created successfully");
      }
      handleClose();
    } catch (error) {
      console.error("Error saving fee concession slab:", error);
      toast.error("Failed to save fee slab. Please try again.");
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({
      name: "",
      description: "",
      defaultConcessionRate: 0,
      sequence: undefined,
    });
  };

  const handleEdit = (slab: FeeSlabT) => {
    setEditingItem(slab);
    setForm({
      name: slab.name,
      description: slab.description || "",
      defaultConcessionRate: slab.defaultRate ?? 0,
      sequence: slab.sequence ?? undefined,
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setForm({
      name: "",
      description: "",
      defaultConcessionRate: 0,
      sequence: undefined,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (slab: FeeSlabT) => {
    setDeletingItem(slab);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    try {
      const result = await deleteFeeConcessionSlabById(deletingItem.id!);
      if (!result) {
        toast.error("Failed to delete fee slab. Please try again.");
        throw new Error("Delete failed");
      }
      toast.success("Fee slab deleted successfully");
      setDeletingItem(null);
    } catch (error) {
      console.error("Error deleting fee concession slab:", error);
      toast.error("Failed to delete fee slab. Please try again.");
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
                <Percent className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
                Fee Slabs
              </CardTitle>
              <div className="text-muted-foreground">Manage fee slabs</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading fee slabs...</div>
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
              <Percent className="mr-2 h-8 w-8 border rounded-md p-1 border-slate-400" />
              Fee Slabs
            </CardTitle>
            <div className="text-muted-foreground">Manage fee slabs</div>
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
                  <AlertDialogTitle>{editingItem ? "Edit Fee Slab" : "Add New Fee Slab"}</AlertDialogTitle>
                </AlertDialogHeader>
                <div className="py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Slab Name */}
                    <div className="flex flex-col gap-2">
                      <Label>
                        Slab Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={form.name}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length > 0 && value[0] === " ") return;
                          setForm({ ...form, name: value });
                        }}
                        placeholder="Enter slab name"
                        maxLength={255}
                        autoFocus
                      />
                    </div>

                    {/* Default Rate */}
                    <div className="flex flex-col gap-2">
                      <Label>
                        Concession Rate (%) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={form.defaultConcessionRate}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            defaultConcessionRate: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0 - 100"
                      />
                    </div>

                    {/* Description – full width */}
                    <div className="flex flex-col gap-2 sm:col-span-2">
                      <Label>Description</Label>
                      <Input
                        value={form.description}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length > 0 && value[0] === " ") return;
                          setForm({ ...form, description: value });
                        }}
                        placeholder="Enter description"
                        maxLength={500}
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
                    <TableHead style={{ width: 60, whiteSpace: "nowrap" }}>Sr. No.</TableHead>
                    <TableHead style={{ width: 200 }}>Slab Name</TableHead>
                    <TableHead style={{ width: 250 }}>Description</TableHead>
                    <TableHead style={{ width: 150 }}>Default Rate (%)</TableHead>
                    <TableHead style={{ width: 100 }}>Sequence</TableHead>
                    <TableHead style={{ width: 140 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConcessionSlabs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No fee slabs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredConcessionSlabs.map((row, index) => (
                      <TableRow key={row.id} className="group">
                        <TableCell style={{ width: 60 }}>{index + 1}</TableCell>
                        <TableCell style={{ width: 200 }}>{row.name}</TableCell>
                        <TableCell style={{ width: 250 }}>{row.description || "-"}</TableCell>
                        <TableCell style={{ width: 150 }}>{row.defaultRate ?? 0}%</TableCell>
                        <TableCell style={{ width: 100 }}>{row.sequence ?? "-"}</TableCell>
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
        title="Delete Fee Slab"
        itemName={deletingItem?.name || ""}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default FeeConcessionSlabPage;
