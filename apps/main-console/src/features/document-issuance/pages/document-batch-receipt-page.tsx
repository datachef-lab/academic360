import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
  CalendarClock,
  CheckCircle2,
  Filter,
  Loader2,
  PackageCheck,
  Pencil,
  PlusCircle,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  createBatchReceipt,
  deleteBatchReceipt,
  generateBatchReceiptEntries,
  getAllBatchReceipts,
  setBatchReceiptMode,
  updateBatchReceipt,
  type BatchReceipt,
  type BatchReceiptMode,
  type BatchReceiptUpsertBody,
} from "@/features/document-issuance/services/document-batch-receipt.service";
import { getAllDocumentTypes } from "@/features/document-issuance/services/document-type.service";
import { getAllAcademicYears } from "@/services/academic-year-api";
import { getAllClasses } from "@/services/classes.service";
import { getProgramCourses } from "@/services/admission-program-course.service";

const ALL = "__all__";
const BATCH_RECEIPTS_QUERY_KEY = ["document-batch-receipts"] as const;

/** Switch defaults to `bg-primary` when on; this reads as "enabled" instead. */
const SWITCH_ON = "data-[state=checked]:bg-green-400";

/**
 * Header cells pin to the page's scroll container (MasterLayout owns it) — so no
 * inner `overflow` wrapper, which would make `sticky` resolve against a box that
 * never scrolls. Same rule as the Document Types table.
 */
const STICKY_HEAD =
  "sticky top-0 z-20 bg-[#f3f4f6] shadow-[inset_0_-1px_0_0_hsl(var(--border))] " +
  "first:rounded-tl-md last:rounded-tr-md";

type FormState = {
  name: string;
  documentTypeId: string;
  academicYearId: string;
  classId: string;
  programCourseIds: number[];
  expectedArrivalDate: string;
  availableFromDate: string;
};

const emptyForm = (): FormState => ({
  name: "",
  documentTypeId: "",
  academicYearId: "",
  classId: "",
  programCourseIds: [],
  expectedArrivalDate: "",
  availableFromDate: "",
});

const toDateInput = (iso: string | null) => (iso ? String(iso).slice(0, 10) : "");

function apiErrorMessage(e: unknown, fallback: string): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
  }
  return fallback;
}

function modeOf(row: BatchReceipt, mode: BatchReceiptMode): boolean {
  return row.modes.find((m) => m.mode === mode)?.isEnabled ?? false;
}

export default function DocumentBatchReceiptPage() {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [yearFilter, setYearFilter] = useState<string>(ALL);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<BatchReceipt | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<BatchReceipt | null>(null);

  const {
    data: rows = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: BATCH_RECEIPTS_QUERY_KEY,
    queryFn: () => getAllBatchReceipts(),
  });

  // Only types the university actually issues can arrive as a bundle — a student
  // upload or a college-generated PDF never does.
  const { data: documentTypes = [] } = useQuery({
    queryKey: ["document-types"],
    queryFn: async () => (await getAllDocumentTypes()).payload ?? [],
  });
  const receivableTypes = useMemo(
    () => documentTypes.filter((t) => t.issuingAuthority === "UNIVERSITY" && t.isActive !== false),
    [documentTypes],
  );

  const { data: academicYears = [] } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => (await getAllAcademicYears()).payload ?? [],
  });
  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: getAllClasses,
  });
  const { data: programCourses = [] } = useQuery({
    queryKey: ["program-courses"],
    queryFn: getProgramCourses,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: BATCH_RECEIPTS_QUERY_KEY });

  const createMutation = useMutation({
    mutationFn: (body: BatchReceiptUpsertBody) => createBatchReceipt(body),
    onSuccess: async () => {
      toast.success("Batch receipt created");
      setDialogOpen(false);
      await invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not create the batch receipt.")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<BatchReceiptUpsertBody> }) =>
      updateBatchReceipt(id, body),
    onSuccess: async () => {
      toast.success("Batch receipt updated");
      setDialogOpen(false);
      await invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not update the batch receipt.")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBatchReceipt(id),
    onSuccess: async (result) => {
      toast.success(
        result?.removedLedgerRows
          ? `Batch deleted along with ${result.removedLedgerRows} pending entries`
          : "Batch deleted",
      );
      setDeleteTarget(null);
      await invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not delete the batch receipt.")),
  });

  const modeMutation = useMutation({
    mutationFn: ({
      id,
      mode,
      isEnabled,
    }: {
      id: number;
      mode: BatchReceiptMode;
      isEnabled: boolean;
    }) => setBatchReceiptMode(id, mode, isEnabled),
    onSuccess: async (result, vars) => {
      const g = result?.generation;
      if (g) {
        // Enabling the distribution step is what creates the entries, so say
        // exactly what it wrote rather than a bare "saved".
        toast.success(
          `${g.created} document${g.created === 1 ? "" : "s"} added to the students' ledger` +
            (g.alreadyPresent ? ` — ${g.alreadyPresent} already had one` : ""),
        );
      } else {
        toast.success(
          `${vars.mode === "EXAM_LINKED" ? "Arrival" : "Distribution"} step ${
            vars.isEnabled ? "enabled" : "disabled"
          }`,
        );
      }
      await invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not update the step.")),
  });

  const generateMutation = useMutation({
    mutationFn: (id: number) => generateBatchReceiptEntries(id),
    onSuccess: async (g) => {
      toast.success(
        g.created
          ? `${g.created} new entr${g.created === 1 ? "y" : "ies"} added`
          : "Everyone in scope already has an entry",
      );
      await invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not top up the entries.")),
  });

  const saving = createMutation.isLoading || updateMutation.isLoading;

  const filteredRows = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return rows.filter((r) => {
      if (yearFilter !== ALL && r.academicYear !== yearFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.documentTypeName.toLowerCase().includes(q) ||
        r.className.toLowerCase().includes(q) ||
        r.academicYear.toLowerCase().includes(q) ||
        r.programCourses.some((c) => c.toLowerCase().includes(q))
      );
    });
  }, [rows, searchText, yearFilter]);

  const openCreate = () => {
    setEditingRow(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (row: BatchReceipt) => {
    setEditingRow(row);
    setForm({
      name: row.name,
      documentTypeId: String(row.documentTypeId),
      academicYearId: String(row.academicYearId),
      classId: String(row.classId),
      programCourseIds: row.programCourseIds,
      expectedArrivalDate: toDateInput(row.expectedArrivalDate),
      availableFromDate: toDateInput(row.availableFromDate),
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return toast.error("A name is required");
    if (!form.documentTypeId) return toast.error("Pick the document type");
    if (!form.academicYearId) return toast.error("Pick the academic year");
    if (!form.classId) return toast.error("Pick the class");
    if (form.programCourseIds.length === 0) {
      return toast.error("Pick at least one program course");
    }

    const body: BatchReceiptUpsertBody = {
      name: form.name.trim(),
      documentTypeId: Number(form.documentTypeId),
      academicYearId: Number(form.academicYearId),
      classId: Number(form.classId),
      programCourseIds: form.programCourseIds,
      expectedArrivalDate: form.expectedArrivalDate || null,
      availableFromDate: form.availableFromDate || null,
    };

    if (editingRow) updateMutation.mutate({ id: editingRow.id, body });
    else createMutation.mutate(body);
  };

  const toggleCourse = (id: number) =>
    setForm((f) => ({
      ...f,
      programCourseIds: f.programCourseIds.includes(id)
        ? f.programCourseIds.filter((x) => x !== id)
        : [...f.programCourseIds, id],
    }));

  const allCoursesSelected =
    programCourses.length > 0 && form.programCourseIds.length === programCourses.length;

  return (
    <div className="p-2 sm:p-4">
      <Card className="border-none">
        <CardHeader className="mb-3 flex flex-col gap-4 rounded-md border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <PackageCheck className="mr-2 h-8 w-8 shrink-0 rounded-md border border-slate-400 p-1 text-purple-700" />
              Document Batch Receipts
            </CardTitle>
            <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
              Bundles of documents received from the university. Enabling the distribution step
              creates a pending entry in each student's ledger.
            </p>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full sm:w-[190px]">
                <Filter className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="Academic year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All academic years</SelectItem>
                {academicYears.map((y) => (
                  <SelectItem key={y.id} value={String(y.year)}>
                    {y.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={openCreate}
              className="flex-1 bg-purple-600 text-white shadow-none hover:bg-purple-700 sm:flex-none"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <div className="mb-3 bg-background px-2 py-3 sm:px-4">
            <Input
              placeholder="Search by name, document type, class or program course..."
              className="w-full max-w-md"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="px-2 sm:px-4" style={{ minHeight: "400px" }}>
            {isLoading ? (
              <div className="flex min-h-[320px] items-center justify-center text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading…
              </div>
            ) : isError ? (
              <div className="flex min-h-[320px] items-center justify-center text-sm text-red-600">
                Failed to load batch receipts.
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center gap-1 text-slate-500">
                <span>No batch receipts yet.</span>
                <span className="text-xs">
                  Create one when a bundle of documents arrives from the university.
                </span>
              </div>
            ) : (
              <div className="rounded-md border bg-background">
                <Table containerClassName="max-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className={STICKY_HEAD}>#</TableHead>
                      <TableHead className={`${STICKY_HEAD} w-[24%]`}>Batch</TableHead>
                      <TableHead className={STICKY_HEAD}>Scope</TableHead>
                      <TableHead className={`${STICKY_HEAD} text-center`}>
                        Arrival
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          exam linked
                        </span>
                      </TableHead>
                      <TableHead className={`${STICKY_HEAD} text-center`}>
                        Distribution
                        <span className="block text-[10px] font-normal text-muted-foreground">
                          administrative
                        </span>
                      </TableHead>
                      <TableHead className={`${STICKY_HEAD} text-center`}>Ledger</TableHead>
                      <TableHead className={`${STICKY_HEAD} text-right`}>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row, i) => {
                      const distributionOn = modeOf(row, "ADMINISTRATIVE");
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="whitespace-nowrap align-top">{i + 1}</TableCell>
                          <TableCell className="align-top">
                            <div className="flex flex-col items-start gap-1">
                              <span className="break-words font-medium">{row.name}</span>
                              <Badge
                                variant="outline"
                                className="border-indigo-200 bg-indigo-50 text-[11px] text-indigo-700"
                              >
                                {row.documentTypeName}
                              </Badge>
                              {row.expectedArrivalDate && (
                                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <CalendarClock className="h-3 w-3" />
                                  expected {toDateInput(row.expectedArrivalDate)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-top text-sm">
                            <div className="flex flex-col gap-1">
                              <span>
                                {row.academicYear} · {row.className}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {row.programCourses.length === 0
                                  ? "No program course"
                                  : row.programCourses.length <= 2
                                    ? row.programCourses.join(", ")
                                    : `${row.programCourses.length} program courses`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center align-top">
                            <Switch
                              className={SWITCH_ON}
                              checked={modeOf(row, "EXAM_LINKED")}
                              disabled={modeMutation.isLoading}
                              onCheckedChange={(v) =>
                                modeMutation.mutate({
                                  id: row.id,
                                  mode: "EXAM_LINKED",
                                  isEnabled: v,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-center align-top">
                            <Switch
                              className={SWITCH_ON}
                              checked={distributionOn}
                              disabled={modeMutation.isLoading}
                              onCheckedChange={(v) =>
                                modeMutation.mutate({
                                  id: row.id,
                                  mode: "ADMINISTRATIVE",
                                  isEnabled: v,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-center align-top">
                            {row.ledger.total === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <div className="flex flex-col items-center gap-0.5">
                                <span className="flex items-center gap-1 text-xs">
                                  <Users className="h-3 w-3 text-slate-500" />
                                  {row.ledger.total}
                                </span>
                                <span className="flex items-center gap-1 text-[11px] text-emerald-700">
                                  <CheckCircle2 className="h-3 w-3" />
                                  {row.ledger.collected} collected
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right align-top">
                            {distributionOn && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Top up: add entries for students promoted since"
                                disabled={generateMutation.isLoading}
                                onClick={() => generateMutation.mutate(row.id)}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEdit(row)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:text-red-700"
                              onClick={() => setDeleteTarget(row)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------ create / edit ---------------------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRow ? "Edit batch receipt" : "New batch receipt"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                placeholder="e.g. Semester IV admit cards — March 2026"
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label>Document type</Label>
                <Select
                  value={form.documentTypeId}
                  onValueChange={(v) => setForm((f) => ({ ...f, documentTypeId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {receivableTypes.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Academic year</Label>
                <Select
                  value={form.academicYearId}
                  onValueChange={(v) => setForm((f) => ({ ...f, academicYearId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((y) => (
                      <SelectItem key={y.id} value={String(y.id)}>
                        {y.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Class</Label>
                <Select
                  value={form.classId}
                  onValueChange={(v) => setForm((f) => ({ ...f, classId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
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
            </div>

            {editingRow && editingRow.ledger.total > 0 && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                This batch already has {editingRow.ledger.total} ledger entries, so the document
                type, academic year and class are fixed — they define which students those entries
                belong to.
              </p>
            )}

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label>Program courses</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      programCourseIds: allCoursesSelected ? [] : programCourses.map((p) => p.id),
                    }))
                  }
                >
                  {allCoursesSelected ? "Clear all" : "Select all"}
                </Button>
              </div>
              <div className="grid max-h-48 grid-cols-1 gap-1 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
                {programCourses.map((p) => (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-purple-600"
                      checked={form.programCourseIds.includes(p.id)}
                      onChange={() => toggleCourse(p.id)}
                    />
                    <span className="break-words">{p.name}</span>
                  </label>
                ))}
              </div>
              <span className="text-[11px] text-muted-foreground">
                {form.programCourseIds.length} selected — students of these courses in the chosen
                year and class get an entry.
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Expected arrival</Label>
                <Input
                  type="date"
                  value={form.expectedArrivalDate}
                  onChange={(e) => setForm((f) => ({ ...f, expectedArrivalDate: e.target.value }))}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Available from</Label>
                <Input
                  type="date"
                  value={form.availableFromDate}
                  onChange={(e) => setForm((f) => ({ ...f, availableFromDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-purple-600 text-white hover:bg-purple-700"
              disabled={saving}
              onClick={handleSave}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingRow ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --------------------------------- delete -------------------------------- */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this batch receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.ledger.collected
                ? `${deleteTarget.ledger.collected} document(s) in this batch have already been collected, so it cannot be deleted — a handover is a record about a student, not a setting.`
                : deleteTarget?.ledger.total
                  ? `"${deleteTarget?.name}" and its ${deleteTarget?.ledger.pending} pending ledger entries will be removed.`
                  : `"${deleteTarget?.name}" will be removed.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={Boolean(deleteTarget?.ledger.collected) || deleteMutation.isLoading}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
