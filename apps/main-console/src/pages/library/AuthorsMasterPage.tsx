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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Loader2, Plus, Search, Trash2, UserPen } from "lucide-react";
import { getAllNationalities } from "@/services/nationalities.service";
import type { LibraryAuthorRow, LibraryAuthorUpsertBody } from "@/services/library-authors.service";
import {
  createLibraryAuthor,
  deleteLibraryAuthor,
  getLibraryAuthorById,
  getLibraryAuthors,
  updateLibraryAuthor,
} from "@/services/library-authors.service";
import { getLibraryAuthorTypes } from "@/services/library-author-types.service";

type FormState = {
  name: string;
  shortName: string;
  nationalityId: string;
  authorTypeId: string;
  remarks: string;
};

const emptyForm = (): FormState => ({
  name: "",
  shortName: "",
  nationalityId: "",
  authorTypeId: "",
  remarks: "",
});

const detailToForm = (d: LibraryAuthorRow): FormState => ({
  name: d.name ?? "",
  shortName: d.shortName ?? "",
  nationalityId: d.nationalityId != null ? String(d.nationalityId) : "",
  authorTypeId: d.authorTypeId != null ? String(d.authorTypeId) : "",
  remarks: d.remarks ?? "",
});

const formToBody = (f: FormState): LibraryAuthorUpsertBody => ({
  name: f.name.trim(),
  shortName: f.shortName.trim() || null,
  nationalityId: f.nationalityId ? Number(f.nationalityId) : null,
  authorTypeId: f.authorTypeId ? Number(f.authorTypeId) : null,
  remarks: f.remarks.trim() || null,
});

const parseDate = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

const NONE = "__none__";

function RowActions({
  row,
  onEdit,
  onDelete,
}: {
  row: LibraryAuthorRow;
  onEdit: (id: number) => void;
  onDelete: (row: LibraryAuthorRow) => void;
}) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-7 w-7 p-0"
        onClick={() => onEdit(row.id)}
      >
        <Edit className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="destructive"
        className="h-7 w-7 p-0"
        onClick={() => onDelete(row)}
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

  const [authorTypes, setAuthorTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [nationalities, setNationalities] = useState<Array<{ id: number; name: string }>>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const [deleteTarget, setDeleteTarget] = useState<LibraryAuthorRow | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const authorTypeName = (id: number | null) =>
    id == null ? "—" : (authorTypes.find((t) => t.id === id)?.name ?? `#${id}`);

  const nationalityName = (id: number | null) =>
    id == null ? "—" : (nationalities.find((n) => n.id === id)?.name ?? `#${id}`);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    void (async () => {
      try {
        const [typesRes, natList] = await Promise.all([
          getLibraryAuthorTypes({ page: 1, limit: 500 }),
          getAllNationalities(),
        ]);
        setAuthorTypes(typesRes.payload.rows.map((r) => ({ id: r.id, name: r.name })));
        setNationalities(
          natList
            .filter((n): n is typeof n & { id: number } => n.id != null)
            .map((n) => ({ id: n.id, name: n.name })),
        );
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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteInProgress(true);
      await deleteLibraryAuthor(deleteTarget.id);
      toast.success("Author deleted");
      setDeleteTarget(null);
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    } finally {
      setDeleteInProgress(false);
    }
  };

  return (
    <div className="min-w-0 p-2 sm:p-4">
      <Card className="min-w-0 border-none">
        <CardHeader className="mb-3 rounded-md border bg-background p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <UserPen className="mr-2 h-8 w-8 rounded-md border p-1" />
                Authors
              </CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                Manage library author master data.
              </p>
            </div>
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              Add author
            </Button>
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
              <div className="max-h-[70vh] overflow-auto rounded-md border bg-background">
                <Table containerClassName="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Short name</TableHead>
                      <TableHead>Author type</TableHead>
                      <TableHead>Nationality</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-[90px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={row.id}>
                        <TableCell>{(page - 1) * limit + i + 1}</TableCell>
                        <TableCell className="font-semibold">{row.name}</TableCell>
                        <TableCell>{row.shortName ?? "—"}</TableCell>
                        <TableCell>{authorTypeName(row.authorTypeId)}</TableCell>
                        <TableCell>{nationalityName(row.nationalityId)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {parseDate(row.updatedAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <RowActions row={row} onEdit={openEdit} onDelete={setDeleteTarget} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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
            <DialogTitle>{editingId == null ? "Add author" : "Edit author"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
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
              <Label>Author type</Label>
              <Select
                value={form.authorTypeId || NONE}
                onValueChange={(v) => setForm((f) => ({ ...f, authorTypeId: v === NONE ? "" : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select author type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {authorTypes.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nationality</Label>
              <Select
                value={form.nationalityId || NONE}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, nationalityId: v === NONE ? "" : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {nationalities.map((n) => (
                    <SelectItem key={n.id} value={String(n.id)}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Remarks</Label>
              <Textarea
                value={form.remarks}
                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="border-t bg-muted/30 px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="ml-2 bg-purple-600 text-white shadow-none hover:bg-purple-700"
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
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete author?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete &quot;{deleteTarget?.name}&quot;. This cannot be undone.
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
