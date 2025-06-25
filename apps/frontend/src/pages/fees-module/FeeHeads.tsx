import React, { useState } from "react";
import { Layers, Edit, Trash2 } from "lucide-react";
import Header from "../../components/common/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFeesHeads } from "@/hooks/useFees";
import { FeesHead } from "@/types/fees";

const FeeHeads: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{ name: string; sequence: number; remarks: string }>({ 
    name: "", 
    sequence: 1, 
    remarks: "" 
  });

  const { 
    feesHeads, 
    loading, 
    addFeesHead, 
    updateFeesHeadById, 
    deleteFeesHeadById 
  } = useFeesHeads();

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    
    try {
      if (editingId) {
        await updateFeesHeadById(editingId, form);
        setEditingId(null);
      } else {
        await addFeesHead(form);
      }
      setForm({ name: "", sequence: 1, remarks: "" });
      setShowForm(false);
    } catch (error) {
      console.error("Error saving fees head:", error);
    }
  };

  const handleEdit = (feesHead: FeesHead) => {
    setEditingId(feesHead.id!);
    setForm({
      name: feesHead.name,
      sequence: feesHead.sequence,
      remarks: feesHead.remarks || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this fees head?")) {
      await deleteFeesHeadById(id);
    }
  };

  const handleCancel = () => {
    setForm({ name: "", sequence: 1, remarks: "" });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-gradient-to-br from-purple-50 to-white p-4">
        <Header title="Fee Heads / Components" subtitle="Define fee head types" icon={Layers} />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading fees heads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-purple-50 to-white p-4">
      <Header title="Fee Heads / Components" subtitle="Define fee head types" icon={Layers} />

      <div className="flex justify-end my-4">
        <Button onClick={() => setShowForm(true)}>
          + Add New
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 mb-6 bg-white shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input
            placeholder="Head Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            type="number"
            placeholder="Sequence"
            value={form.sequence}
            onChange={(e) => setForm((p) => ({ ...p, sequence: parseInt(e.target.value) || 1 }))}
          />
          <Input
            placeholder="Remarks (optional)"
            value={form.remarks}
            onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
          />
          <div className="col-span-full flex gap-2 justify-end">
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingId ? 'Update' : 'Save'}
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl shadow-md bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="text-center">#</TableHead>
              <TableHead className="text-center">Head Name</TableHead>
              <TableHead className="text-center">Sequence</TableHead>
              <TableHead className="text-center">Remarks</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feesHeads.length ? (
              feesHeads.map((row, idx) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                  <TableCell className="text-center">{row.name}</TableCell>
                  <TableCell className="text-center">{row.sequence}</TableCell>
                  <TableCell className="text-center">{row.remarks || '-'}</TableCell>
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
                <TableCell colSpan={5} className="text-center py-6">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FeeHeads;
