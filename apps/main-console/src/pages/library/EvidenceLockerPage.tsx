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
import { Download, Loader2, Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import {
  createEvidenceDoc,
  deleteEvidenceDoc,
  getEvidenceDocs,
  updateEvidenceDoc,
} from "@/services/library-evidence-docs.service";
import type {
  EvidenceDocRow,
  EvidenceDocUpsertBody,
} from "@/services/library-evidence-docs.service";

type FormState = {
  criterionCode: string;
  title: string;
  description: string;
  fileKey: string;
  mimeType: string;
  tags: string;
  academicYear: string;
};

const emptyForm = (): FormState => ({
  criterionCode: "",
  title: "",
  description: "",
  fileKey: "",
  mimeType: "",
  tags: "",
  academicYear: "",
});

const rowToForm = (r: EvidenceDocRow): FormState => ({
  criterionCode: r.criterionCode ?? "",
  title: r.title ?? "",
  description: r.description ?? "",
  fileKey: r.fileKey ?? "",
  mimeType: r.mimeType ?? "",
  tags: r.tags ?? "",
  academicYear: r.academicYear ?? "",
});

const formToBody = (f: FormState): EvidenceDocUpsertBody => ({
  criterionCode: f.criterionCode.trim(),
  title: f.title.trim(),
  description: f.description.trim() || null,
  fileKey: f.fileKey.trim(),
  mimeType: f.mimeType.trim() || null,
  tags: f.tags.trim() || null,
  academicYear: f.academicYear.trim() || null,
});

export default function EvidenceLockerPage() {
  const [rows, setRows] = useState<EvidenceDocRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filters, setFilters] = useState({ criterionCode: "", academicYear: "" });
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<EvidenceDocRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEvidenceDocs({
        page,
        limit,
        search: debounced.trim() || undefined,
        criterionCode: filters.criterionCode.trim() || undefined,
        academicYear: filters.academicYear.trim() || undefined,
      });
      setRows(res.payload?.rows ?? []);
      setTotal(res.payload?.total ?? 0);
    } catch {
      toast.error("Failed to load evidence documents.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debounced, filters]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const onCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const onEdit = (r: EvidenceDocRow) => {
    setEditingId(r.id);
    setForm(rowToForm(r));
    setDialogOpen(true);
  };

  const onSubmit = async () => {
    if (!form.criterionCode.trim() || !form.title.trim() || !form.fileKey.trim()) {
      toast.error("Criterion, title, and file key are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateEvidenceDoc(editingId, formToBody(form));
        toast.success("Evidence doc updated.");
      } else {
        await createEvidenceDoc(formToBody(form));
        toast.success("Evidence doc created.");
      }
      setDialogOpen(false);
      void fetchRows();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Save failed.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm) return;
    try {
      await deleteEvidenceDoc(confirm.id);
      toast.success("Evidence doc deleted.");
      setConfirm(null);
      void fetchRows();
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Delete failed.";
      toast.error(msg);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-indigo-600" />
            <CardTitle>Accreditation Evidence Locker</CardTitle>
          </div>
          <Button onClick={onCreate} className="gap-1">
            <Plus className="h-4 w-4" /> Upload entry
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search title..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Input
              placeholder="Criterion code (e.g. 4.2.1)"
              value={filters.criterionCode}
              onChange={(e) => setFilters({ ...filters, criterionCode: e.target.value })}
            />
            <Input
              placeholder="Academic year (e.g. 2025-26)"
              value={filters.academicYear}
              onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
            />
          </div>

          {/* Mobile */}
          <div className="space-y-2 sm:hidden">
            {loading ? (
              <div className="flex justify-center py-6 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">No evidence docs.</div>
            ) : (
              rows.map((r) => (
                <div key={r.id} className="rounded-lg border p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.title}</p>
                      <p className="text-xs text-gray-500">
                        {r.criterionCode}
                        {r.academicYear ? ` · ${r.academicYear}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <a
                        href={r.fileKey}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                      >
                        <Download className="h-3.5 w-3.5" /> View
                      </a>
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
                </div>
              ))
            )}
          </div>

          {/* Desktop */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Criterion</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Academic year</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      No evidence docs.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.criterionCode}</TableCell>
                      <TableCell>{r.title}</TableCell>
                      <TableCell>{r.academicYear ?? "—"}</TableCell>
                      <TableCell className="text-xs text-gray-500">{r.tags ?? "—"}</TableCell>
                      <TableCell>
                        <a
                          href={r.fileKey}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                        >
                          <Download className="h-4 w-4" /> View
                        </a>
                      </TableCell>
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
            <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit evidence doc" : "Upload evidence doc"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Criterion code *</Label>
                <Input
                  value={form.criterionCode}
                  onChange={(e) => setForm({ ...form, criterionCode: e.target.value })}
                />
              </div>
              <div>
                <Label>Academic year</Label>
                <Input
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label>File key (S3 path) *</Label>
              <Input
                value={form.fileKey}
                onChange={(e) => setForm({ ...form, fileKey: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>MIME type</Label>
                <Input
                  value={form.mimeType}
                  onChange={(e) => setForm({ ...form, mimeType: e.target.value })}
                />
              </div>
              <div>
                <Label>Tags</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
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
            <AlertDialogTitle>Delete evidence doc?</AlertDialogTitle>
            <AlertDialogDescription>This will remove "{confirm?.title}".</AlertDialogDescription>
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
