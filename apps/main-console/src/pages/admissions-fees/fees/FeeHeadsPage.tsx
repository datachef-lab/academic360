import React, { useState, useEffect } from "react";
import { Layers, Edit, Trash2, Download, PlusCircle } from "lucide-react";
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
import { useFeesHeads } from "@/hooks/useFees";
import { FeesHead } from "@/types/fees";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { toast } from "sonner";
import { NewFeesHead } from "@/services/fees-api";
import * as XLSX from "xlsx";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/features/auth/providers/auth-provider";

const FeeHeadsPage: React.FC = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket({
    userId: user?.id?.toString(),
  });
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeesHead | null>(null);
  const [deletingItem, setDeletingItem] = useState<FeesHead | null>(null);
  const [searchText, setSearchText] = useState("");
  const [form, setForm] = useState<{
    name: string;
    defaultPercentage: number;
    sequence: number | undefined;
    remarks: string;
  }>({
    name: "",
    defaultPercentage: 0,
    sequence: undefined,
    remarks: "",
  });

  const { feesHeads, loading, addFeesHead, updateFeesHeadById, deleteFeesHeadById } = useFeesHeads();

  // Listen for fee head socket events (only for staff/admin)
  useEffect(() => {
    if (!socket || !isConnected || (user?.type !== "ADMIN" && user?.type !== "STAFF")) return;

    const handleFeeHeadCreated = (data: { feeHeadId: number; type: string; message: string }) => {
      console.log("[Fee Heads Page] Fee head created:", data);
      // Silently refresh UI without showing toast
      window.location.reload(); // Refetch data
    };

    const handleFeeHeadUpdated = (data: { feeHeadId: number; type: string; message: string }) => {
      console.log("[Fee Heads Page] Fee head updated:", data);
      // Silently refresh UI without showing toast
      window.location.reload(); // Refetch data
    };

    const handleFeeHeadDeleted = (data: { feeHeadId: number; type: string; message: string }) => {
      console.log("[Fee Heads Page] Fee head deleted:", data);
      // Silently refresh UI without showing toast
      window.location.reload(); // Refetch data
    };

    socket.on("fee_head_created", handleFeeHeadCreated);
    socket.on("fee_head_updated", handleFeeHeadUpdated);
    socket.on("fee_head_deleted", handleFeeHeadDeleted);

    return () => {
      socket.off("fee_head_created", handleFeeHeadCreated);
      socket.off("fee_head_updated", handleFeeHeadUpdated);
      socket.off("fee_head_deleted", handleFeeHeadDeleted);
    };
  }, [socket, isConnected, user?.type]);

  // Filter fee heads based on search text
  const filteredFeesHeads =
    feesHeads?.filter((head) => {
      const searchLower = searchText.toLowerCase();
      return (
        head.name?.toLowerCase().includes(searchLower) ||
        head.remarks?.toLowerCase().includes(searchLower) ||
        head.sequence?.toString().includes(searchText) ||
        head.defaultPercentage?.toString().includes(searchText)
      );
    }) || [];

  const handleDownloadAll = () => {
    if (!feesHeads || feesHeads.length === 0) {
      toast.warning("No data to download");
      return;
    }

    const data = [
      ["ID", "Head Name", "Default Percentage (%)", "Sequence", "Remarks"],
      ...feesHeads.map((h) => [
        h.id || "",
        h.name || "",
        (h as any).defaultPercentage || 0,
        h.sequence || "",
        h.remarks || "",
      ]),
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

    // Validate default percentage
    if (form.defaultPercentage < 0 || form.defaultPercentage > 100) {
      toast.warning("Default percentage must be between 0 and 100");
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
        defaultPercentage: form.defaultPercentage,
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
      defaultPercentage: (item as any).defaultPercentage || 0,
      sequence: item.sequence,
      remarks: item.remarks || "",
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setForm({
      name: "",
      defaultPercentage: 0,
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
    setForm({ name: "", defaultPercentage: 0, sequence: undefined, remarks: "" });
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

                    {/* Default Percentage */}
                    <div className="flex flex-col gap-2">
                      <Label>
                        Default Percentage (%) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={form.defaultPercentage}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            defaultPercentage: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0 - 100"
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
            <div className="overflow-y-auto h-full">
              <Table className="border rounded-md" style={{ tableLayout: "fixed", width: "100%" }}>
                <TableHeader style={{ position: "sticky", top: 0, zIndex: 10, background: "#f3f4f6" }}>
                  <TableRow>
                    <TableHead style={{ width: 60, whiteSpace: "nowrap" }}>Sr. No.</TableHead>
                    <TableHead style={{ width: 250 }}>Head Name</TableHead>
                    <TableHead style={{ width: 150 }}>Default %</TableHead>
                    <TableHead style={{ width: 120 }}>Sequence</TableHead>
                    <TableHead style={{ width: 220 }}>Remarks</TableHead>
                    <TableHead style={{ width: 140 }}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFeesHeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No fee heads found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFeesHeads.map((row, index) => (
                      <TableRow key={row.id} className="group">
                        <TableCell style={{ width: 60 }}>{index + 1}</TableCell>
                        <TableCell style={{ width: 250 }}>{row.name}</TableCell>
                        <TableCell style={{ width: 150 }}>{(row as any).defaultPercentage ?? 0}%</TableCell>
                        <TableCell style={{ width: 120 }}>{row.sequence || "-"}</TableCell>
                        <TableCell style={{ width: 220 }}>{row.remarks || "-"}</TableCell>
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
