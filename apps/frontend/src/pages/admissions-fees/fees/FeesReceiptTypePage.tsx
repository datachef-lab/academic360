import React, { useState, useEffect } from "react";
import { Receipt, PlusCircle, Search, Filter, FileDown, Edit, Trash2 } from "lucide-react";
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
import { useFeesReceiptTypes, useAddons } from "@/hooks/useFees";
import { FeesReceiptType } from "@/types/fees";

const FeesReceiptTypePage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FeesReceiptType | null>(null);
  const [form, setForm] = useState<{
    name: string;
    chk: string;
    chkMisc: string;
    printChln: string;
    splType: string;
    addOnId: number | null;
    printReceipt: string;
    chkOnline: string;
    chkOnSequence: string;
  }>({
    name: "",
    chk: "",
    chkMisc: "",
    printChln: "",
    splType: "",
    addOnId: null,
    printReceipt: "",
    chkOnline: "",
    chkOnSequence: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filteredData, setFilteredData] = useState<FeesReceiptType[]>([]);

  const { 
    feesReceiptTypes, 
    loading, 
    addFeesReceiptType, 
    updateFeesReceiptTypeById, 
    deleteFeesReceiptTypeById 
  } = useFeesReceiptTypes();

  const { addons } = useAddons();

  useEffect(() => {
    let updated = feesReceiptTypes;
    if (searchTerm) {
      updated = updated.filter(
        (r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.chk && r.chk.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (r.splType && r.splType.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }
    setFilteredData(updated);
  }, [searchTerm, feesReceiptTypes]);

  const handleExport = () => {
    const csvContent = [
      ["ID", "Name", "Chk", "ChkMisc", "PrintChln", "SplType", "AddOnId", "PrintReceipt", "ChkOnline", "ChkOnSequence"],
      ...filteredData.map((r) => [
        r.id, 
        r.name, 
        r.chk || "", 
        r.chkMisc || "", 
        r.printChln || "", 
        r.splType || "", 
        r.addOnId || "", 
        r.printReceipt || "", 
        r.chkOnline || "", 
        r.chkOnSequence || ""
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fees_receipt_types.csv";
    a.click();
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;

    try {
      if (editingItem) {
        await updateFeesReceiptTypeById(editingItem.id!, form);
      } else {
        await addFeesReceiptType(form);
      }
      handleClose();
    } catch (error) {
      console.error("Error saving fees receipt type:", error);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEditingItem(null);
    setForm({
      name: "",
      chk: "",
      chkMisc: "",
      printChln: "",
      splType: "",
      addOnId: null,
      printReceipt: "",
      chkOnline: "",
      chkOnSequence: "",
    });
  };

  const handleEdit = (item: FeesReceiptType) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      chk: item.chk || "",
      chkMisc: item.chkMisc || "",
      printChln: item.printChln || "",
      splType: item.splType || "",
      addOnId: item.addOnId,
      printReceipt: item.printReceipt || "",
      chkOnline: item.chkOnline || "",
      chkOnSequence: item.chkOnSequence || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this fees receipt type?")) {
      await deleteFeesReceiptTypeById(id);
    }
  };

  const totalReceipts = feesReceiptTypes.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 lg:p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading fees receipt types...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 lg:p-4">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-600 text-white rounded-lg">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Fees Receipt Types</h1>
            <p className="text-sm text-gray-600">Define various receipt types for transactions and challan printing</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Total Receipts</p>
                <p className="text-lg font-bold text-gray-900">{totalReceipts}</p>
              </div>
              <div className="p-2 bg-green-100 rounded">
                <Receipt className="h-4 w-4 text-green-700" />
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
              placeholder="Search fees receipt types..."
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
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              Add Receipt Type
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
              <TableHead className="text-center">Chk</TableHead>
              <TableHead className="text-center">SplType</TableHead>
              <TableHead className="text-center">AddOn</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length ? (
              filteredData.map((row, idx) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                  <TableCell className="text-center">{row.name}</TableCell>
                  <TableCell className="text-center">{row.chk || '-'}</TableCell>
                  <TableCell className="text-center">{row.splType || '-'}</TableCell>
                  <TableCell className="text-center">
                    {row.addOnId ? addons.find(a => a.id === row.addOnId)?.name || row.addOnId : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(row)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(row.id!)}
                      >
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

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Fees Receipt Type" : "Add New Fees Receipt Type"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update the fees receipt type details below." : "Fill in the details to create a new fees receipt type."}
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
                placeholder="Enter receipt type name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="chk" className="text-right">
                Chk
              </Label>
              <Input
                id="chk"
                value={form.chk}
                onChange={(e) => setForm({ ...form, chk: e.target.value })}
                className="col-span-3"
                placeholder="Enter chk value"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="chkMisc" className="text-right">
                ChkMisc
              </Label>
              <Input
                id="chkMisc"
                value={form.chkMisc}
                onChange={(e) => setForm({ ...form, chkMisc: e.target.value })}
                className="col-span-3"
                placeholder="Enter chkMisc value"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="printChln" className="text-right">
                PrintChln
              </Label>
              <Input
                id="printChln"
                value={form.printChln}
                onChange={(e) => setForm({ ...form, printChln: e.target.value })}
                className="col-span-3"
                placeholder="Enter printChln value"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="splType" className="text-right">
                SplType
              </Label>
              <Input
                id="splType"
                value={form.splType}
                onChange={(e) => setForm({ ...form, splType: e.target.value })}
                className="col-span-3"
                placeholder="Enter splType value"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="addOnId" className="text-right">
                AddOn
              </Label>
              <select
                id="addOnId"
                value={form.addOnId || ""}
                onChange={(e) => setForm({ ...form, addOnId: e.target.value ? parseInt(e.target.value) : null })}
                className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select AddOn (optional)</option>
                {addons.map(addon => (
                  <option key={addon.id} value={addon.id}>
                    {addon.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="printReceipt" className="text-right">
                PrintReceipt
              </Label>
              <Input
                id="printReceipt"
                value={form.printReceipt}
                onChange={(e) => setForm({ ...form, printReceipt: e.target.value })}
                className="col-span-3"
                placeholder="Enter printReceipt value"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="chkOnline" className="text-right">
                ChkOnline
              </Label>
              <Input
                id="chkOnline"
                value={form.chkOnline}
                onChange={(e) => setForm({ ...form, chkOnline: e.target.value })}
                className="col-span-3"
                placeholder="Enter chkOnline value"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="chkOnSequence" className="text-right">
                ChkOnSequence
              </Label>
              <Input
                id="chkOnSequence"
                value={form.chkOnSequence}
                onChange={(e) => setForm({ ...form, chkOnSequence: e.target.value })}
                className="col-span-3"
                placeholder="Enter chkOnSequence value"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingItem ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FeesReceiptTypePage;
