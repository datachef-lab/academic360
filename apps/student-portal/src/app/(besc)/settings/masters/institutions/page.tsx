"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Institution } from '@/db/schema';

// Add a local InstitutionForm type for UI state
interface InstitutionForm {
  id?: number;
  name: string;
  degreeId: number;
  sequence?: number;
}

const fetchInstitutions = async () => {
  const res = await fetch('/api/institutions');
  if (!res.ok) throw new Error('Failed to fetch institutions');
  const data = await res.json();
  // Map backend 'sequence' to frontend 'sequence'
  return Array.isArray(data.data)
    ? data.data.map((inst: any) => ({ ...inst, sequence: inst.sequence }))
    : [];
};

const fetchDegrees = async () => {
  const res = await fetch('/api/degrees');
  if (!res.ok) throw new Error('Failed to fetch degrees');
  const data = await res.json();
  return Array.isArray(data.data) ? data.data : [];
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{status}</span>
  );
}

function InstitutionDialog({
  open,
  onOpenChange,
  onSave,
  initialData,
  degrees,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: InstitutionForm) => void;
  initialData: InstitutionForm | null;
  degrees: any[];
}) {
  const [form, setForm] = useState<InstitutionForm>(
    initialData || { name: '', degreeId: 0, sequence: 0 }
  );

  useEffect(() => {
    setForm(initialData || { name: '', degreeId: 0, sequence: 0 });
  }, [initialData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>{initialData ? 'Edit Institution' : 'Add Institution'}</DialogTitle>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <Label>Degree</Label>
            <select
              className="w-full border rounded px-2 py-1"
              value={String(form.degreeId ?? 0)}
              onChange={e => setForm(f => ({ ...f, degreeId: Number(e.target.value) }))}
            >
              <option value={"0"}>Select Degree</option>
              {degrees.map((deg) => (
                <option key={deg.id} value={String(deg.id)}>{deg.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Sequence</Label>
            <Input
              type="number"
              value={form.sequence !== undefined && form.sequence !== null ? String(form.sequence) : ''}
              onChange={e => setForm(f => ({ ...f, sequence: Number(e.target.value) }))}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onSave(form)}>{initialData ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const addInstitution = async (data: InstitutionForm) => {
  const { name, degreeId, sequence } = data;
  const payload = { name, degreeId, sequence: sequence };
  const res = await fetch('/api/institutions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to add institution');
  const created = await res.json();
  return { ...created, sequence: created.sequence };
};

const updateInstitution = async (id: number, data: InstitutionForm) => {
  const { name, degreeId, sequence } = data;
  const payload = { name, degreeId, sequence: sequence };
  const res = await fetch(`/api/institutions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update institution');
  const updated = await res.json();
  return { ...updated, sequence: updated.sequence };
};

const deleteInstitution = async (id: number) => true;

export default function InstitutionPage() {
  const [institutions, setInstitutions] = useState<InstitutionForm[]>([]);
  const [degrees, setDegrees] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<InstitutionForm | null>(null);
  const [loading, setLoading] = useState(false);
const fileInputRef = useRef<HTMLInputElement | null>(null);
 const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchInstitutions().then(setInstitutions);
    fetchDegrees().then(setDegrees);
  }, []);

  const handleAdd = () => { setEditData(null); setDialogOpen(true); };
  const handleEdit = (row: InstitutionForm) => {
    setEditData({
      id: row.id,
      name: row.name,
      degreeId: row.degreeId,
      sequence: row.sequence,
    });
    setDialogOpen(true);
  };
  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this institution?')) {
      await deleteInstitution(id);
      setInstitutions(insts => insts.filter(i => i.id !== id));
    }
  };
  const handleSave = async (data: InstitutionForm) => {
    if (editData) {
      const id = institutions.find(i => i.name === editData.name)?.id;
      if (id !== undefined) {
        const updated = await updateInstitution(id, data);
        setInstitutions((insts: InstitutionForm[]) => insts.map((i: InstitutionForm) => i.id === updated.id ? updated : i));
      }
    } else {
      const created: InstitutionForm = await addInstitution(data);
      if (created && created.id) {
        setInstitutions((insts: InstitutionForm[]) => [...insts, created]);
      } else {
        await fetchInstitutions().then(setInstitutions);
      }
    }
    setDialogOpen(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
        setUploadProgress(0);
      }
    };

  // Placeholder for upload/download
  const handleUpload = () => alert('Upload not implemented');
  const handleDownload = () => alert('Download template not implemented');

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Institutions Management</h2>
      <div className="flex gap-2 mb-4">
      <Input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileSelect}
                  accept=".xlsx,.xls"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
                {selectedFile && (
                  <span className="text-sm text-gray-600">{selectedFile.name}</span>
                )}
        <Button onClick={handleUpload}>Upload File</Button>
        <Button onClick={handleDownload} variant="outline">Download Template</Button>
        <Button onClick={handleAdd} className="ml-auto">+ Add Institution</Button>
      </div>
      <div className="overflow-x-auto rounded border bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sr. No</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Degree ID</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sequence</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {institutions.map((inst, idx) => (
              <tr key={inst.id}>
                <td className="px-4 py-2">{idx + 1}</td>
                <td className="px-4 py-2">{inst.name}</td>
                <td className="px-4 py-2">{inst.degreeId}</td>
                <td className="px-4 py-2">{inst.sequence}</td>
                <td className="px-4 py-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(inst)}>
                    <span role="img" aria-label="edit">✏️</span>
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(inst.id!)}>
                    <span role="img" aria-label="delete">🗑️</span>
                  </Button>
                </td>
              </tr>
            ))}
            {institutions.length === 0 && (
              <tr><td colSpan={6} className="text-center py-4 text-gray-500">No institutions found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <InstitutionDialog open={dialogOpen} onOpenChange={setDialogOpen} onSave={handleSave} initialData={editData} degrees={degrees} />
    </div>
  );
}
