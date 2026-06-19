import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Sun, Trash2 } from "lucide-react";
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

type Shift = {
  id: number;
  name: string;
  codePrefix: string | null;
  sequence: number | null;
  disabled: boolean | null;
};

const fetchShifts = async (): Promise<Shift[]> => {
  const res = await axiosInstance.get<Shift[]>("/api/v1/shifts");
  return res.data;
};

const createShift = async (payload: Partial<Shift>) => {
  await axiosInstance.post("/api/v1/shifts", payload);
};

const updateShift = async (id: number, payload: Partial<Shift>) => {
  await axiosInstance.put(`/api/v1/shifts/${id}`, payload);
};

const deleteShift = async (id: number) => {
  await axiosInstance.delete(`/api/v1/shifts/${id}`);
};

export default function ShiftsMasterPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["shifts"], queryFn: fetchShifts });

  const [editing, setEditing] = useState<Shift | null>(null);
  const [creating, setCreating] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: deleteShift,
    onSuccess: () => {
      toast.success("Shift deleted.");
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
    },
    onError: () => toast.error("Could not delete shift."),
  });

  return (
    <div className="p-6 space-y-4">
      <IdCardPageHeader
        icon={Sun}
        title="Shifts"
        subtitle="Shift master used across academic, exam and idcard modules."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Shift
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
                <TableHead>Code Prefix</TableHead>
                <TableHead>Sequence</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!query.isLoading && (query.data?.length ?? 0) === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-gray-500 text-sm">
                    No shifts defined yet.
                  </TableCell>
                </TableRow>
              )}
              {query.data?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.id}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.codePrefix ?? "—"}</TableCell>
                  <TableCell>{s.sequence ?? "—"}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        s.disabled ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {s.disabled ? "Disabled" : "Active"}
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
                        if (confirm("Delete this shift?")) deleteMutation.mutate(s.id);
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
        <ShiftUpsertDialog
          open
          shift={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["shifts"] })}
        />
      )}
    </div>
  );
}

function ShiftUpsertDialog({
  open,
  shift,
  onClose,
  onSaved,
}: {
  open: boolean;
  shift: Shift | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!shift;
  const [name, setName] = useState(shift?.name ?? "");
  const [codePrefix, setCodePrefix] = useState(shift?.codePrefix ?? "");
  const [sequence, setSequence] = useState<number | "">(shift?.sequence ?? "");
  const [disabled, setDisabled] = useState(!!shift?.disabled);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Name is required.");
      const payload: Partial<Shift> = {
        name: name.trim(),
        codePrefix: codePrefix.trim() || null,
        sequence: sequence === "" ? null : Number(sequence),
        disabled,
      };
      if (isEdit && shift) await updateShift(shift.id, payload);
      else await createShift(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Shift updated." : "Shift created.");
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
          <DialogTitle>{isEdit ? "Edit Shift" : "New Shift"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Code Prefix</Label>
            <Input value={codePrefix} onChange={(e) => setCodePrefix(e.target.value)} />
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
              id="shift-disabled"
              type="checkbox"
              checked={disabled}
              onChange={(e) => setDisabled(e.target.checked)}
            />
            <Label htmlFor="shift-disabled">Disabled</Label>
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
