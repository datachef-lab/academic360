import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, MapPin, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useActiveLibraryBranchId } from "@/features/library/use-library-branch";
import type { LibraryZoneRow, LibraryZoneUpsertBody } from "@/services/library-zones.service";
import {
  createLibraryZone,
  deleteLibraryZone,
  getLibraryZones,
  updateLibraryZone,
} from "@/services/library-zones.service";
import { getLibraryBranches } from "@/services/library-branches.service";
import { Combobox } from "@/components/ui/combobox";
import {
  STICKY_THEAD_CLASS,
  STICKY_TH_BASE,
  STICKY_TH_LEFT,
  STICKY_TH_RIGHT,
} from "@/components/library/LibraryTablePage";
import { cn } from "@/lib/utils";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";

type FormState = {
  name: string;
  code: string;
  description: string;
  capacity: string;
  branchId: string;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  code: "",
  description: "",
  capacity: "",
  branchId: "",
  isActive: true,
});

const rowToForm = (r: LibraryZoneRow): FormState => ({
  name: r.name ?? "",
  code: r.code ?? "",
  description: r.description ?? "",
  capacity: r.capacity != null ? String(r.capacity) : "",
  branchId: r.branchId != null ? String(r.branchId) : "",
  isActive: r.isActive ?? true,
});

const formToBody = (f: FormState): LibraryZoneUpsertBody => ({
  name: f.name.trim(),
  code: f.code.trim() || null,
  description: f.description.trim() || null,
  capacity: f.capacity ? Number(f.capacity) : null,
  branchId: f.branchId ? Number(f.branchId) : null,
  isActive: f.isActive,
});

export default function LibraryZonesMasterPage() {
  const [activeBranchId] = useActiveLibraryBranchId();
  const [rows, setRows] = useState<LibraryZoneRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<LibraryZoneRow | null>(null);
  const [branchOptions, setBranchOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await getLibraryBranches({ page: 1, limit: 200 });
        setBranchOptions(
          (res.payload?.rows ?? []).map((r) => ({
            value: String(r.id),
            label: r.code ? `${r.name} (${r.code})` : r.name,
          })),
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getLibraryZones({
        page,
        limit,
        search: debounced.trim() || undefined,
        ...(activeBranchId != null ? { branchId: activeBranchId } : {}),
      });
      setRows(res.payload?.rows ?? []);
      setTotal(res.payload?.total ?? 0);
    } catch {
      toast.error("Failed to load zones.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debounced, activeBranchId]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const onCreate = () => {
    setEditingId(null);
    // Pre-fill the Branch combobox with the active right-sidebar branch so the
    // librarian doesn't have to pick it again — it's almost always the same.
    setForm({
      ...emptyForm(),
      branchId: activeBranchId != null ? String(activeBranchId) : "",
    });
    setDialogOpen(true);
  };

  const onEdit = (row: LibraryZoneRow) => {
    setEditingId(row.id);
    setForm(rowToForm(row));
    setDialogOpen(true);
  };

  const onSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateLibraryZone(editingId, formToBody(form));
        toast.success("Zone updated.");
      } else {
        await createLibraryZone(formToBody(form));
        toast.success("Zone created.");
      }
      setDialogOpen(false);
      void fetchRows();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to save zone.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm) return;
    try {
      await deleteLibraryZone(confirm.id);
      toast.success("Zone deleted.");
      setConfirm(null);
      void fetchRows();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to delete zone.";
      toast.error(msg);
    }
  };

  return (
    <div className="min-w-0 p-2 sm:p-4">
      <LibraryPageHeader
        icon={MapPin}
        title="Library Zones"
        subtitle="Physical zones inside a branch (reading rooms, reference, e-resources)."
        actions={
          <Button onClick={onCreate} className="gap-1">
            <Plus className="h-4 w-4" /> Add zone
          </Button>
        }
      />
      <Card className="min-w-0 border-none">
        <CardContent className="px-0">
          <div className="mb-3 border-b bg-background px-2 py-3 sm:px-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                className="pl-9"
                placeholder="Search zones…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          {/* Mobile list */}
          <div className="space-y-2 sm:hidden">
            {loading ? (
              <div className="flex justify-center py-6 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">No zones.</div>
            ) : (
              rows.map((r) => (
                <div key={r.id} className="rounded-lg border p-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{r.name}</p>
                      {r.code ? <p className="text-xs text-gray-500">Code: {r.code}</p> : null}
                      {r.branchName ? (
                        <p className="text-xs text-gray-500">Branch: {r.branchName}</p>
                      ) : null}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => onEdit(r)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-600"
                        onClick={() => setConfirm(r)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader className={STICKY_THEAD_CLASS}>
                <TableRow>
                  <TableHead className={STICKY_TH_LEFT}>Name</TableHead>
                  <TableHead className={STICKY_TH_BASE}>Code</TableHead>
                  <TableHead className={STICKY_TH_BASE}>Branch</TableHead>
                  <TableHead className={STICKY_TH_BASE}>Capacity</TableHead>
                  <TableHead className={STICKY_TH_BASE}>Active</TableHead>
                  <TableHead className={cn(STICKY_TH_RIGHT, "text-right")}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-gray-500" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-gray-500">
                      No zones.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>{r.code ?? "—"}</TableCell>
                      <TableCell>{r.branchName ?? "—"}</TableCell>
                      <TableCell>{r.capacity ?? "—"}</TableCell>
                      <TableCell>{r.isActive ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => onEdit(r)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600"
                          onClick={() => setConfirm(r)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {total > limit ? (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>
                Page {page} of {Math.max(1, Math.ceil(total / limit))} · {total} total
              </span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page * limit >= total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit zone" : "New zone"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </div>
              <div>
                <Label>Branch</Label>
                <Combobox
                  placeholder="Select branch"
                  value={form.branchId}
                  dataArr={branchOptions}
                  onChange={(v) => setForm({ ...form, branchId: v })}
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Capacity</Label>
                <Input
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  inputMode="numeric"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="zone-active"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <Label htmlFor="zone-active">Active</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={onSubmit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete zone?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{confirm?.name}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={onDelete} className="ml-2">
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
