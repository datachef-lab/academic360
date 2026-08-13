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
import { Edit, Loader2, MapPin, Plus, Search, Trash2 } from "lucide-react";
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

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="min-w-0 p-2 sm:p-4">
      <Card className="min-w-0 border-none">
        <CardHeader className="mb-3 rounded-md border bg-background p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <MapPin className="mr-2 h-8 w-8 rounded-md border p-1" />
                Library Zones
              </CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                Physical zones inside a branch (reading rooms, reference, e-resources).
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={onCreate}>
                <Plus className="mr-1 h-4 w-4" />
                ADD
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-w-0 px-0">
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

          <div className="relative min-w-0 px-2 sm:px-4" style={{ minHeight: "400px" }}>
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading…
              </div>
            ) : rows.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                No zones found.
              </div>
            ) : (
              <>
                <div className="min-w-0 pb-2">
                  <div className="max-h-[70vh] overflow-auto [&>div]:!overflow-visible rounded-md border bg-background">
                    <Table containerClassName="min-w-[860px] border">
                      <TableHeader className={STICKY_THEAD_CLASS}>
                        <TableRow>
                          <TableHead className={STICKY_TH_LEFT}>#</TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[220px]")}>
                            Name
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[140px]")}>
                            Code
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[200px]")}>
                            Branch
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[110px]")}>
                            Capacity
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[100px]")}>
                            Active
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_RIGHT, "min-w-[100px]")}>
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((r, i) => (
                          <TableRow
                            key={r.id}
                            className="cursor-pointer hover:bg-gray-50/60"
                            onClick={() => onEdit(r)}
                          >
                            <TableCell className="align-top whitespace-nowrap">
                              {(page - 1) * limit + i + 1}
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="font-semibold text-slate-900">{r.name}</div>
                            </TableCell>
                            <TableCell className="align-top text-xs text-slate-800">
                              {r.code?.trim() ? r.code : "—"}
                            </TableCell>
                            <TableCell className="align-top text-xs text-slate-800">
                              {r.branchName?.trim() ? r.branchName : "—"}
                            </TableCell>
                            <TableCell className="align-top text-xs text-slate-800">
                              {r.capacity ?? "—"}
                            </TableCell>
                            <TableCell className="align-top text-xs text-slate-800">
                              {r.isActive ? "Yes" : "No"}
                            </TableCell>
                            <TableCell className="align-top text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(r);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirm(r);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-2 text-sm text-slate-600 sm:px-4">
            <span>
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span>
                Page {page} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] w-[min(96vw,720px)] overflow-y-auto sm:max-w-[720px]">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{editingId == null ? "Add zone" : "Edit zone"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 px-6 py-4">
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
          <DialogFooter className="border-t bg-muted/30 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-none"
              disabled={saving}
              onClick={() => void onSubmit()}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving..." : "Save"}
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
