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
// import { Checkbox } from "@/components/ui/checkbox";
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
import { CalendarRange, Edit, Loader2, Trash2 } from "lucide-react";
import { LibraryMasterHeaderActions } from "@/pages/library/components/LibraryMasterHeaderActions";
import { downloadCsv } from "@/pages/library/utils/download-csv";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSocket } from "@/hooks/useSocket";
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
import { findAllClasses } from "@/services/class.service";

type LibraryClassHolidaySocketUpdate = {
  id: string;
  type: "library_class_holiday_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  classHolidayId: number;
  classHolidayName: string;
  message: string;
  updatedAt: string;
};

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

// const parseDate = (value: string) => {
//   const d = new Date(value);
//   return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
// };

// eslint-disable @typescript-eslint/no-unused-vars
function RowActions({
  row,
  onEdit,
  onDelete,
}: {
  row: LibraryClassHolidayRow;
  onEdit: (id: number) => void; // eslint-disable-line
  onDelete: (row: LibraryClassHolidayRow) => void; // eslint-disable-line
}) {
  // eslint-enable @typescript-eslint/no-unused-vars
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

export default function ClassHolidaysMasterPage() {
  const { user } = useAuth();
  const userId = user?.id?.toString();
  const { socket, isConnected } = useSocket({ userId });

  const [rows, setRows] = useState<LibraryClassHolidayRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const [holidays, setHolidays] = useState<
    Array<{ id: number; name: string; from: string; to: string }>
  >([]);
  const [programCourses, setProgramCourses] = useState<Array<{ id: number; name: string }>>([]);
  const [classes, setClasses] = useState<Array<{ id: number; name: string }>>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());

  const [deleteTarget, setDeleteTarget] = useState<LibraryClassHolidayRow | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const holidayName = (id: number) => {
    const holiday = holidays.find((h) => h.id === id);
    if (!holiday) return `Holiday #${id}`;
    const fromDate = new Date(holiday.from).toLocaleDateString();
    const toDate = new Date(holiday.to).toLocaleDateString();
    const dateDisplay = fromDate === toDate ? fromDate : `${fromDate} - ${toDate}`;
    return `${holiday.name} (${dateDisplay})`;
  };

  const programCourseName = (id: number) => {
    const pc = programCourses.find((p) => p.id === id);
    return pc?.name ?? `Course #${id}`;
  };

  const className = (id: number) => {
    const c = classes.find((cl) => cl.id === id);
    return c?.name ?? `Class #${id}`;
  };

  useEffect(() => {
    void (async () => {
      try {
        const res = await getLibraryHolidays();
        console.log("***holidays", JSON.stringify(res.payload.rows, null, 2));
        setHolidays(
          res.payload.rows.map((r) => ({ id: r.id, name: r.name, from: r.from, to: r.to })),
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const courses = await getProgramCourses();
        setProgramCourses(
          courses.map((c) => ({
            id: c.id,
            name: c.name || "Unnamed Course",
          })) as Array<{ id: number; name: string }>,
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await findAllClasses();
        setClasses(
          res.payload.map((cl) => ({
            id: cl.id || 0,
            name: cl.name,
          })) as Array<{ id: number; name: string }>,
        );
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
      // console.log(JSON.stringify(res.payload.rows, null, 2));
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

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit("subscribe_library_class_holidays");

    const handleUpdate = (data: LibraryClassHolidaySocketUpdate) => {
      toast.info(data.message);
      void fetchRows();
    };

    socket.on("library_class_holiday_update", handleUpdate);

    return () => {
      socket.off("library_class_holiday_update", handleUpdate);
      socket.emit("unsubscribe_library_class_holidays");
    };
  }, [socket, isConnected, fetchRows]);

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

  const handleDownload = () => {
    downloadCsv(
      "library-class-holidays.csv",
      ["#", "Holiday", "Program Course", "Semester", "Approved Holiday"],
      rows.map((row, i) => [
        String((page - 1) * limit + i + 1),
        holidayName(row.holidayId),
        programCourseName(row.programCourseId),
        className(row.classId),
        row.isHoliday ? "Yes" : "No",
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
                <CalendarRange className="mr-2 h-8 w-8 rounded-md border p-1" />
                Class Holidays
              </CardTitle>
              <p className="mt-1 text-[11px] text-muted-foreground sm:text-sm">
                Map holidays to program courses and classes.
              </p>
            </div>
            <LibraryMasterHeaderActions onDownload={handleDownload} onAdd={openCreate} />
          </div>
        </CardHeader>

        <CardContent className="min-w-0 px-0">
          <div className="relative min-w-0 px-0 sm:px-0" style={{ minHeight: "400px" }}>
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
                      <TableHead className="sticky top-0 z-20 bg-slate-100 w-10">#</TableHead>
                      <TableHead className="sticky top-0 z-20 bg-slate-100">Holiday</TableHead>
                      <TableHead className="sticky top-0 z-20 bg-slate-100">
                        Program Course
                      </TableHead>
                      <TableHead className="sticky top-0 z-20 bg-slate-100">Semester</TableHead>
                      <TableHead className="sticky top-0 z-20 bg-slate-100">
                        Approved Holiday (Yes/No)
                      </TableHead>

                      <TableHead className="sticky top-0 z-20 bg-slate-100 w-[90px] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={row.id}>
                        <TableCell>{(page - 1) * limit + i + 1}</TableCell>
                        <TableCell className="font-medium">{holidayName(row.holidayId)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {programCourseName(row.programCourseId)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {className(row.classId)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {row.isHoliday ? "Yes" : "No"}
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
          <div className="grid gap-4 px-6 py-4 grid-cols-1 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Holiday *</Label>
              <Select
                value={form.holidayId}
                onValueChange={(v) => setForm((f) => ({ ...f, holidayId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select holiday" />
                </SelectTrigger>
                <SelectContent>
                  {holidays.map((h) => {
                    const fromDate = new Date(h.from).toLocaleDateString();
                    const toDate = new Date(h.to).toLocaleDateString();
                    const dateDisplay = fromDate === toDate ? fromDate : `${fromDate} - ${toDate}`;

                    return (
                      <SelectItem key={h.id} value={String(h.id)}>
                        {h.name} ({dateDisplay})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Program Course *</Label>
              <Select
                value={form.programCourseId}
                onValueChange={(v) => setForm((f) => ({ ...f, programCourseId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program course" />
                </SelectTrigger>
                <SelectContent>
                  {programCourses.map((pc) => (
                    <SelectItem key={pc.id} value={String(pc.id)}>
                      {pc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Semester *</Label>
              <Select
                value={form.classId}
                onValueChange={(v) => setForm((f) => ({ ...f, classId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Approved Holiday?</Label>
              <Select
                value={form.isHoliday ? "yes" : "no"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    isHoliday: v === "yes",
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
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
