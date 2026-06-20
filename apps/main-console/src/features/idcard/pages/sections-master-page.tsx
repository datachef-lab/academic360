import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import axiosInstance from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IdCardPageHeader } from "../components/page-header";

type Section = {
  id: number;
  name: string;
  sequence: number | null;
  isActive: boolean | null;
};

const fetchSections = async (): Promise<Section[]> => {
  const res = await axiosInstance.get<{ payload: Section[] }>("/api/v1/sections");
  return res.data.payload;
};

const createSection = async (payload: Partial<Section>) => {
  await axiosInstance.post("/api/v1/sections", payload);
};

const updateSection = async (id: number, payload: Partial<Section>) => {
  await axiosInstance.put(`/api/v1/sections/${id}`, payload);
};

const deleteSection = async (id: number) => {
  await axiosInstance.delete(`/api/v1/sections/${id}`);
};

export default function SectionsMasterPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["sections"], queryFn: fetchSections });

  const [editing, setEditing] = useState<Section | null>(null);
  const [creating, setCreating] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: deleteSection,
    onSuccess: () => {
      toast.success("Section deleted.");
      queryClient.invalidateQueries({ queryKey: ["sections"] });
    },
    onError: () => toast.error("Could not delete section."),
  });

  return (
    <div className="p-6 space-y-4">
      <IdCardPageHeader
        icon={Layers}
        title="Sections"
        subtitle="Section master used across academic and idcard modules."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Section
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Sequence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!query.isLoading && (query.data?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-500 text-sm">
                    No sections defined yet.
                  </TableCell>
                </TableRow>
              )}
              {query.data?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.id}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.sequence ?? "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        s.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 ml-1"
                      onClick={() => {
                        if (confirm("Delete this section?")) deleteMutation.mutate(s.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {(creating || editing) && (
        <SectionUpsertDialog
          open
          section={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["sections"] })}
        />
      )}
    </div>
  );
}

function SectionUpsertDialog({
  open,
  section,
  onClose,
  onSaved,
}: {
  open: boolean;
  section: Section | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!section;
  const [name, setName] = useState(section?.name ?? "");
  const [sequence, setSequence] = useState<number | "">(section?.sequence ?? "");
  const [isActive, setIsActive] = useState(section?.isActive ?? true);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name is required.");
      const payload: Partial<Section> = {
        name: name.trim(),
        sequence: sequence === "" ? null : Number(sequence),
        isActive,
      };
      if (isEdit && section) await updateSection(section.id, payload);
      else await createSection(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Section updated." : "Section created.");
      onSaved();
      onClose();
    },
    onError: (e: unknown) => {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    },
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Section" : "New Section"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Sequence</Label>
            <Input
              type="number"
              value={sequence}
              onChange={(e) => setSequence(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="section-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <Label htmlFor="section-active">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isLoading}>
            {saveMutation.isLoading ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
