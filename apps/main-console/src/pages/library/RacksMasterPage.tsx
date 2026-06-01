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
import { Edit, Loader2, Package2, Search, Trash2 } from "lucide-react";
import { LibraryMasterHeaderActions } from "@/pages/library/components/LibraryMasterHeaderActions";
import { downloadCsv, formatCsvDate } from "@/pages/library/utils/download-csv";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSocket } from "@/hooks/useSocket";
import type { LibraryRackRow, LibraryRackUpsertBody } from "@/services/library-racks.service";
import {
  createLibraryRack,
  deleteLibraryRack,
  getLibraryRackById,
  getLibraryRacks,
  updateLibraryRack,
} from "@/services/library-racks.service";

type LibraryRackSocketUpdate = {
  id: string;
  type: "library_rack_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  rackId: number;
  rackName: string;
  message: string;
  updatedAt: string;
};

type FormState = {
  name: string;
};

const emptyForm = (): FormState => ({ name: "" });

const detailToForm = (d: LibraryRackRow): FormState => ({ name: d.name ?? "" });

const formToBody = (f: FormState): LibraryRackUpsertBody => ({
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
  row: LibraryRackRow;
  onEdit: (_id: number) => void;
  onDelete: (_row: LibraryRackRow) => void;
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

export default function RacksMasterPage() {
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { socket, isConnected } = useSocket({ userId });

  const [rows, setRows] = useState<LibraryRackRow[]>([]);
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

  const [deleteTarget, setDeleteTarget] = useState<LibraryRackRow | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLibraryRacks({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      setRows(res.payload.rows);
      setTotal(res.payload.total);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load racks");
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe_library_racks");

    const handleUpdate = (data: LibraryRackSocketUpdate) => {
      toast.info(data.message);
      void fetchRows();
    };

    socket.on("library_rack_update", handleUpdate);

    return () => {
      socket.off("library_rack_update", handleUpdate);
      socket.emit("unsubscribe_library_racks");
    };
  }, [socket, isConnected, fetchRows]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = async (id: number) => {
    try {
      const res = await getLibraryRackById(id);
      setEditingId(id);
      setForm(detailToForm(res.payload));
      setDialogOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load rack");
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
        await createLibraryRack(body);
        toast.success("Rack created");
      } else {
        await updateLibraryRack(editingId, body);
        toast.success("Rack updated");
      }
      setDialogOpen(false);
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Could not save rack");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = (row: LibraryRackRow) => setDeleteTarget(row);
  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteInProgress(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteInProgress(true);
      await deleteLibraryRack(deleteTarget.id);
      toast.success("Rack deleted");
      closeDeleteDialog();
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
      "library-racks.csv",
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
                <Package2 className="mr-2 h-8 w-8 rounded-md border p-1" />
                Racks
              </CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                Manage rack master data.
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
                No racks found.
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-auto rounded-md border bg-background">
                <Table containerClassName="min-w-[720px]">
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
                          <RowActions row={row} onEdit={openEdit} onDelete={openDeleteDialog} />
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
            <DialogTitle>{editingId == null ? "Add rack" : "Edit rack"}</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4">
            <div className="space-y-1.5">
              <Label>Rack name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Enter rack name"
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
            <AlertDialogTitle>Delete rack?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 text-left text-sm text-muted-foreground">
                <p>
                  You are about to delete{" "}
                  <span className="font-medium text-foreground">
                    &quot;{deleteTarget?.name}&quot;
                  </span>
                  . This cannot be undone.
                </p>
                <p>Deletion may fail if this rack is linked to copy details.</p>
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
