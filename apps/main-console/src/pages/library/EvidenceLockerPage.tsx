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
  getEvidenceDocUrl,
  updateEvidenceDoc,
} from "@/services/library-evidence-docs.service";
import type {
  EvidenceDocRow,
  EvidenceDocUpsertBody,
} from "@/services/library-evidence-docs.service";
import {
  STICKY_THEAD_CLASS,
  STICKY_TH_BASE,
  STICKY_TH_LEFT,
  STICKY_TH_RIGHT,
} from "@/components/library/LibraryTablePage";
import { cn } from "@/lib/utils";
import { LibraryPageHeader } from "@/components/library/LibraryPageHeader";

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
  // Backend derives fileKey/mimeType/fileSizeBytes from the uploaded file when one is sent.
  fileKey: f.fileKey.trim() || undefined,
  mimeType: f.mimeType.trim() || null,
  tags: f.tags.trim() || null,
  academicYear: f.academicYear.trim() || null,
});

const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

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
  const [formFile, setFormFile] = useState<File | null>(null);
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
    setFormFile(null);
    setDialogOpen(true);
  };

  const onEdit = (r: EvidenceDocRow) => {
    setEditingId(r.id);
    setForm(rowToForm(r));
    setFormFile(null);
    setDialogOpen(true);
  };

  const onView = async (row: EvidenceDocRow) => {
    try {
      const res = await getEvidenceDocUrl(row.id);
      const url = res.payload?.url;
      if (!url) {
        toast.error("No file attached.");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not open file.";
      toast.error(msg);
    }
  };

  const onSubmit = async () => {
    if (!form.criterionCode.trim() || !form.title.trim()) {
      toast.error("Criterion and title are required.");
      return;
    }
    if (!editingId && !formFile) {
      toast.error("Please choose a file to upload.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateEvidenceDoc(editingId, formToBody(form), formFile);
        toast.success("Evidence doc updated.");
      } else {
        await createEvidenceDoc(formToBody(form), formFile);
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
    <div className="min-w-0 p-2 sm:p-4">
      <LibraryPageHeader
        icon={ShieldCheck}
        title="Accreditation Evidence Locker"
        subtitle="Evidence documents tagged by NAAC / NIRF / AISHE criterion code."
        actions={
          <Button onClick={onCreate} className="gap-1">
            <Plus className="h-4 w-4" /> Upload entry
          </Button>
        }
      />
      <Card className="min-w-0 border-none">
        <CardContent className="space-y-3 px-0">
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
                      <button
                        type="button"
                        onClick={() => void onView(r)}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                      >
                        <Download className="h-3.5 w-3.5" /> View
                      </button>
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
              <TableHeader className={STICKY_THEAD_CLASS}>
                <TableRow>
                  <TableHead className={STICKY_TH_LEFT}>Criterion</TableHead>
                  <TableHead className={STICKY_TH_BASE}>Title</TableHead>
                  <TableHead className={STICKY_TH_BASE}>Academic year</TableHead>
                  <TableHead className={STICKY_TH_BASE}>Tags</TableHead>
                  <TableHead className={STICKY_TH_BASE}>File</TableHead>
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
                        <button
                          type="button"
                          onClick={() => void onView(r)}
                          className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                        >
                          <Download className="h-4 w-4" /> View
                        </button>
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
              <Label>File {editingId ? "(leave empty to keep current)" : "*"}</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
                onChange={(e) => setFormFile(e.target.files?.[0] ?? null)}
              />
              {formFile ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {formFile.name} · {formatBytes(formFile.size)}
                </p>
              ) : editingId && form.fileKey ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Current file: {form.fileKey.split("/").pop()}
                </p>
              ) : null}
            </div>
            <div>
              <Label>Tags</Label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
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
