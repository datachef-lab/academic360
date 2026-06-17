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
import { Archive, Download, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  createAcademicArchive,
  deleteAcademicArchive,
  getAcademicArchives,
  updateAcademicArchive,
} from "@/services/library-academic-archives.service";
import type {
  AcademicArchiveRow,
  AcademicArchiveUpsertBody,
} from "@/services/library-academic-archives.service";

type FormState = {
  archiveType: string;
  title: string;
  description: string;
  programCourseId: string;
  classId: string;
  year: string;
  fileKey: string;
  mimeType: string;
  tags: string;
};

const emptyForm = (): FormState => ({
  archiveType: "",
  title: "",
  description: "",
  programCourseId: "",
  classId: "",
  year: "",
  fileKey: "",
  mimeType: "",
  tags: "",
});

const rowToForm = (r: AcademicArchiveRow): FormState => ({
  archiveType: r.archiveType ?? "",
  title: r.title ?? "",
  description: r.description ?? "",
  programCourseId: r.programCourseId != null ? String(r.programCourseId) : "",
  classId: r.classId != null ? String(r.classId) : "",
  year: r.year != null ? String(r.year) : "",
  fileKey: r.fileKey ?? "",
  mimeType: r.mimeType ?? "",
  tags: r.tags ?? "",
});

const formToBody = (f: FormState): AcademicArchiveUpsertBody => ({
  archiveType: f.archiveType.trim(),
  title: f.title.trim(),
  description: f.description.trim() || null,
  programCourseId: f.programCourseId ? Number(f.programCourseId) : null,
  classId: f.classId ? Number(f.classId) : null,
  year: f.year ? Number(f.year) : null,
  fileKey: f.fileKey.trim(),
  mimeType: f.mimeType.trim() || null,
  tags: f.tags.trim() || null,
});

export default function AcademicArchivePage() {
  const [rows, setRows] = useState<AcademicArchiveRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filters, setFilters] = useState({
    archiveType: "",
    programCourseId: "",
    classId: "",
    year: "",
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<AcademicArchiveRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAcademicArchives({
        page,
        limit,
        search: debounced.trim() || undefined,
        archiveType: filters.archiveType.trim() || undefined,
        programCourseId: filters.programCourseId ? Number(filters.programCourseId) : undefined,
        classId: filters.classId ? Number(filters.classId) : undefined,
        year: filters.year ? Number(filters.year) : undefined,
      });
      setRows(res.payload?.rows ?? []);
      setTotal(res.payload?.total ?? 0);
    } catch {
      toast.error("Failed to load archives.");
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

  const onEdit = (r: AcademicArchiveRow) => {
    setEditingId(r.id);
    setForm(rowToForm(r));
    setDialogOpen(true);
  };

  const onSubmit = async () => {
    if (!form.archiveType.trim() || !form.title.trim() || !form.fileKey.trim()) {
      toast.error("Type, title, and file key are required.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateAcademicArchive(editingId, formToBody(form));
        toast.success("Archive updated.");
      } else {
        await createAcademicArchive(formToBody(form));
        toast.success("Archive created.");
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
      await deleteAcademicArchive(confirm.id);
      toast.success("Archive deleted.");
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
            <Archive className="h-5 w-5 text-indigo-600" />
            <CardTitle>Academic Archive</CardTitle>
          </div>
          <Button onClick={onCreate} className="gap-1">
            <Plus className="h-4 w-4" /> Add entry
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-5">
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
              placeholder="Type (e.g. SYLLABUS)"
              value={filters.archiveType}
              onChange={(e) => setFilters({ ...filters, archiveType: e.target.value })}
            />
            <Input
              placeholder="Program course ID"
              value={filters.programCourseId}
              onChange={(e) => setFilters({ ...filters, programCourseId: e.target.value })}
              inputMode="numeric"
            />
            <Input
              placeholder="Year"
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              inputMode="numeric"
            />
          </div>

          {/* Mobile */}
          <div className="space-y-2 sm:hidden">
            {loading ? (
              <div className="flex justify-center py-6 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : rows.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">No entries.</div>
            ) : (
              rows.map((r) => (
                <div key={r.id} className="rounded-lg border p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{r.title}</p>
                      <p className="text-xs text-gray-500">
                        {r.archiveType}
                        {r.year ? ` · ${r.year}` : ""}
                      </p>
                      {r.programCourseName ? (
                        <p className="text-xs text-gray-500">{r.programCourseName}</p>
                      ) : null}
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
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Program / Class</TableHead>
                  <TableHead>Year</TableHead>
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
                      No entries.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell>{r.archiveType}</TableCell>
                      <TableCell>
                        {r.programCourseName ?? "—"}
                        {r.className ? ` / ${r.className}` : ""}
                      </TableCell>
                      <TableCell>{r.year ?? "—"}</TableCell>
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
            <DialogTitle>{editingId ? "Edit archive entry" : "New archive entry"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Type * (e.g. SYLLABUS)</Label>
                <Input
                  value={form.archiveType}
                  onChange={(e) => setForm({ ...form, archiveType: e.target.value })}
                />
              </div>
              <div>
                <Label>Year</Label>
                <Input
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>
                  Program Course ID <span title="Paste integer ID">?</span>
                </Label>
                <Input
                  value={form.programCourseId}
                  onChange={(e) => setForm({ ...form, programCourseId: e.target.value })}
                  inputMode="numeric"
                />
              </div>
              <div>
                <Label>Class ID</Label>
                <Input
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value })}
                  inputMode="numeric"
                />
              </div>
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
                <Label>Tags (comma separated)</Label>
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
            <AlertDialogTitle>Delete archive entry?</AlertDialogTitle>
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
