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
import { Checkbox } from "@/components/ui/checkbox";
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
import { BookMarked, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type {
  LibraryItemCategoryRow,
  LibraryItemCategoryUpsertBody,
} from "@/services/library-item-categories.service";
import {
  createLibraryItemCategory,
  deleteLibraryItemCategory,
  getLibraryItemCategoryById,
  getLibraryItemCategories,
  updateLibraryItemCategory,
} from "@/services/library-item-categories.service";
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
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  code: "",
  description: "",
  isActive: true,
});

const detailToForm = (d: LibraryItemCategoryRow): FormState => ({
  name: d.name ?? "",
  code: d.code ?? "",
  description: d.description ?? "",
  isActive: d.isActive,
});

const formToBody = (f: FormState): LibraryItemCategoryUpsertBody => ({
  name: f.name.trim(),
  code: f.code.trim() || null,
  description: f.description.trim() || null,
  isActive: f.isActive,
});

const parseDate = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

export default function ItemCategoriesMasterPage() {
  const [rows, setRows] = useState<LibraryItemCategoryRow[]>([]);
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

  const [deleteTarget, setDeleteTarget] = useState<LibraryItemCategoryRow | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => window.clearTimeout(id);
  }, [searchInput]);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLibraryItemCategories({
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      setRows(res.payload.rows);
      setTotal(res.payload.total);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load item categories");
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
      const res = await getLibraryItemCategoryById(id);
      setEditingId(id);
      setForm(detailToForm(res.payload));
      setDialogOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load item category");
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
        await createLibraryItemCategory(body);
        toast.success("Item category created");
      } else {
        await updateLibraryItemCategory(editingId, body);
        toast.success("Item category updated");
      }
      setDialogOpen(false);
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Could not save item category");
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
      await deleteLibraryItemCategory(deleteTarget.id);
      toast.success("Item category deleted");
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
                <BookMarked className="mr-2 h-8 w-8 rounded-md border p-1" />
                Item Categories
              </CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                Categorise library items (Reference, Textbook, Reserve…) for the circulation policy
                grid.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus className="mr-1 h-4 w-4" />
                Add item category
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
                placeholder="Search by name or code..."
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
                No item categories found.
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
                        <div className="inline-flex shrink-0 items-center gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEdit(row.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="font-semibold text-slate-900">{row.name}</p>
                      {row.code && (
                        <p className="text-xs text-muted-foreground">Code: {row.code}</p>
                      )}
                      {row.description && (
                        <p className="mt-2 text-xs text-slate-700">{row.description}</p>
                      )}
                      <span
                        className={
                          row.isActive
                            ? "mt-2 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                            : "mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                        }
                      >
                        {row.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="hidden min-w-0 pb-2 lg:block">
                  <div className="max-h-[70vh] overflow-auto rounded-md border bg-background">
                    <Table containerClassName="min-w-[820px]">
                      <TableHeader className={STICKY_THEAD_CLASS}>
                        <TableRow>
                          <TableHead className={cn(STICKY_TH_LEFT, "w-10")}>#</TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[220px]")}>
                            Name
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[120px]")}>
                            Code
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[300px]")}>
                            Description
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "w-[110px]")}>Status</TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "w-[110px]")}>Updated</TableHead>
                          <TableHead className={cn(STICKY_TH_RIGHT, "w-[90px] text-right")}>
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row, i) => (
                          <TableRow key={row.id}>
                            <TableCell className="align-top whitespace-nowrap">
                              {(page - 1) * limit + i + 1}
                            </TableCell>
                            <TableCell className="align-top font-semibold text-slate-900">
                              {row.name}
                            </TableCell>
                            <TableCell className="align-top text-sm">{row.code ?? "—"}</TableCell>
                            <TableCell className="align-top text-sm">
                              {row.description ?? "—"}
                            </TableCell>
                            <TableCell className="align-top">
                              <span
                                className={
                                  row.isActive
                                    ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                                    : "rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                                }
                              >
                                {row.isActive ? "Active" : "Inactive"}
                              </span>
                            </TableCell>
                            <TableCell className="align-top text-xs text-muted-foreground">
                              {parseDate(row.updatedAt)}
                            </TableCell>
                            <TableCell className="text-right align-top">
                              <div className="inline-flex items-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => openEdit(row.id)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700"
                                  onClick={() => setDeleteTarget(row)}
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
        <DialogContent className="max-h-[92vh] w-[min(96vw,640px)] overflow-y-auto sm:max-w-[640px]">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>
              {editingId == null ? "Add item category" : "Edit item category"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Reference, Textbook, Reserve"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox
                id="item-active"
                checked={form.isActive}
                onCheckedChange={(c) => setForm((f) => ({ ...f, isActive: c === true }))}
              />
              <Label htmlFor="item-active" className="text-sm font-normal">
                Active
              </Label>
            </div>
          </div>
          <DialogFooter className="border-t bg-muted/30 px-6 py-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
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
            <AlertDialogTitle>Delete item category?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 text-left text-sm text-muted-foreground">
                <p>
                  You are about to delete{" "}
                  <span className="font-medium text-foreground">
                    &quot;{deleteTarget?.name}&quot;
                  </span>
                  .
                </p>
                <p>Deletion will fail if any circulation policy references it.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteInProgress}>Cancel</AlertDialogCancel>
            <Button
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
