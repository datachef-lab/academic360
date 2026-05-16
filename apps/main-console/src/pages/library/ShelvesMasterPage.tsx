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
import { LibraryBig, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSocket } from "@/hooks/useSocket";
import type { LibraryShelfRow, LibraryShelfUpsertBody } from "@/services/library-shelves.service";
import {
  createLibraryShelf,
  deleteLibraryShelf,
  getLibraryShelfById,
  getLibraryShelves,
  updateLibraryShelf,
} from "@/services/library-shelves.service";

type LibraryShelfSocketUpdate = {
  id: string;
  type: "library_shelf_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  shelfId: number;
  shelfName: string;
  message: string;
  updatedAt: string;
};

type FormState = {
  name: string;
};

const emptyForm = (): FormState => ({ name: "" });

const detailToForm = (d: LibraryShelfRow): FormState => ({ name: d.name ?? "" });

const formToBody = (f: FormState): LibraryShelfUpsertBody => ({
  name: f.name.trim(),
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
  row: LibraryShelfRow;
  onEdit: (id: number) => void;
  onDelete: (row: LibraryShelfRow) => void;
}) {
  return (
    <div className="inline-flex shrink-0 items-center justify-end gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEdit(row.id)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-600 hover:text-red-700"
        onClick={() => onDelete(row)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function ShelvesMasterPage() {
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { socket, isConnected } = useSocket({ userId });

  const [rows, setRows] = useState<LibraryShelfRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const [deleteTarget, setDeleteTarget] = useState<LibraryShelfRow | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLibraryShelves({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      setRows(res.payload.rows);
      setTotal(res.payload.total);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load shelves");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe_library_shelves");

    const handleUpdate = (data: LibraryShelfSocketUpdate) => {
      toast.info(data.message);
      void fetchRows();
    };

    socket.on("library_shelf_update", handleUpdate);

    return () => {
      socket.off("library_shelf_update", handleUpdate);
      socket.emit("unsubscribe_library_shelves");
    };
  }, [socket, isConnected, fetchRows]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = async (id: number) => {
    try {
      const res = await getLibraryShelfById(id);
      setEditingId(id);
      setForm(detailToForm(res.payload));
      setDialogOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load shelf");
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
        await createLibraryShelf(body);
        toast.success("Shelf created");
      } else {
        await updateLibraryShelf(editingId, body);
        toast.success("Shelf updated");
      }
      setDialogOpen(false);
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Could not save shelf");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (row: LibraryShelfRow) => setDeleteTarget(row);
  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteInProgress(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteInProgress(true);
      await deleteLibraryShelf(deleteTarget.id);
      toast.success("Shelf deleted");
      closeDeleteDialog();
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
                <LibraryBig className="mr-2 h-8 w-8 rounded-md border p-1" />
                Shelves
              </CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                Manage shelf master data.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus className="mr-1 h-4 w-4" />
                Add shelf
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
                No shelves found.
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
                        <RowActions row={row} onEdit={openEdit} onDelete={openDeleteDialog} />
                      </div>

                      <div className="space-y-1">
                        <p className="font-semibold text-slate-900 underline underline-offset-2">
                          {row.name}
                        </p>
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground">
                        Updated: {parseDate(row.updatedAt)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden min-w-0 pb-2 lg:block">
                  <div className="max-h-[70vh] overflow-auto rounded-md border bg-background">
                    <Table containerClassName="min-w-[720px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead className="min-w-[360px]">Name</TableHead>
                          <TableHead className="min-w-[140px]">Updated</TableHead>
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
                              <div className="font-semibold text-slate-900 underline underline-offset-2">
                                {row.name}
                              </div>
                            </TableCell>
                            <TableCell className="align-top text-xs text-muted-foreground">
                              {parseDate(row.updatedAt)}
                            </TableCell>
                            <TableCell className="text-right align-top">
                              <RowActions row={row} onEdit={openEdit} onDelete={openDeleteDialog} />
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
            <DialogTitle>{editingId == null ? "Add shelf" : "Edit shelf"}</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4">
            <div className="space-y-1.5">
              <Label>Shelf name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Enter shelf name"
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
            <AlertDialogTitle>Delete shelf?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 text-left text-sm text-muted-foreground">
                <p>
                  You are about to delete{" "}
                  <span className="font-medium text-foreground">
                    &quot;{deleteTarget?.name}&quot;
                  </span>
                  . This cannot be undone.
                </p>
                <p>Deletion may fail if this shelf is linked to copy details.</p>
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
