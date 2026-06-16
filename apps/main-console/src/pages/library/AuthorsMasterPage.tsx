import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Combobox } from "@/components/ui/combobox";
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
import { Loader2, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import type { LibraryAuthorRow, LibraryAuthorUpsertBody } from "@/services/library-authors.service";
import {
  createLibraryAuthor,
  deleteLibraryAuthor,
  getLibraryAuthorById,
  getLibraryAuthors,
  updateLibraryAuthor,
} from "@/services/library-authors.service";
import { getLibraryAuthorTypes } from "@/services/library-author-types.service";
import { getAllNationalities } from "@/services/nationalities.service";

type FormState = {
  name: string;
  shortName: string;
  authorTypeId: string;
  nationalityId: string;
  remarks: string;
};

const emptyForm = (): FormState => ({
  name: "",
  shortName: "",
  authorTypeId: "",
  nationalityId: "",
  remarks: "",
});

const detailToForm = (d: LibraryAuthorRow): FormState => ({
  name: d.name ?? "",
  shortName: d.shortName ?? "",
  authorTypeId: d.authorTypeId != null ? String(d.authorTypeId) : "",
  nationalityId: d.nationalityId != null ? String(d.nationalityId) : "",
  remarks: d.remarks ?? "",
});

const formToBody = (f: FormState): LibraryAuthorUpsertBody => ({
  name: f.name.trim(),
  shortName: f.shortName.trim() || null,
  authorTypeId: f.authorTypeId ? Number(f.authorTypeId) : null,
  nationalityId: f.nationalityId ? Number(f.nationalityId) : null,
  remarks: f.remarks.trim() || null,
});

const parseDate = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

function RowActions({
  row,
  onEdit,
  onDelete,
}: {
  row: LibraryAuthorRow;
  onEdit: (_id: number) => void;
  onDelete: (_row: LibraryAuthorRow) => void;
}) {
  return (
    <div className="inline-flex shrink-0 items-center justify-end gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEdit(row.id)}
        aria-label="Edit"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-600 hover:text-red-700"
        onClick={() => onDelete(row)}
        aria-label="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function AuthorsMasterPage() {
  const [rows, setRows] = useState<LibraryAuthorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [authorTypeOptions, setAuthorTypeOptions] = useState<{ value: string; label: string }[]>(
    [],
  );
  const [nationalityOptions, setNationalityOptions] = useState<{ value: string; label: string }[]>(
    [],
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const [deleteTarget, setDeleteTarget] = useState<LibraryAuthorRow | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    (async () => {
      try {
        const [types, nationalities] = await Promise.all([
          getLibraryAuthorTypes({ page: 1, limit: 200 }),
          getAllNationalities(),
        ]);
        setAuthorTypeOptions(
          types.payload.rows.map((r) => ({
            value: String(r.id),
            label: r.name,
          })),
        );
        setNationalityOptions(nationalities.map((n) => ({ value: String(n.id), label: n.name })));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLibraryAuthors({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      setRows(res.payload.rows);
      setTotal(res.payload.total);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load authors");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = async (id: number) => {
    try {
      const res = await getLibraryAuthorById(id);
      setEditingId(id);
      setForm(detailToForm(res.payload));
      setDialogOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load author");
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      setSaving(true);
      const body = formToBody(form);
      if (editingId == null) {
        await createLibraryAuthor(body);
        toast.success("Author created");
      } else {
        await updateLibraryAuthor(editingId, body);
        toast.success("Author updated");
      }
      setDialogOpen(false);
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Could not save author");
    } finally {
      setSaving(false);
    }
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteInProgress(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteInProgress(true);
      await deleteLibraryAuthor(deleteTarget.id);
      toast.success("Author deleted");
      closeDeleteDialog();
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    } finally {
      setDeleteInProgress(false);
    }
  };

  const dialogTitle = useMemo(
    () => (editingId == null ? "Add author" : "Edit author"),
    [editingId],
  );

  return (
    <div className="min-w-0 p-2 sm:p-4">
      <Card className="min-w-0 border-none">
        <CardHeader className="mb-3 rounded-md border bg-background p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Users className="mr-2 h-8 w-8 rounded-md border p-1" />
                Authors
              </CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                Manage authors, editors, translators, and other contributors.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus className="mr-1 h-4 w-4" />
                Add author
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
                placeholder="Search by name..."
                value={searchInput}
                onChange={(e) => {
                  setPage(1);
                  setSearchInput(e.target.value);
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
                No authors found.
              </div>
            ) : (
              <>
                <div className="max-h-[70vh] space-y-3 overflow-y-auto pb-2 lg:hidden">
                  {rows.map((row, i) => (
                    <div
                      key={row.id}
                      className="rounded-lg border border-slate-200 bg-card p-3 shadow-sm"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-slate-500">
                          #{(page - 1) * limit + i + 1}
                        </span>
                        <RowActions row={row} onEdit={openEdit} onDelete={setDeleteTarget} />
                      </div>
                      <p className="font-semibold text-slate-900">{row.name}</p>
                      {row.shortName && (
                        <p className="text-xs text-muted-foreground">{row.shortName}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1 text-xs">
                        {row.authorTypeName && (
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-purple-700">
                            {row.authorTypeName}
                          </span>
                        )}
                        {row.nationalityName && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                            {row.nationalityName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden min-w-0 pb-2 lg:block">
                  <div className="max-h-[70vh] overflow-auto rounded-md border bg-background">
                    <Table containerClassName="min-w-[900px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead className="min-w-[260px]">Name</TableHead>
                          <TableHead className="min-w-[160px]">Short name</TableHead>
                          <TableHead className="min-w-[160px]">Type</TableHead>
                          <TableHead className="min-w-[160px]">Nationality</TableHead>
                          <TableHead className="w-[110px]">Updated</TableHead>
                          <TableHead className="w-[90px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row, i) => (
                          <TableRow key={row.id}>
                            <TableCell className="align-top whitespace-nowrap">
                              {(page - 1) * limit + i + 1}
                            </TableCell>
                            <TableCell className="align-top">
                              <div className="font-semibold text-slate-900">{row.name}</div>
                            </TableCell>
                            <TableCell className="align-top text-sm">
                              {row.shortName ?? "—"}
                            </TableCell>
                            <TableCell className="align-top text-sm">
                              {row.authorTypeName ?? "—"}
                            </TableCell>
                            <TableCell className="align-top text-sm">
                              {row.nationalityName ?? "—"}
                            </TableCell>
                            <TableCell className="align-top text-xs text-muted-foreground">
                              {parseDate(row.updatedAt)}
                            </TableCell>
                            <TableCell className="text-right align-top">
                              <RowActions row={row} onEdit={openEdit} onDelete={setDeleteTarget} />
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
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Author full name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Short name</Label>
              <Input
                value={form.shortName}
                onChange={(e) => setForm((f) => ({ ...f, shortName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Combobox
                dataArr={authorTypeOptions}
                value={form.authorTypeId}
                onChange={(v) => setForm((f) => ({ ...f, authorTypeId: v }))}
                placeholder="Select author type"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Nationality</Label>
              <Combobox
                dataArr={nationalityOptions}
                value={form.nationalityId}
                onChange={(v) => setForm((f) => ({ ...f, nationalityId: v }))}
                placeholder="Select nationality"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Remarks</Label>
              <Input
                value={form.remarks}
                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="border-t bg-muted/30 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="ml-2 bg-purple-600 hover:bg-purple-700 text-white shadow-none"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete author?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 text-left text-sm text-muted-foreground">
                <p>
                  You are about to delete{" "}
                  <span className="font-medium text-foreground">
                    &quot;{deleteTarget?.name}&quot;
                  </span>
                  . This cannot be undone.
                </p>
                <p>Deletion may fail if this author is linked to any book.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteInProgress}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteInProgress}
              onClick={() => void confirmDelete()}
            >
              {deleteInProgress ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
