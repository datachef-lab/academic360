import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, GraduationCap, Layers } from "lucide-react";
import { toast } from "sonner";

import { useAppSelector } from "@/store/hooks";
import { selectCurrentAcademicYear } from "@/store/slices/academicYearSlice";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { SearchableSelect } from "@/features/academic-year-setup/general/SearchableSelect";
import { useResourceRoom } from "@/features/academic-year-setup/general/useResourceRoom";
import {
  type AdmissionProgramCourse,
  type SimpleOption,
  getAdmissions,
  getAdmissionCourses,
  createAdmissionCourse,
  updateAdmissionCourse,
  deleteAdmissionCourse,
  createAdmission,
  getSessions,
  getProgramCourses,
  getShifts,
  getClasses,
} from "@/services/admission-program-course.service";

type Admission = {
  id: number;
  sessionId?: number;
  isClosed?: boolean;
  academicYear?: { id: number; year: string };
};

type FormState = {
  programCourseId: string;
  shiftId: string;
  classId: string;
  amount: string;
  isActive: boolean;
  isClosed: boolean;
  remarks: string;
};

const emptyForm: FormState = {
  programCourseId: "",
  shiftId: "",
  classId: "",
  amount: "750",
  isActive: true,
  isClosed: false,
  remarks: "",
};

export default function AdmissionProgramCoursePage() {
  useRestrictTempUsers();
  const currentYear = useAppSelector(selectCurrentAcademicYear);

  const [admission, setAdmission] = React.useState<Admission | null>(null);
  const [rows, setRows] = React.useState<AdmissionProgramCourse[]>([]);
  const [programCourses, setProgramCourses] = React.useState<SimpleOption[]>([]);
  const [shifts, setShifts] = React.useState<SimpleOption[]>([]);
  const [classes, setClasses] = React.useState<SimpleOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<AdmissionProgramCourse | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = React.useState(false);

  // create-admission-cycle dialog
  const [isCycleOpen, setIsCycleOpen] = React.useState(false);
  const [sessions, setSessions] = React.useState<SimpleOption[]>([]);
  const [cycleForm, setCycleForm] = React.useState({ sessionId: "", startDate: "", lastDate: "" });
  const [creatingCycle, setCreatingCycle] = React.useState(false);

  const nameOf = (list: SimpleOption[], id: number | null | undefined) =>
    id == null ? "-" : (list.find((o) => o.id === Number(id))?.name ?? `#${id}`);

  // load supporting lists once
  React.useEffect(() => {
    Promise.all([getProgramCourses(), getShifts(), getClasses()])
      .then(([pc, sh, cl]) => {
        setProgramCourses(pc);
        setShifts(sh);
        setClasses(cl);
      })
      .catch(() => undefined);
  }, []);

  // resolve the admission cycle for the selected academic year
  const resolveAdmission = React.useCallback(async () => {
    setLoading(true);
    try {
      const all = (await getAdmissions()) as Admission[];
      const match =
        all.find((a) => a.academicYear?.id && a.academicYear.id === currentYear?.id) ??
        all.find((a) => String(a.academicYear?.year ?? "") === String(currentYear?.year ?? "")) ??
        null;
      setAdmission(match);
      if (match) {
        setRows(await getAdmissionCourses(match.id));
      } else {
        setRows([]);
      }
    } catch {
      toast.error("Failed to load admission cycle");
    } finally {
      setLoading(false);
    }
  }, [currentYear?.id, currentYear?.year]);

  React.useEffect(() => {
    resolveAdmission();
  }, [resolveAdmission]);

  const reloadRows = React.useCallback(async () => {
    if (!admission) return;
    try {
      setRows(await getAdmissionCourses(admission.id));
    } catch {
      /* ignore */
    }
  }, [admission]);

  useResourceRoom("admissions/courses", reloadRows);

  const openAdd = () => {
    setSelected(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };
  const openEdit = (row: AdmissionProgramCourse) => {
    setSelected(row);
    setForm({
      programCourseId: String(row.programCourseId ?? ""),
      shiftId: row.shiftId == null ? "" : String(row.shiftId),
      classId: row.classId == null ? "" : String(row.classId),
      amount: String(row.amount ?? 750),
      isActive: row.isActive !== false,
      isClosed: Boolean(row.isClosed),
      remarks: row.remarks ?? "",
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async () => {
    if (!admission) return;
    if (!form.programCourseId) {
      toast.error("Program Course is required");
      return;
    }
    setSubmitting(true);
    try {
      const body: Partial<AdmissionProgramCourse> = {
        admissionId: admission.id,
        programCourseId: Number(form.programCourseId),
        amount: form.amount === "" ? 750 : Number(form.amount),
        shiftId: form.shiftId ? Number(form.shiftId) : null,
        classId: form.classId ? Number(form.classId) : null,
        isActive: form.isActive,
        isClosed: form.isClosed,
        remarks: form.remarks || null,
      };
      if (selected) await updateAdmissionCourse(selected.id, body);
      else await createAdmissionCourse(body);
      toast.success(`Program course ${selected ? "updated" : "added"}`);
      setIsFormOpen(false);
      await reloadRows();
    } catch (e) {
      toast.error(`Failed to save: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteAdmissionCourse(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      toast.success("Program course removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const openCreateCycle = async () => {
    setCycleForm({ sessionId: "", startDate: "", lastDate: "" });
    try {
      setSessions(await getSessions());
    } catch {
      setSessions([]);
    }
    setIsCycleOpen(true);
  };

  const handleCreateCycle = async () => {
    if (!cycleForm.sessionId) {
      toast.error("Session is required");
      return;
    }
    setCreatingCycle(true);
    try {
      await createAdmission({
        sessionId: Number(cycleForm.sessionId),
        status: "DRAFT",
        startDate: cycleForm.startDate || null,
        lastDate: cycleForm.lastDate || null,
      });
      toast.success("Admission cycle created");
      setIsCycleOpen(false);
      await resolveAdmission();
    } catch (e) {
      toast.error(`Failed to create cycle: ${e instanceof Error ? e.message : "error"}`);
    } finally {
      setCreatingCycle(false);
    }
  };

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      nameOf(programCourses, r.programCourseId).toLowerCase().includes(q) ||
      nameOf(shifts, r.shiftId).toLowerCase().includes(q) ||
      nameOf(classes, r.classId).toLowerCase().includes(q) ||
      String(r.amount).includes(q)
    );
  });

  const yearLabel = currentYear?.year ?? "selected year";

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="mb-3 flex flex-col items-start justify-between gap-4 rounded-md border p-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <GraduationCap className="mr-2 h-6 w-6 flex-shrink-0 rounded-md border border-slate-400 p-1 sm:h-8 sm:w-8" />
              <span className="truncate">Eligible Program Courses</span>
            </CardTitle>
            <div className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Program-courses offered in the admission process for{" "}
              <span className="font-medium">{yearLabel}</span>
              {admission?.isClosed && (
                <Badge variant="secondary" className="ml-2">
                  Cycle closed
                </Badge>
              )}
            </div>
          </div>
          {admission && (
            <Button
              onClick={openAdd}
              className="flex-shrink-0 bg-purple-600 text-white hover:bg-purple-700"
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Program Course
            </Button>
          )}
        </CardHeader>

        <CardContent className="px-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : !admission ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center">
              <Layers className="h-10 w-10 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                No admission cycle exists for <span className="font-medium">{yearLabel}</span> yet.
              </div>
              <Button
                onClick={openCreateCycle}
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Create admission cycle
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-0 flex items-center gap-2 border-b bg-background p-2 sm:p-4">
                <Input
                  placeholder="Search program course / shift / class…"
                  className="w-full sm:w-80"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="overflow-auto" style={{ maxHeight: 560 }}>
                <Table className="min-w-[800px] border">
                  <TableHeader className="sticky top-0 z-10 bg-gray-100">
                    <TableRow>
                      <TableHead className="bg-gray-100">Program Course</TableHead>
                      <TableHead className="bg-gray-100">Shift</TableHead>
                      <TableHead className="bg-gray-100">Class</TableHead>
                      <TableHead className="bg-gray-100">Amount</TableHead>
                      <TableHead className="bg-gray-100">Active</TableHead>
                      <TableHead className="bg-gray-100">Closed</TableHead>
                      <TableHead className="bg-gray-100">Remarks</TableHead>
                      <TableHead className="w-[110px] bg-gray-100">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center">
                          No program courses configured.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((row) => (
                        <TableRow key={row.id} className="group">
                          <TableCell className="font-medium">
                            {nameOf(programCourses, row.programCourseId)}
                          </TableCell>
                          <TableCell>{nameOf(shifts, row.shiftId)}</TableCell>
                          <TableCell>{nameOf(classes, row.classId)}</TableCell>
                          <TableCell>₹{row.amount}</TableCell>
                          <TableCell>
                            {row.isActive !== false ? (
                              <Badge className="bg-green-500 text-white hover:bg-green-600">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {row.isClosed ? (
                              <Badge variant="secondary">Closed</Badge>
                            ) : (
                              <span className="text-muted-foreground">Open</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                            {row.remarks ?? "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(row)}
                                className="h-7 w-7 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(row.id)}
                                className="h-7 w-7 p-0"
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Add / edit program course */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-[95vw] max-w-lg sm:w-full">
          <DialogHeader>
            <DialogTitle>{selected ? "Edit Program Course" : "Add Program Course"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">
                Program Course<span className="text-red-500"> *</span>
              </Label>
              <SearchableSelect
                value={form.programCourseId}
                onChange={(v) => setForm((p) => ({ ...p, programCourseId: v }))}
                options={programCourses.map((o) => ({ value: String(o.id), label: o.name }))}
                placeholder="Select Program Course"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Shift</Label>
              <SearchableSelect
                value={form.shiftId}
                onChange={(v) => setForm((p) => ({ ...p, shiftId: v }))}
                options={shifts.map((o) => ({ value: String(o.id), label: o.name }))}
                placeholder="Select Shift"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Class</Label>
              <SearchableSelect
                value={form.classId}
                onChange={(v) => setForm((p) => ({ ...p, classId: v }))}
                options={classes.map((o) => ({ value: String(o.id), label: o.name }))}
                placeholder="Select Class"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Amount (₹)</Label>
              <Input
                type="number"
                className="sm:w-48"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isClosed}
                onChange={(e) => setForm((p) => ({ ...p, isClosed: e.target.checked }))}
              />
              Closed
            </label>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Remarks</Label>
              <Input
                value={form.remarks}
                onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create admission cycle */}
      <Dialog open={isCycleOpen} onOpenChange={setIsCycleOpen}>
        <DialogContent className="w-[95vw] max-w-md sm:w-full">
          <DialogHeader>
            <DialogTitle>Create Admission Cycle</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">
                Session<span className="text-red-500"> *</span>
              </Label>
              <SearchableSelect
                value={cycleForm.sessionId}
                onChange={(v) => setCycleForm((p) => ({ ...p, sessionId: v }))}
                options={sessions.map((o) => ({ value: String(o.id), label: o.name }))}
                placeholder="Select Session"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={cycleForm.startDate}
                onChange={(e) => setCycleForm((p) => ({ ...p, startDate: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Last Date</Label>
              <Input
                type="date"
                value={cycleForm.lastDate}
                onChange={(e) => setCycleForm((p) => ({ ...p, lastDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCycleOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCycle} disabled={creatingCycle}>
              {creatingCycle ? "Creating..." : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
