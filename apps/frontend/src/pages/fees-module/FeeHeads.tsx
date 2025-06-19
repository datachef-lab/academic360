import React, { useState } from "react";
import { Layers } from "lucide-react";
import Header from "../../components/common/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FeeHead {
  id: number;
  name: string;
  code: string;
  type: string;
  description?: string;
}

const FeeHeads: React.FC = () => {
  const [data, setData] = useState<FeeHead[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FeeHead>({ id: 0, name: "", code: "", type: "", description: "" });

  const addNew = () => {
    if (!form.name.trim() || !form.code.trim()) return;
    setData((prev) => [...prev, { ...form, id: Date.now() }]);
    setForm({ id: 0, name: "", code: "", type: "", description: "" });
    setShowForm(false);
  };

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-purple-50 to-white p-4">
      <Header title="Fee Heads / Components" subtitle="Define fee head types" icon={Layers} />

      <div className="flex justify-end my-4">
        <Button onClick={() => setShowForm((p) => !p)}>
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
            placeholder="Short Code"
            value={form.code}
            onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
          />
          <Input
            placeholder="Type (if any)"
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
          />
          <Input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          />
          <div className="col-span-full flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={addNew}>Save</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl shadow-md bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="text-center">#</TableHead>
              <TableHead className="text-center">Head Name</TableHead>
              <TableHead className="text-center">Short Code</TableHead>
              <TableHead className="text-center">Type</TableHead>
              <TableHead className="text-center">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length ? (
              data.map((row, idx) => (
                <TableRow key={row.id} className="hover:bg-gray-50">
                  <TableCell className="text-center font-medium">{idx + 1}</TableCell>
                  <TableCell className="text-center">{row.name}</TableCell>
                  <TableCell className="text-center">{row.code}</TableCell>
                  <TableCell className="text-center">{row.type}</TableCell>
                  <TableCell className="text-center">{row.description}</TableCell>
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
