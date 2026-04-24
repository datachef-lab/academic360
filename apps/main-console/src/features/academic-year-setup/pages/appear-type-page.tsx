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
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-900">Appear Types</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Manage promotion status / appear types (Regular, Readmission, Casual, etc.)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
              type="button"
              onClick={openAddDialog}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <Input
              placeholder="Search by name, type, or id…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-md"
            />
          </div>

          <div className="rounded-md border border-gray-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center w-28">Status</TableHead>
                  <TableHead className="text-right w-28">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                      No appear types yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r, i) => (
                    <TableRow key={r.id ?? i} className="hover:bg-gray-50/80">
                      <TableCell className="text-center text-gray-600 align-top py-3">
                        {i + 1}
                      </TableCell>
                      <TableCell className="font-medium align-top py-3 max-w-[200px]">
                        <span className="text-sm leading-snug">{r.name ?? "—"}</span>
                      </TableCell>
                      <TableCell className="align-top py-3">
                        <Badge
                          variant="outline"
                          className="text-xs font-normal border-purple-200 text-purple-800 bg-purple-50/60"
                        >
                          {r.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center align-top py-3">
                        {r.isActive ? (
                          <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right align-top py-3">
                        <div className="inline-flex gap-1 justify-end">
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
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit Appear Type" : "Add Appear Type"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
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
                <SelectTrigger id="appear-type">
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appear Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
