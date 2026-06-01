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
import { Edit, Loader2, Search, Tag, Trash2 } from "lucide-react";
import { LibraryMasterHeaderActions } from "@/pages/library/components/LibraryMasterHeaderActions";
import { downloadCsv, formatCsvDate } from "@/pages/library/utils/download-csv";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSocket } from "@/hooks/useSocket";
import type {
  LibraryAuthorTypeRow,
  LibraryAuthorTypeUpsertBody,
} from "@/services/library-author-types.service";
import {
  createLibraryAuthorType,
  deleteLibraryAuthorType,
  getLibraryAuthorTypeById,
  getLibraryAuthorTypes,
  updateLibraryAuthorType,
} from "@/services/library-author-types.service";

type LibraryAuthorTypeSocketUpdate = {
  id: string;
  type: "library_author_type_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  authorTypeId: number;
  authorTypeName: string;
  message: string;
  updatedAt: string;
};

type FormState = { name: string };

const emptyForm = (): FormState => ({ name: "" });

const detailToForm = (d: LibraryAuthorTypeRow): FormState => ({ name: d.name ?? "" });

const formToBody = (f: FormState): LibraryAuthorTypeUpsertBody => ({ name: f.name.trim() });

const parseDate = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

function RowActions({
  row,
  onEdit,
  onDelete,
}: {
  row: LibraryAuthorTypeRow;
  onEdit: (id: number) => void;
  onDelete: (row: LibraryAuthorTypeRow) => void;
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

export default function AuthorTypesMasterPage() {
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { socket, isConnected } = useSocket({ userId });

  const [rows, setRows] = useState<LibraryAuthorTypeRow[]>([]);
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

  const [deleteTarget, setDeleteTarget] = useState<LibraryAuthorTypeRow | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLibraryAuthorTypes({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      setRows(res.payload.rows);
      setTotal(res.payload.total);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load author types");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe_library_author_types");

    const handleUpdate = (data: LibraryAuthorTypeSocketUpdate) => {
      toast.info(data.message);
      void fetchRows();
    };

    socket.on("library_author_type_update", handleUpdate);

    return () => {
      socket.off("library_author_type_update", handleUpdate);
      socket.emit("unsubscribe_library_author_types");
    };
  }, [socket, isConnected, fetchRows]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = async (id: number) => {
    try {
      const res = await getLibraryAuthorTypeById(id);
      setEditingId(id);
      setForm(detailToForm(res.payload));
      setDialogOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load author type");
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
        await createLibraryAuthorType(body);
        toast.success("Author type created");
      } else {
        await updateLibraryAuthorType(editingId, body);
        toast.success("Author type updated");
      }
      setDialogOpen(false);
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Could not save author type");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteInProgress(true);
      await deleteLibraryAuthorType(deleteTarget.id);
      toast.success("Author type deleted");
      setDeleteTarget(null);
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    } finally {
      setDeleteInProgress(false);
    }
  };

  const handleDownload = () => {
    downloadCsv(
      "library-author-types.csv",
      ["#", "Name", "Updated At"],
      rows.map((row, i) => [
        String((page - 1) * limit + i + 1),
        row.name,
        formatCsvDate(row.updatedAt),
      ]),
    );
  };

  return (
    <div className="min-w-0 p-2 sm:p-4">
      <Card className="min-w-0 border-none">
        <CardHeader className="mb-3 rounded-md border bg-background p-3 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Tag className="mr-2 h-8 w-8 rounded-md border p-1" />
                Author Types
              </CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                Manage author type master data.
              </p>
            </div>
            <LibraryMasterHeaderActions onDownload={handleDownload} onAdd={openCreate} />
          </div>
        </CardHeader>

        <CardContent className="min-w-0 px-0">
          <div className="mb-3 border-b bg-background px-0 py-3 sm:px-0">
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

          <div className="relative min-w-0 px-0 sm:px-0" style={{ minHeight: "400px" }}>
            {loading ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading…
              </div>
            ) : rows.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                No author types found.
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-auto rounded-md border bg-background">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="bg-slate-100 w-10">#</TableHead>
                      <TableHead className="bg-slate-100">Name</TableHead>
                      <TableHead className="bg-slate-100">Updated</TableHead>
                      <TableHead className="bg-slate-100 w-[90px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={row.id}>
                        <TableCell>{(page - 1) * limit + i + 1}</TableCell>
                        <TableCell className="font-semibold">{row.name}</TableCell>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId == null ? "Add author type" : "Edit author type"}</DialogTitle>
          </DialogHeader>
          <div className="px-1 py-2">
            <Label>Name *</Label>
            <Input
              className="mt-1.5"
              value={form.name}
              onChange={(e) => setForm({ name: e.target.value })}
              placeholder="Enter author type name"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-purple-600 text-white hover:bg-purple-700"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
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
            <AlertDialogTitle>Delete author type?</AlertDialogTitle>
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
