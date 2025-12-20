import React, { useState, useEffect } from "react";
import { Layers3, PlusCircle, Search, Filter, FileDown, Edit, Trash2 } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { useFeesSlabs } from "@/hooks/useFees";
import { toast } from "sonner";
import { FeesSlab as FeesSlabType } from "@/types/fees";

const FeesSlabPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeesSlabType | null>(null);
  const [form, setForm] = useState<{ name: string; description: string; sequence: number }>({
    name: "",
    description: "",
    sequence: 1,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filteredData, setFilteredData] = useState<FeesSlabType[]>([]);

  // UI state for async actions
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { feesSlabs, loading, addFeesSlab, updateFeesSlabById, deleteFeesSlabById } = useFeesSlabs();

  useEffect(() => {
    let updated = feesSlabs;
    if (searchTerm) {
      updated = updated.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }
    setFilteredData(updated);
  }, [searchTerm, feesSlabs]);

  const handleExport = () => {
    const csvContent = [
      ["ID", "Name", "Description", "Sequence"],
      ...filteredData.map((s) => [s.id, s.name, s.description || "", s.sequence]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fees_slabs.csv";
    a.click();
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;

    try {
      setIsSaving(true);
      if (editingItem) {
        await updateFeesSlabById(editingItem.id!, form);
        toast.success("Fees slab updated successfully.");
      } else {
        await addFeesSlab(form);
        toast.success("Fees slab created successfully.");
      }
      handleClose();
    } catch (error) {
      console.error("Error saving fees slab:", error);
      toast.error("Failed to save fees slab.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({ name: "", description: "", sequence: 1 });
  };

  const handleEdit = (item: FeesSlabType) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || "",
      sequence: item.sequence,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this fees slab?")) return;
    try {
      setDeletingId(id);
      const success = await deleteFeesSlabById(id);
      if (success) {
        toast.success("Fees slab deleted successfully.");
      } else {
        toast.error("Fees slab not found or already deleted.");
      }
    } catch (error) {
      console.error("Failed to delete fees slab:", error);
      toast.error("Failed to delete fees slab.");
    } finally {
      setDeletingId(null);
    }
  };

  const totalSlabs = feesSlabs.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 lg:p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading fees slabs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 lg:p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-600 text-white rounded-lg">
            <Layers3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Fees Slabs</h1>
            <p className="text-sm text-gray-600">Define various concession slabs for fee management</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Slabs</p>
                <p className="text-lg font-bold text-gray-900">{totalSlabs}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded">
                <Layers3 className="h-4 w-4 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 mb-4 border border-gray-200">
        <div className="flex flex-col gap-3">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search fees slabs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-all ${
                showFilters
                  ? "bg-purple-50 border-purple-300 text-purple-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
            </button>

            <button
              onClick={() => {
                // default sequence is max existing sequence + 1
                const maxSeq = feesSlabs.length ? Math.max(...feesSlabs.map((s) => s.sequence || 0)) : 0;
                setEditingItem(null);
                setForm({ name: "", description: "", sequence: maxSeq + 1 });
                setShowModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add Slab
            </button>

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <FileDown className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="text-center">#</TableHead>
              <TableHead className="text-center">Name</TableHead>
              <TableHead className="text-center">Description</TableHead>
              <TableHead className="text-center">Sequence</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length ? (
              filteredData.map((row, idx) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                  <TableCell className="text-center">{row.name}</TableCell>
                  <TableCell className="text-center">{row.description || "-"}</TableCell>
                  <TableCell className="text-center">{row.sequence}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(row)}
                        disabled={isSaving || deletingId !== null}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(row.id!)}
                        disabled={isSaving || deletingId === row.id}
                      >
                        {deletingId === row.id ? (
                          <svg
                            className="animate-spin h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                          </svg>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Fees Slab" : "Add New Fees Slab"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the fees slab details below." : "Fill in the details to create a new fees slab."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="col-span-3"
                placeholder="Enter slab name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="col-span-3"
                placeholder="Enter description (optional)"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sequence" className="text-right">
                Sequence
              </Label>
              <Input
                id="sequence"
                type="number"
                value={form.sequence}
                onChange={(e) => setForm({ ...form, sequence: parseInt(e.target.value) || 1 })}
                className="col-span-3"
                placeholder="Enter sequence number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={handleClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving || !form.name.trim()}>
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  {editingItem ? "Updating" : "Saving"}
                </span>
              ) : editingItem ? (
                "Update"
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeesSlabPage;
