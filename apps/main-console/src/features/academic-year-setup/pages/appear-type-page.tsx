import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  getPromotionStatuses,
  createPromotionStatusApi,
  updatePromotionStatusApi,
  deletePromotionStatusApi,
} from "@/services/promotion-status.api";
import type { PromotionStatusT } from "@repo/db";

const APPEAR_TYPES = ["REGULAR", "READMISSION", "CASUAL"] as const;

type FormData = {
  name: string;
  type: (typeof APPEAR_TYPES)[number];
  isActive: boolean;
};

const emptyForm: FormData = { name: "", type: "REGULAR", isActive: true };

export default function AppearTypePage() {
  const [searchText, setSearchText] = React.useState("");
  const [rows, setRows] = React.useState<PromotionStatusT[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingRow, setEditingRow] = React.useState<PromotionStatusT | null>(null);
  const [form, setForm] = React.useState<FormData>(emptyForm);
  const [saving, setSaving] = React.useState(false);

  const [deleteTarget, setDeleteTarget] = React.useState<PromotionStatusT | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const fetchRows = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPromotionStatuses();
      setRows(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load appear types";
      toast.error(msg);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const filtered = React.useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = r.name?.toLowerCase() ?? "";
      const type = r.type?.toLowerCase() ?? "";
      const idStr = String(r.id ?? "");
      return name.includes(q) || type.includes(q) || idStr.includes(q);
    });
  }, [rows, searchText]);

  function openAddDialog() {
    setEditingRow(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(row: PromotionStatusT) {
    setEditingRow(row);
    setForm({
      name: row.name ?? "",
      type: (row.type as FormData["type"]) ?? "REGULAR",
      isActive: row.isActive ?? true,
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      if (editingRow) {
        await updatePromotionStatusApi(editingRow.id!, {
          name: form.name.trim(),
          type: form.type,
          isActive: form.isActive,
        });
        toast.success("Appear type updated");
      } else {
        await createPromotionStatusApi({
          name: form.name.trim(),
          type: form.type,
          isActive: form.isActive,
        });
        toast.success("Appear type created");
      }
      setDialogOpen(false);
      await fetchRows();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await deletePromotionStatusApi(deleteTarget.id);
      toast.success("Appear type deleted");
      setDeleteTarget(null);
      await fetchRows();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto min-h-full min-w-0 max-w-full overflow-x-hidden p-3 sm:p-5 md:max-w-[1600px] md:p-6">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-col gap-3 space-y-0 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 sm:text-xl">
              Appear Types
            </CardTitle>
            <p className="mt-1 text-sm leading-snug text-gray-600">
              Manage promotion status / appear types (Regular, Readmission, Casual, etc.)
            </p>
          </div>
          <div className="flex w-full shrink-0 items-center sm:w-auto">
            <Button
              size="sm"
              className="w-full bg-purple-600 hover:bg-purple-700 sm:w-auto"
              type="button"
              onClick={openAddDialog}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Search by name, type, or id…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full sm:max-w-md"
            />
          </div>

          {loading ? (
            <div className="rounded-md border border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-md border border-gray-200 px-4 py-10 text-center text-sm text-gray-500">
              No appear types yet.
            </div>
          ) : (
            <>
              {/* Mobile card list */}
              <div className="divide-y divide-gray-200 overflow-hidden rounded-md border border-gray-200 md:hidden">
                {filtered.map((r, i) => (
                  <div key={r.id ?? i} className="space-y-3 p-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold leading-snug text-gray-900">
                          {r.name ?? "—"}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-purple-200 bg-purple-50/60 text-xs font-normal text-purple-800"
                          >
                            {r.type}
                          </Badge>
                          {r.isActive ? (
                            <Badge className="bg-green-500 text-xs text-white hover:bg-green-600">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="h-9 flex-1"
                        onClick={() => openEditDialog(r)}
                      >
                        <Edit className="mr-1.5 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="h-9 flex-1 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(r)}
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden overflow-x-auto rounded-md border border-gray-200 md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="w-28 text-center">Status</TableHead>
                      <TableHead className="w-28 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r, i) => (
                      <TableRow key={r.id ?? i} className="hover:bg-gray-50/80">
                        <TableCell className="py-3 text-center align-top text-gray-600">
                          {i + 1}
                        </TableCell>
                        <TableCell className="max-w-[200px] py-3 align-top font-medium">
                          <span className="text-sm leading-snug">{r.name ?? "—"}</span>
                        </TableCell>
                        <TableCell className="py-3 align-top">
                          <Badge
                            variant="outline"
                            className="border-purple-200 bg-purple-50/60 text-xs font-normal text-purple-800"
                          >
                            {r.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 text-center align-top">
                          {r.isActive ? (
                            <Badge className="bg-green-500 text-xs text-white hover:bg-green-600">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 text-right align-top">
                          <div className="inline-flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              className="h-8 w-8 p-0"
                              aria-label="Edit appear type"
                              onClick={() => openEditDialog(r)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              aria-label="Delete appear type"
                              onClick={() => setDeleteTarget(r)}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="flex max-h-[min(92dvh,92vh)] w-[calc(100vw-1rem)] max-w-md flex-col gap-0 overflow-hidden p-0 sm:w-full">
          <DialogHeader className="shrink-0 border-b px-4 py-4 sm:px-6">
            <DialogTitle>{editingRow ? "Edit Appear Type" : "Add Appear Type"}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="space-y-2">
              <Label htmlFor="appear-name">Name</Label>
              <Input
                id="appear-name"
                placeholder="e.g. Regular, Ex-Student…"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appear-type">Type</Label>
              <Select
                value={form.type}
                onValueChange={(val) => setForm((f) => ({ ...f, type: val as FormData["type"] }))}
              >
                <SelectTrigger id="appear-type" className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {APPEAR_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="appear-active"
                checked={form.isActive}
                onCheckedChange={(val) => setForm((f) => ({ ...f, isActive: val }))}
              />
              <Label htmlFor="appear-active">Active</Label>
            </div>
          </div>
          <DialogFooter className="shrink-0 flex-col-reverse gap-2 border-t px-4 py-4 sm:flex-row sm:px-6">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 sm:w-auto"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : editingRow ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="w-[calc(100vw-1rem)] max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appear Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto" disabled={deleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
