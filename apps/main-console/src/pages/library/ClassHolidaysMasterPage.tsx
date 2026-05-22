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
import { CalendarRange, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type {
  LibraryClassHolidayRow,
  LibraryClassHolidayUpsertBody,
} from "@/services/library-class-holidays.service";
import {
  createLibraryClassHoliday,
  deleteLibraryClassHoliday,
  getLibraryClassHolidayById,
  getLibraryClassHolidays,
  updateLibraryClassHoliday,
} from "@/services/library-class-holidays.service";
import { getLibraryHolidays } from "@/services/library-holidays.service";

type FormState = {
  holidayId: string;
  programCourseId: string;
  classId: string;
  isHoliday: boolean;
};

const emptyForm = (): FormState => ({
  holidayId: "",
  programCourseId: "",
  classId: "",
  isHoliday: false,
});

const detailToForm = (d: LibraryClassHolidayRow): FormState => ({
  holidayId: String(d.holidayId),
  programCourseId: String(d.programCourseId),
  classId: String(d.classId),
  isHoliday: Boolean(d.isHoliday),
});

const formToBody = (f: FormState): LibraryClassHolidayUpsertBody => ({
  holidayId: Number(f.holidayId),
  programCourseId: Number(f.programCourseId),
  classId: Number(f.classId),
  isHoliday: f.isHoliday,
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
  row: LibraryClassHolidayRow;
  onEdit: (id: number) => void;
  onDelete: (row: LibraryClassHolidayRow) => void;
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

export default function ClassHolidaysMasterPage() {
  const [rows, setRows] = useState<LibraryClassHolidayRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [holidays, setHolidays] = useState<Array<{ id: number; name: string }>>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const [deleteTarget, setDeleteTarget] = useState<LibraryClassHolidayRow | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const holidayName = (id: number) => holidays.find((h) => h.id === id)?.name ?? `#${id}`;

  useEffect(() => {
    void (async () => {
      try {
        const res = await getLibraryHolidays({ page: 1, limit: 500 });
        setHolidays(res.payload.rows.map((r) => ({ id: r.id, name: r.name })));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLibraryClassHolidays({ page, limit });
      setRows(res.payload.rows);
      setTotal(res.payload.total);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load class holidays");
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
      const res = await getLibraryClassHolidayById(id);
      setEditingId(id);
      setForm(detailToForm(res.payload));
      setDialogOpen(true);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load class holiday");
    }
  };

  const handleSave = async () => {
    if (!form.holidayId || !form.programCourseId || !form.classId) {
      toast.error("Holiday, program course, and class are required");
      return;
    }
    try {
      setSaving(true);
      const body = formToBody(form);
      if (editingId == null) {
        await createLibraryClassHoliday(body);
        toast.success("Class holiday created");
      } else {
        await updateLibraryClassHoliday(editingId, body);
        toast.success("Class holiday updated");
      }
      setDialogOpen(false);
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Could not save class holiday");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteInProgress(true);
      await deleteLibraryClassHoliday(deleteTarget.id);
      toast.success("Class holiday deleted");
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
                <CalendarRange className="mr-2 h-8 w-8 rounded-md border p-1" />
                Class Holidays
              </CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                Map holidays to program courses and classes.
              </p>
            </div>
            <Button type="button" size="sm" onClick={openCreate}>
              <Plus className="mr-1 h-4 w-4" />
              Add class holiday
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
                No class holidays found.
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-auto rounded-md border bg-background">
                <Table containerClassName="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Holiday</TableHead>
                      <TableHead>Program course ID</TableHead>
                      <TableHead>Class ID</TableHead>
                      <TableHead>Is holiday</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="w-[90px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={row.id}>
                        <TableCell>{(page - 1) * limit + i + 1}</TableCell>
                        <TableCell className="font-medium">{holidayName(row.holidayId)}</TableCell>
                        <TableCell>{row.programCourseId}</TableCell>
                        <TableCell>{row.classId}</TableCell>
                        <TableCell>{row.isHoliday ? "Yes" : "No"}</TableCell>
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
              {editingId == null ? "Add class holiday" : "Edit class holiday"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 px-6 py-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Holiday *</Label>
              <Select
                value={form.holidayId}
                onValueChange={(v) => setForm((f) => ({ ...f, holidayId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select holiday" />
                </SelectTrigger>
                <SelectContent>
                  {holidays.map((h) => (
                    <SelectItem key={h.id} value={String(h.id)}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Program course ID *</Label>
              <Input
                type="number"
                min={1}
                value={form.programCourseId}
                onChange={(e) => setForm((f) => ({ ...f, programCourseId: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Class ID *</Label>
              <Input
                type="number"
                min={1}
                value={form.classId}
                onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Checkbox
                id="isHoliday"
                checked={form.isHoliday}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isHoliday: checked === true }))
                }
              />
              <Label htmlFor="isHoliday" className="cursor-pointer">
                Is holiday
              </Label>
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
            <AlertDialogTitle>Delete class holiday?</AlertDialogTitle>
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
