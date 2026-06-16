import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Label } from "@/components/ui/label";
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
import { getProgramCourses } from "@/services/course-design.api";
import { getAllClasses } from "@/services/classes.service";

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
  isHoliday: true,
});

const detailToForm = (d: LibraryClassHolidayRow): FormState => ({
  holidayId: String(d.holidayId),
  programCourseId: String(d.programCourseId),
  classId: String(d.classId),
  isHoliday: d.isHoliday,
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
  onEdit: (_id: number) => void;
  onDelete: (_row: LibraryClassHolidayRow) => void;
}) {
  return (
    <div className="inline-flex shrink-0 items-center justify-end gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onEdit(row.id)}
        aria-label="Edit"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-red-600 hover:text-red-700"
        onClick={() => onDelete(row)}
        aria-label="Delete"
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

  const [filterHolidayId, setFilterHolidayId] = useState("");
  const [filterProgramCourseId, setFilterProgramCourseId] = useState("");
  const [filterClassId, setFilterClassId] = useState("");

  const [holidayOptions, setHolidayOptions] = useState<{ value: string; label: string }[]>([]);
  const [programCourseOptions, setProgramCourseOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [classOptions, setClassOptions] = useState<{ value: string; label: string }[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const [deleteTarget, setDeleteTarget] = useState<LibraryClassHolidayRow | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [holidays, programCourses, classes] = await Promise.all([
          getLibraryHolidays({ page: 1, limit: 500 }),
          getProgramCourses(),
          getAllClasses(),
        ]);
        setHolidayOptions(
          holidays.payload.rows.map((h) => ({
            value: String(h.id),
            label: `${h.name} (${parseDate(h.from)} → ${parseDate(h.to)})`,
          })),
        );
        setProgramCourseOptions(
          programCourses.map((pc) => ({
            value: String(pc.id),
            label: pc.name ?? `Program course #${pc.id}`,
          })),
        );
        setClassOptions(
          classes.map((c) => ({
            value: String(c.id),
            label: c.name,
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
      const res = await getLibraryClassHolidays({
        page,
        limit,
        ...(filterHolidayId ? { holidayId: Number(filterHolidayId) } : {}),
        ...(filterProgramCourseId ? { programCourseId: Number(filterProgramCourseId) } : {}),
        ...(filterClassId ? { classId: Number(filterClassId) } : {}),
      });
      setRows(res.payload.rows);
      setTotal(res.payload.total);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load class holidays");
    } finally {
      setLoading(false);
    }
  }, [page, limit, filterHolidayId, filterProgramCourseId, filterClassId]);

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

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteInProgress(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteInProgress(true);
      await deleteLibraryClassHoliday(deleteTarget.id);
      toast.success("Class holiday deleted");
      closeDeleteDialog();
      void fetchRows();
    } catch (e) {
      console.error(e);
      toast.error("Delete failed");
    } finally {
      setDeleteInProgress(false);
    }
  };

  const dialogTitle = useMemo(
    () => (editingId == null ? "Add class holiday" : "Edit class holiday"),
    [editingId],
  );

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
                Class- and program-specific holidays.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={openCreate}>
                <Plus className="mr-1 h-4 w-4" />
                Add class holiday
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="min-w-0 px-0">
          <div className="mb-3 grid grid-cols-1 gap-3 border-b bg-background px-2 py-3 sm:grid-cols-3 sm:px-4">
            <div className="space-y-1">
              <Label className="text-xs">Holiday</Label>
              <Combobox
                dataArr={[{ value: "", label: "All holidays" }, ...holidayOptions]}
                value={filterHolidayId}
                onChange={(v) => {
                  setPage(1);
                  setFilterHolidayId(v);
                }}
                placeholder="Filter by holiday"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Program course</Label>
              <Combobox
                dataArr={[{ value: "", label: "All program courses" }, ...programCourseOptions]}
                value={filterProgramCourseId}
                onChange={(v) => {
                  setPage(1);
                  setFilterProgramCourseId(v);
                }}
                placeholder="Filter by program course"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Class</Label>
              <Combobox
                dataArr={[{ value: "", label: "All classes" }, ...classOptions]}
                value={filterClassId}
                onChange={(v) => {
                  setPage(1);
                  setFilterClassId(v);
                }}
                placeholder="Filter by class"
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
                No class holidays found.
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
                        <RowActions row={row} onEdit={openEdit} onDelete={setDeleteTarget} />
                      </div>
                      <p className="font-semibold text-slate-900">{row.holidayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {parseDate(row.holidayFrom)} → {parseDate(row.holidayTo)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1 text-xs">
                        <span className="rounded-full bg-purple-50 px-2 py-0.5 text-purple-700">
                          {row.programCourseName ?? "—"}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                          {row.className}
                        </span>
                        <span
                          className={
                            row.isHoliday
                              ? "rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700"
                              : "rounded-full bg-amber-50 px-2 py-0.5 text-amber-700"
                          }
                        >
                          {row.isHoliday ? "Holiday" : "Working day"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden min-w-0 pb-2 lg:block">
                  <div className="max-h-[70vh] overflow-auto rounded-md border bg-background">
                    <Table containerClassName="min-w-[1000px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">#</TableHead>
                          <TableHead className="min-w-[220px]">Holiday</TableHead>
                          <TableHead className="min-w-[200px]">Range</TableHead>
                          <TableHead className="min-w-[220px]">Program course</TableHead>
                          <TableHead className="min-w-[140px]">Class</TableHead>
                          <TableHead className="min-w-[120px]">Status</TableHead>
                          <TableHead className="w-[90px] text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row, i) => (
                          <TableRow key={row.id}>
                            <TableCell className="align-top whitespace-nowrap">
                              {(page - 1) * limit + i + 1}
                            </TableCell>
                            <TableCell className="align-top font-semibold text-slate-900">
                              {row.holidayName}
                            </TableCell>
                            <TableCell className="align-top text-sm whitespace-nowrap">
                              {parseDate(row.holidayFrom)} → {parseDate(row.holidayTo)}
                            </TableCell>
                            <TableCell className="align-top text-sm">
                              {row.programCourseName ?? "—"}
                            </TableCell>
                            <TableCell className="align-top text-sm">{row.className}</TableCell>
                            <TableCell className="align-top text-sm">
                              <span
                                className={
                                  row.isHoliday
                                    ? "rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700"
                                    : "rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                                }
                              >
                                {row.isHoliday ? "Holiday" : "Working day"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right align-top">
                              <RowActions row={row} onEdit={openEdit} onDelete={setDeleteTarget} />
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
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4">
            <div className="space-y-1.5">
              <Label>Holiday *</Label>
              <Combobox
                dataArr={holidayOptions}
                value={form.holidayId}
                onChange={(v) => setForm((f) => ({ ...f, holidayId: v }))}
                placeholder="Select holiday"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Program course *</Label>
              <Combobox
                dataArr={programCourseOptions}
                value={form.programCourseId}
                onChange={(v) => setForm((f) => ({ ...f, programCourseId: v }))}
                placeholder="Select program course"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Class *</Label>
              <Combobox
                dataArr={classOptions}
                value={form.classId}
                onChange={(v) => setForm((f) => ({ ...f, classId: v }))}
                placeholder="Select class"
              />
            </div>
            <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
              <Checkbox
                id="isHoliday"
                checked={form.isHoliday}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isHoliday: Boolean(checked) }))
                }
              />
              <Label htmlFor="isHoliday" className="cursor-pointer">
                Treat this date range as a holiday for the selected class
              </Label>
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
            <AlertDialogTitle>Delete class holiday?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 text-left text-sm text-muted-foreground">
                <p>This cannot be undone.</p>
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
