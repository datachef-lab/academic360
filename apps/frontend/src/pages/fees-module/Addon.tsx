import React, { useState, } from "react";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import Header from "../../components/common/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddons } from "@/hooks/useFees";
import { AddOn } from "@/types/fees";

const Addon: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<{ name: string }>({ name: "" });

  const { 
    addons, 
    loading, 
    addAddon, 
    updateAddonById, 
    deleteAddonById 
  } = useAddons();

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    
    try {
      if (editingId) {
        await updateAddonById(editingId, form);
        setEditingId(null);
      } else {
        await addAddon(form);
      }
      setForm({ name: "" });
      setShowForm(false);
    } catch (error) {
      console.error("Error saving addon:", error);
    }
  };

  const handleEdit = (addon: AddOn) => {
    setEditingId(addon.id!);
    setForm({ name: addon.name });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this addon?")) {
      await deleteAddonById(id);
    }
  };

  const handleCancel = () => {
    setForm({ name: "" });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] bg-gradient-to-br from-purple-50 to-white p-4">
        <Header title="Addon Fees" subtitle="Manage addon fees details" icon={PlusCircle} />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading addons...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-purple-50 to-white p-4">
      <Header title="Addon Fees" subtitle="Manage addon fees details" icon={PlusCircle} />

      <div className="flex justify-end my-4">
        <Button onClick={() => setShowForm(true)}>
          + Add New
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 mb-6 bg-white shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              placeholder="Addon Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
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
        </div>
      )}

      <div className="overflow-x-auto rounded-xl shadow-md bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="text-center">#</TableHead>
              <TableHead className="text-center">Addon Name</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {addons.length ? (
              addons.map((row, idx) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                  <TableCell className="text-center">{row.name}</TableCell>
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
                <TableCell colSpan={3} className="text-center py-6">
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

export default Addon;
