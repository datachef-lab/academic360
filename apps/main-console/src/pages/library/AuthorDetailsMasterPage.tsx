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
import { Edit, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { getBookList } from "@/services/books.service";
import type {
  LibraryAuthorDetailRow,
  LibraryAuthorDetailUpsertBody,
} from "@/services/library-author-details.service";
import {
  createLibraryAuthorDetail,
  deleteLibraryAuthorDetail,
  getLibraryAuthorDetailById,
  getLibraryAuthorDetails,
  updateLibraryAuthorDetail,
} from "@/services/library-author-details.service";
import { getLibraryAuthorTypes } from "@/services/library-author-types.service";
import { getLibraryAuthors } from "@/services/library-authors.service";

type FormState = {
  bookId: string;
  authorTypeId: string;
  authorId: string;
  remarks: string;
};

const emptyForm = (): FormState => ({
  bookId: "",
  authorTypeId: "",
  authorId: "",
  remarks: "",
});

const detailToForm = (d: LibraryAuthorDetailRow): FormState => ({
  bookId: String(d.bookId),
  authorTypeId: String(d.authorTypeId),
  authorId: String(d.authorId),
  remarks: d.remarks ?? "",
});

const formToBody = (f: FormState): LibraryAuthorDetailUpsertBody => ({
  bookId: Number(f.bookId),
  authorTypeId: Number(f.authorTypeId),
  authorId: Number(f.authorId),
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
  row: LibraryAuthorDetailRow;
  onEdit: (id: number) => void;
  onDelete: (row: LibraryAuthorDetailRow) => void;
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

export default function AuthorDetailsMasterPage() {
  const [rows, setRows] = useState<LibraryAuthorDetailRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [books, setBooks] = useState<Array<{ id: number; title: string }>>([]);
  const [authorTypes, setAuthorTypes] = useState<Array<{ id: number; name: string }>>([]);
  const [authors, setAuthors] = useState<Array<{ id: number; name: string }>>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const [deleteTarget, setDeleteTarget] = useState<LibraryAuthorDetailRow | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const bookTitle = (id: number) => books.find((b) => b.id === id)?.title ?? `#${id}`;
  const authorTypeName = (id: number) => authorTypes.find((t) => t.id === id)?.name ?? `#${id}`;
  const authorName = (id: number) => authors.find((a) => a.id === id)?.name ?? `#${id}`;

  useEffect(() => {
    void (async () => {
      try {
        const [booksRes, typesRes, authorsRes] = await Promise.all([
          getBookList({ page: 1, limit: 500 }),
          getLibraryAuthorTypes({ page: 1, limit: 500 }),
          getLibraryAuthors({ page: 1, limit: 500 }),
        ]);
        setBooks(booksRes.payload.rows.map((r) => ({ id: r.id, title: r.title })));
        setAuthorTypes(typesRes.payload.rows.map((r) => ({ id: r.id, name: r.name })));
        setAuthors(authorsRes.payload.rows.map((r) => ({ id: r.id, name: r.name })));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLibraryAuthorDetails({ page, limit });
      setRows(res.payload.rows);
      setTotal(res.payload.total);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load author details");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

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
      const res = await getLibraryAuthorDetailById(id);
      setEditingId(id);
      setForm(detailToForm(res.payload));
      setDialogOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load author detail");
    }
  };

  const handleSave = async () => {
    if (!form.bookId || !form.authorTypeId || !form.authorId) {
      toast.error("Book, author type, and author are required");
      return;
    }
    try {
      setSaving(true);
      const body = formToBody(form);
      if (editingId == null) {
        await createLibraryAuthorDetail(body);
        toast.success("Author detail created");
      } else {
        await updateLibraryAuthorDetail(editingId, body);
        toast.success("Author detail updated");
      }
      setDialogOpen(false);
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Could not save author detail");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteInProgress(true);
      await deleteLibraryAuthorDetail(deleteTarget.id);
      toast.success("Author detail deleted");
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
                <FileText className="mr-2 h-8 w-8 rounded-md border p-1" />
                Author Details
              </CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                Link books with authors and author types.
              </p>
            </div>
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              Add author detail
            </Button>
          </div>
        </CardHeader>

        <CardContent className="min-w-0 px-0">
          <div className="relative min-w-0 px-2 sm:px-4" style={{ minHeight: "400px" }}>
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading…
              </div>
            ) : rows.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                No author details found.
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-auto rounded-md border bg-background">
                <Table containerClassName="min-w-[960px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Book</TableHead>
                      <TableHead>Author type</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Remarks</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-[90px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={row.id}>
                        <TableCell>{(page - 1) * limit + i + 1}</TableCell>
                        <TableCell className="max-w-[240px] truncate font-medium">
                          {bookTitle(row.bookId)}
                        </TableCell>
                        <TableCell>{authorTypeName(row.authorTypeId)}</TableCell>
                        <TableCell>{authorName(row.authorId)}</TableCell>
                        <TableCell className="max-w-[180px] truncate">
                          {row.remarks ?? "—"}
                        </TableCell>
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
            <DialogTitle>
              {editingId == null ? "Add author detail" : "Edit author detail"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-4">
            <div className="space-y-1.5">
              <Label>Book *</Label>
              <Select
                value={form.bookId}
                onValueChange={(v) => setForm((f) => ({ ...f, bookId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select book" />
                </SelectTrigger>
                <SelectContent>
                  {books.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Author type *</Label>
              <Select
                value={form.authorTypeId}
                onValueChange={(v) => setForm((f) => ({ ...f, authorTypeId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select author type" />
                </SelectTrigger>
                <SelectContent>
                  {authorTypes.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Author *</Label>
              <Select
                value={form.authorId}
                onValueChange={(v) => setForm((f) => ({ ...f, authorId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select author" />
                </SelectTrigger>
                <SelectContent>
                  {authors.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
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
            <AlertDialogTitle>Delete author detail?</AlertDialogTitle>
            <AlertDialogDescription>
              This mapping will be permanently removed.
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
