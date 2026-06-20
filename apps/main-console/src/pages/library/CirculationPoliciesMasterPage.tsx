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
import { Loader2, Pencil, Plus, Scale, Trash2 } from "lucide-react";
import type {
  LibraryCirculationPolicyRow,
  LibraryCirculationPolicyUpsertBody,
} from "@/services/library-circulation-policies.service";
import {
  createLibraryCirculationPolicy,
  deleteLibraryCirculationPolicy,
  getLibraryCirculationPolicies,
  getLibraryCirculationPolicyById,
  updateLibraryCirculationPolicy,
} from "@/services/library-circulation-policies.service";
import { getLibraryPatronCategories } from "@/services/library-patron-categories.service";
import { getLibraryItemCategories } from "@/services/library-item-categories.service";
import {
  STICKY_THEAD_CLASS,
  STICKY_TH_BASE,
  STICKY_TH_LEFT,
  STICKY_TH_RIGHT,
} from "@/components/library/LibraryTablePage";
import { cn } from "@/lib/utils";

type FormState = {
  patronCategoryId: string;
  itemCategoryId: string;
  loanDays: string;
  finePerDay: string;
  renewalLimit: string;
  graceDays: string;
  maxCopiesAtOnce: string;
  skipHolidaysInFine: boolean;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  patronCategoryId: "",
  itemCategoryId: "",
  loanDays: "7",
  finePerDay: "0",
  renewalLimit: "0",
  graceDays: "0",
  maxCopiesAtOnce: "1",
  skipHolidaysInFine: true,
  isActive: true,
});

const detailToForm = (d: LibraryCirculationPolicyRow): FormState => ({
  patronCategoryId: String(d.patronCategoryId),
  itemCategoryId: String(d.itemCategoryId),
  loanDays: String(d.loanDays),
  finePerDay: String(d.finePerDay),
  renewalLimit: String(d.renewalLimit),
  graceDays: String(d.graceDays),
  maxCopiesAtOnce: String(d.maxCopiesAtOnce),
  skipHolidaysInFine: d.skipHolidaysInFine,
  isActive: d.isActive,
});

const formToBody = (f: FormState): LibraryCirculationPolicyUpsertBody => ({
  patronCategoryId: Number(f.patronCategoryId),
  itemCategoryId: Number(f.itemCategoryId),
  loanDays: Number(f.loanDays),
  finePerDay: Number(f.finePerDay),
  renewalLimit: Number(f.renewalLimit),
  graceDays: Number(f.graceDays),
  maxCopiesAtOnce: Number(f.maxCopiesAtOnce),
  skipHolidaysInFine: f.skipHolidaysInFine,
  isActive: f.isActive,
});

export default function CirculationPoliciesMasterPage() {
  const [rows, setRows] = useState<LibraryCirculationPolicyRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [filterPatron, setFilterPatron] = useState("");
  const [filterItem, setFilterItem] = useState("");

  const [patronOptions, setPatronOptions] = useState<{ value: string; label: string }[]>([]);
  const [itemOptions, setItemOptions] = useState<{ value: string; label: string }[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const [deleteTarget, setDeleteTarget] = useState<LibraryCirculationPolicyRow | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [patrons, items] = await Promise.all([
          getLibraryPatronCategories({ page: 1, limit: 500 }),
          getLibraryItemCategories({ page: 1, limit: 500 }),
        ]);
        setPatronOptions(
          patrons.payload.rows.map((r) => ({
            value: String(r.id),
            label: r.name,
          })),
        );
        setItemOptions(
          items.payload.rows.map((r) => ({
            value: String(r.id),
            label: r.name,
          })),
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLibraryCirculationPolicies({
        page,
        limit,
        ...(filterPatron ? { patronCategoryId: Number(filterPatron) } : {}),
        ...(filterItem ? { itemCategoryId: Number(filterItem) } : {}),
      });
      setRows(res.payload.rows);
      setTotal(res.payload.total);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load policies");
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterPatron, filterItem]);

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
      const res = await getLibraryCirculationPolicyById(id);
      setEditingId(id);
      setForm(detailToForm(res.payload));
      setDialogOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load policy");
    }
  };

  const handleSave = async () => {
    if (!form.patronCategoryId || !form.itemCategoryId) {
      toast.error("Patron category and item category are required");
      return;
    }
    try {
      setSaving(true);
      const body = formToBody(form);
      if (editingId == null) {
        await createLibraryCirculationPolicy(body);
        toast.success("Policy created");
      } else {
        await updateLibraryCirculationPolicy(editingId, body);
        toast.success("Policy updated");
      }
      setDialogOpen(false);
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Could not save policy");
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
      await deleteLibraryCirculationPolicy(deleteTarget.id);
      toast.success("Policy deleted");
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
                <Scale className="mr-2 h-8 w-8 rounded-md border p-1" />
                Circulation Policies
              </CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                Loan rules per patron × item category. The fine engine consults this grid when
                computing dues.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus className="mr-1 h-4 w-4" />
                Add policy
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-w-0 px-0">
          <div className="mb-3 grid grid-cols-1 gap-3 border-b bg-background px-2 py-3 sm:grid-cols-2 sm:px-4">
            <div className="space-y-1">
              <Label className="text-xs">Patron category</Label>
              <Combobox
                dataArr={[{ value: "", label: "All patron categories" }, ...patronOptions]}
                value={filterPatron}
                onChange={(v) => {
                  setPage(1);
                  setFilterPatron(v);
                }}
                placeholder="Filter by patron"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Item category</Label>
              <Combobox
                dataArr={[{ value: "", label: "All item categories" }, ...itemOptions]}
                value={filterItem}
                onChange={(v) => {
                  setPage(1);
                  setFilterItem(v);
                }}
                placeholder="Filter by item"
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
                No policies found.
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
                      <p className="font-semibold text-slate-900">
                        {row.patronCategoryName} × {row.itemCategoryName}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <span>Loan: {row.loanDays}d</span>
                        <span>Fine: ₹{row.finePerDay}/d</span>
                        <span>Renewals: {row.renewalLimit}</span>
                        <span>Grace: {row.graceDays}d</span>
                        <span>Max copies: {row.maxCopiesAtOnce}</span>
                        <span>Skip holidays: {row.skipHolidaysInFine ? "Yes" : "No"}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden min-w-0 pb-2 lg:block">
                  <div className="max-h-[70vh] overflow-auto rounded-md border bg-background">
                    <Table containerClassName="min-w-[1100px]">
                      <TableHeader className={STICKY_THEAD_CLASS}>
                        <TableRow>
                          <TableHead className={cn(STICKY_TH_LEFT, "w-10")}>#</TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[180px]")}>
                            Patron
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "min-w-[180px]")}>
                            Item
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "w-[90px] text-right")}>
                            Loan days
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "w-[110px] text-right")}>
                            Fine / day
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "w-[100px] text-right")}>
                            Renewals
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "w-[90px] text-right")}>
                            Grace
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "w-[110px] text-right")}>
                            Max copies
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "w-[120px]")}>
                            Skip holidays
                          </TableHead>
                          <TableHead className={cn(STICKY_TH_BASE, "w-[110px]")}>Status</TableHead>
                          <TableHead className={cn(STICKY_TH_RIGHT, "w-[90px] text-right")}>
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row, i) => (
                          <TableRow key={row.id}>
                            <TableCell className="align-top">
                              {(page - 1) * limit + i + 1}
                            </TableCell>
                            <TableCell className="align-top font-semibold">
                              {row.patronCategoryName}
                            </TableCell>
                            <TableCell className="align-top">{row.itemCategoryName}</TableCell>
                            <TableCell className="align-top text-right">{row.loanDays}</TableCell>
                            <TableCell className="align-top text-right">
                              ₹{row.finePerDay}
                            </TableCell>
                            <TableCell className="align-top text-right">
                              {row.renewalLimit}
                            </TableCell>
                            <TableCell className="align-top text-right">{row.graceDays}</TableCell>
                            <TableCell className="align-top text-right">
                              {row.maxCopiesAtOnce}
                            </TableCell>
                            <TableCell className="align-top">
                              {row.skipHolidaysInFine ? "Yes" : "No"}
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
        <DialogContent className="max-h-[92vh] w-[min(96vw,820px)] overflow-y-auto sm:max-w-[820px]">
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{editingId == null ? "Add policy" : "Edit policy"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 px-6 py-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Patron category *</Label>
              <Combobox
                dataArr={patronOptions}
                value={form.patronCategoryId}
                onChange={(v) => setForm((f) => ({ ...f, patronCategoryId: v }))}
                placeholder="Select patron category"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Item category *</Label>
              <Combobox
                dataArr={itemOptions}
                value={form.itemCategoryId}
                onChange={(v) => setForm((f) => ({ ...f, itemCategoryId: v }))}
                placeholder="Select item category"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Loan days</Label>
              <Input
                type="number"
                min={0}
                value={form.loanDays}
                onChange={(e) => setForm((f) => ({ ...f, loanDays: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fine per day (₹)</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={form.finePerDay}
                onChange={(e) => setForm((f) => ({ ...f, finePerDay: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Renewal limit</Label>
              <Input
                type="number"
                min={0}
                value={form.renewalLimit}
                onChange={(e) => setForm((f) => ({ ...f, renewalLimit: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Grace days</Label>
              <Input
                type="number"
                min={0}
                value={form.graceDays}
                onChange={(e) => setForm((f) => ({ ...f, graceDays: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Max copies at once</Label>
              <Input
                type="number"
                min={1}
                value={form.maxCopiesAtOnce}
                onChange={(e) => setForm((f) => ({ ...f, maxCopiesAtOnce: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 flex items-end gap-2 sm:col-span-2">
              <Checkbox
                id="skip-holidays"
                checked={form.skipHolidaysInFine}
                onCheckedChange={(c) => setForm((f) => ({ ...f, skipHolidaysInFine: c === true }))}
              />
              <Label htmlFor="skip-holidays" className="text-sm font-normal">
                Skip library + class holidays when computing fine days
              </Label>
            </div>
            <div className="space-y-1.5 flex items-end gap-2 sm:col-span-2">
              <Checkbox
                id="policy-active"
                checked={form.isActive}
                onCheckedChange={(c) => setForm((f) => ({ ...f, isActive: c === true }))}
              />
              <Label htmlFor="policy-active" className="text-sm font-normal">
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
            <AlertDialogTitle>Delete policy?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 text-left text-sm text-muted-foreground">
                <p>
                  Delete policy for{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget?.patronCategoryName} × {deleteTarget?.itemCategoryName}
                  </span>
                  ?
                </p>
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
