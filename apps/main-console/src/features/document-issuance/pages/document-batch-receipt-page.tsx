import { useEffect, useMemo, useRef, useState } from "react";
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
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import MultiSelect from "@/components/ui/MultiSelect";
import {
  createBatchReceipt,
  generateBatchReceiptEntries,
  getAllBatchReceipts,
  getPromotionCountForScope,
  setBatchReceiptMode,
  updateBatchReceipt,
  type BatchReceipt,
  type BatchReceiptMode,
  type BatchReceiptUpsertBody,
} from "@/features/document-issuance/services/document-batch-receipt.service";
import { getAllDocumentTypes } from "@/features/document-issuance/services/document-type.service";
import { getAllAcademicYears } from "@/services/academic-year-api";
import { getAllClasses } from "@/services/classes.service";
import {
  getProgramCoursesRich,
  type RichProgramCourse,
} from "@/services/admission-program-course.service";
import { getAllCourseLevels } from "@/services/course-level.api";
import { getAllStreams } from "@/services/stream.api";
import { getAffiliations, getRegulationTypes } from "@/services/course-design.api";

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

/** Filters live in dialog state — they narrow the program-course list but are
 *  not persisted; the batch itself only stores the resulting course ids. */
type FilterState = {
  affiliationId: number | null;
  regulationTypeId: number | null;
  courseLevelId: number | null;
  streamIds: number[];
};

const emptyFilters = (): FilterState => ({
  affiliationId: null,
  regulationTypeId: null,
  courseLevelId: null,
  streamIds: [],
});

export default function DocumentBatchReceiptPage() {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [yearFilter, setYearFilter] = useState<string>(ALL);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<BatchReceipt | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [filters, setFilters] = useState<FilterState>(emptyFilters());
  const [examLinkedEnabled, setExamLinkedEnabled] = useState(true);
  const [adminEnabled, setAdminEnabled] = useState(false);
  const [isArchived, setIsArchived] = useState(false);
  /** Once the user types in the Name field, stop auto-syncing it to
   *  `composedName`. Edit-mode starts dirty (existing name wins). */
  const [nameDirty, setNameDirty] = useState(false);

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
  const { data: programCourses = [] } = useQuery<RichProgramCourse[]>({
    queryKey: ["program-courses-rich"],
    queryFn: getProgramCoursesRich,
  });

  // Filter dimensions — driven by the 4 multi-selects. Each list is small,
  // fetched once, and used only for its {id, name} pair.
  const { data: affiliations = [] } = useQuery({
    queryKey: ["affiliations"],
    queryFn: getAffiliations,
  });
  const { data: regulationTypes = [] } = useQuery({
    queryKey: ["regulation-types"],
    queryFn: getRegulationTypes,
  });
  const { data: courseLevels = [] } = useQuery({
    queryKey: ["course-levels"],
    queryFn: getAllCourseLevels,
  });
  const { data: streams = [] } = useQuery({
    queryKey: ["streams"],
    queryFn: getAllStreams,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: BATCH_RECEIPTS_QUERY_KEY });

  // Chained mutations: after the batch write lands, sync the two mode toggles
  // from the dialog. Server-side defaults are EXAM_LINKED=true, ADMIN=false —
  // so on create we only fire mode PUTs when the dialog state differs from
  // those defaults.
  const createMutation = useMutation({
    mutationFn: async (body: BatchReceiptUpsertBody) => {
      const created = await createBatchReceipt(body);
      if (!examLinkedEnabled) {
        await setBatchReceiptMode(created.id, "EXAM_LINKED", false);
      }
      if (adminEnabled) {
        await setBatchReceiptMode(created.id, "ADMINISTRATIVE", true);
      }
      // Exam-linked on save writes the ledger entries (one PENDING row per
      // active promotion in scope). Idempotent — the top-up NOT EXISTS filter
      // in the backend means re-saves top up without duplicating.
      if (examLinkedEnabled) {
        await generateBatchReceiptEntries(created.id);
      }
      return created;
    },
    onSuccess: async () => {
      toast.success("Batch receipt created");
      setDialogOpen(false);
      await invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not create the batch receipt.")),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: Partial<BatchReceiptUpsertBody> }) => {
      const updated = await updateBatchReceipt(id, body);
      const currentExam =
        editingRow?.modes.find((m) => m.mode === "EXAM_LINKED")?.isEnabled ?? true;
      const currentAdmin =
        editingRow?.modes.find((m) => m.mode === "ADMINISTRATIVE")?.isEnabled ?? false;
      if (examLinkedEnabled !== currentExam) {
        await setBatchReceiptMode(id, "EXAM_LINKED", examLinkedEnabled);
      }
      if (adminEnabled !== currentAdmin) {
        await setBatchReceiptMode(id, "ADMINISTRATIVE", adminEnabled);
      }
      // See createMutation — every save with Exam-linked on writes / tops up
      // the ledger, whether or not the toggle changed. Idempotent.
      if (examLinkedEnabled) {
        await generateBatchReceiptEntries(id);
      }
      return updated;
    },
    onSuccess: async () => {
      toast.success("Batch receipt updated");
      setDialogOpen(false);
      await invalidate();
    },
    onError: (e) => toast.error(apiErrorMessage(e, "Could not update the batch receipt.")),
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
    setFilters(emptyFilters());
    setExamLinkedEnabled(true);
    setAdminEnabled(false);
    setIsArchived(false);
    setNameDirty(false);
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
    setFilters(emptyFilters());
    setExamLinkedEnabled(row.modes.find((m) => m.mode === "EXAM_LINKED")?.isEnabled ?? true);
    setAdminEnabled(row.modes.find((m) => m.mode === "ADMINISTRATIVE")?.isEnabled ?? false);
    setIsArchived(row.isArchived ?? false);
    // Edit-mode: the stored name is authoritative — freeze it.
    setNameDirty(true);
    setDialogOpen(true);
  };

  /**
   * Program courses shown in the grid. Every filter with at least one chip
   * narrows; an empty filter leaves the dimension open. `null` FKs on a course
   * mean it is unclassified and therefore only appears when no filter for that
   * dimension is set.
   */
  const filteredProgramCourses = useMemo(() => {
    return (
      programCourses
        .filter((p) => (p.isActive === false ? false : true))
        .filter((p) => {
          if (filters.affiliationId && p.affiliationId !== filters.affiliationId) return false;
          if (filters.regulationTypeId && p.regulationTypeId !== filters.regulationTypeId)
            return false;
          if (filters.courseLevelId && p.courseLevelId !== filters.courseLevelId) return false;
          if (filters.streamIds.length && (!p.streamId || !filters.streamIds.includes(p.streamId)))
            return false;
          return true;
        })
        // Group visually by stream (ASC), then by course label within a stream.
        // The name-composition memo consumes the same ordering, so the header
        // reflects the order the user sees on-screen.
        .sort((a, b) => {
          const sa = a.streamId ?? Number.POSITIVE_INFINITY;
          const sb = b.streamId ?? Number.POSITIVE_INFINITY;
          if (sa !== sb) return sa - sb;
          const la = a.shortName ?? a.name;
          const lb = b.shortName ?? b.name;
          return la.localeCompare(lb);
        })
    );
  }, [programCourses, filters]);

  /**
   * Level of the currently selected course level, if identifiable — used to
   * pick which stream prefix (ugPrefix vs pgPrefix) to display next to each
   * stream option. Checks shortName first ("UG" / "PG"), then name.
   */
  const selectedLevelKind: "UG" | "PG" | null = useMemo(() => {
    if (!filters.courseLevelId) return null;
    const lvl = courseLevels.find((c) => (c.id ?? 0) === filters.courseLevelId);
    if (!lvl) return null;
    const s = `${lvl.shortName ?? ""} ${lvl.name ?? ""}`.toUpperCase();
    if (s.includes("PG") || s.includes("POSTGRAD")) return "PG";
    if (s.includes("UG") || s.includes("UNDERGRAD")) return "UG";
    return null;
  }, [filters.courseLevelId, courseLevels]);

  const streamLabel = (s: {
    name: string;
    shortName?: string | null;
    ugPrefix?: string | null;
    pgPrefix?: string | null;
  }) => {
    if (selectedLevelKind === "UG" && s.ugPrefix) return s.ugPrefix;
    if (selectedLevelKind === "PG" && s.pgPrefix) return s.pgPrefix;
    return s.shortName || s.name;
  };

  /** Strip the leading "Semester" word from a class label ("Semester IV" → "IV"). */
  const trimSemester = (label: string) => label.replace(/^\s*semester\s+/i, "").trim() || label;

  /** Normalise class names for display in the composed name — the DB has a mix
   *  of casings ("SEMESTER I", "Semester I"); force a single title-cased form
   *  so the header doesn't look like it's shouting. */
  const normalizeSemester = (label: string) => {
    const rest = label.replace(/^\s*semester\s+/i, "").trim();
    return rest ? `Semester ${rest}` : label;
  };

  /**
   * Exam-linked and Administrative are ordered: Administrative depends on
   * Exam-linked being on (that step is what records the bundle's arrival,
   * which distribution presupposes).
   *
   * - Flipping Exam-linked OFF strips both dates AND turns Administrative
   *   off; leaving them behind would silently persist stale state.
   * - Flipping Administrative ON auto-enables Exam-linked (users can't
   *   distribute a bundle we haven't recorded arriving).
   */
  const handleExamLinkedChange = (v: boolean) => {
    setExamLinkedEnabled(v);
    if (!v) {
      setAdminEnabled(false);
      setForm((f) => ({ ...f, expectedArrivalDate: "", availableFromDate: "" }));
    }
  };
  const handleAdminChange = (v: boolean) => {
    setAdminEnabled(v);
    if (v && !examLinkedEnabled) setExamLinkedEnabled(true);
  };

  /**
   * Program-course list renders once the narrowing scope is set: academic
   * year, document type, affiliation, regulation, course level, and at least
   * one stream. Semester is NOT part of this gate — a batch can be a full
   * course of study, and users should be able to pick program courses before
   * committing to a semester. Semester is still required at save time.
   */
  const scopeComplete = Boolean(
    form.academicYearId &&
    form.documentTypeId &&
    filters.affiliationId &&
    filters.regulationTypeId &&
    filters.courseLevelId &&
    filters.streamIds.length > 0,
  );

  /** Minimum viable batch — enables Create/Save. */
  const canSave = Boolean(
    form.academicYearId && form.documentTypeId && form.classId && form.programCourseIds.length > 0,
  );

  /**
   * Once any ledger row for this batch is COLLECTED or UPLOADED, every
   * scope-defining knob is fixed: doc type / academic year / class /
   * course level / streams / semester / affiliation / regulation, plus
   * the exam-linked toggle. Recorded handovers already belong to a
   * specific derivation — changing the scope now would orphan them.
   * `recordedByCourse` narrows the same lock to the individual course
   * checkboxes: a course whose row was recorded stays checked even
   * when the wider lock is off.
   */
  const scopeLocked = Boolean(editingRow && editingRow.ledger.recorded > 0);
  const recordedByCourse: Record<number, number> = editingRow?.recordedByProgramCourseId ?? {};

  /**
   * Auto-composed batch name — derived, not entered. Format:
   *   `<streams> <semester> <affiliation> <document type> (<regulation>) Distribution - <academic year>`
   *
   * Stream labels come from the SELECTED program courses (unique streams),
   * using the ug/pgPrefix logic. Two streams are joined with " & "; three or
   * more fall back to commas with " & " before the last, so the name still
   * reads as English. Affiliation uses shortName if present. Regulation is
   * wrapped in parentheses.
   */
  const composedName = useMemo(() => {
    const docType = documentTypes.find((t) => String(t.id) === form.documentTypeId);
    const year = academicYears.find((y) => String(y.id) === form.academicYearId);
    const cls = classes.find((c) => String(c.id) === form.classId);
    const aff = affiliations.find((a) => (a.id ?? 0) === filters.affiliationId);
    const reg = regulationTypes.find((r) => (r.id ?? 0) === filters.regulationTypeId);

    const selectedCourses = programCourses.filter((p) => form.programCourseIds.includes(p.id));
    // Stream order in the composed name mirrors the sorted list — stream id ASC.
    const uniqueStreamIds = [
      ...new Set(selectedCourses.map((p) => p.streamId).filter((n): n is number => !!n)),
    ].sort((a, b) => a - b);
    const streamLabels = uniqueStreamIds
      .map((sid) => streams.find((x) => (x.id ?? 0) === sid))
      .filter((s): s is NonNullable<typeof s> => Boolean(s))
      .map((s) => streamLabel(s));

    let streamPart = "";
    if (streamLabels.length === 1) streamPart = streamLabels[0]!;
    else if (streamLabels.length === 2) streamPart = streamLabels.join(" & ");
    else if (streamLabels.length > 2) {
      streamPart = `${streamLabels.slice(0, -1).join(", ")} & ${streamLabels[streamLabels.length - 1]}`;
    }

    const affLabel = aff?.shortName || aff?.name;
    const regLabel = reg?.name;

    const parts: string[] = [];
    if (streamPart) parts.push(streamPart);
    if (cls?.name) parts.push(normalizeSemester(cls.name));
    if (affLabel) parts.push(affLabel);
    if (docType?.name) parts.push(docType.name);
    if (regLabel) parts.push(`(${regLabel})`);
    parts.push("Distribution");
    const yearPart = year?.year ? ` - ${year.year}` : "";
    return (parts.join(" ") + yearPart).trim();
  }, [
    documentTypes,
    academicYears,
    classes,
    programCourses,
    streams,
    affiliations,
    regulationTypes,
    filters.affiliationId,
    filters.regulationTypeId,
    form.documentTypeId,
    form.academicYearId,
    form.classId,
    form.programCourseIds,
    selectedLevelKind,
  ]);

  // Keep the Name input in sync with the computed default until the user
  // types — mirrors typical "smart default" behaviour without stealing focus
  // once they've committed to a custom label.
  useEffect(() => {
    if (nameDirty || !dialogOpen) return;
    if (form.name === composedName) return;
    setForm((f) => ({ ...f, name: composedName }));
  }, [dialogOpen, nameDirty, composedName, form.name]);

  /**
   * Edit-mode: back-derive the filter dropdowns from the stored program
   * courses so the courses list actually renders. The batch's affiliation /
   * regulation / course level are singular by construction (create-time
   * filters), so every stored course shares them; streams can be plural.
   *
   * We derive exactly once per edit session, tracked by a ref keyed on
   * `editingRow.id`. Without the ref, this would fight the user any time
   * they cleared a filter — the effect would re-derive and restore it.
   */
  const derivedForRowRef = useRef<number | null>(null);
  useEffect(() => {
    if (!editingRow || !dialogOpen) return;
    if (derivedForRowRef.current === editingRow.id) return;
    if (programCourses.length === 0) return; // wait for the list to load

    const selected = programCourses.filter((p) => editingRow.programCourseIds.includes(p.id));
    if (selected.length === 0) return;

    const uniq = <T,>(vals: (T | null | undefined)[]) => [
      ...new Set(vals.filter((v): v is T => v != null)),
    ];

    const affIds = uniq(selected.map((p) => p.affiliationId));
    const regIds = uniq(selected.map((p) => p.regulationTypeId));
    const lvlIds = uniq(selected.map((p) => p.courseLevelId));
    const strIds = uniq(selected.map((p) => p.streamId));

    setFilters({
      affiliationId: affIds.length === 1 ? affIds[0]! : null,
      regulationTypeId: regIds.length === 1 ? regIds[0]! : null,
      courseLevelId: lvlIds.length === 1 ? lvlIds[0]! : null,
      streamIds: strIds,
    });
    derivedForRowRef.current = editingRow.id;
  }, [editingRow, dialogOpen, programCourses]);

  // Reset the derivation gate when the dialog closes so re-opening the same
  // row later still re-populates cleanly.
  useEffect(() => {
    if (!dialogOpen) derivedForRowRef.current = null;
  }, [dialogOpen]);

  /**
   * Live promotion count for the sticky footer. Debounced 250ms so a fast
   * multi-toggle doesn't spam the server. Returns 0 for an incomplete scope
   * (missing AY / class / no courses) — the footer renders that as an em-dash.
   */
  const [promotionCount, setPromotionCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  useEffect(() => {
    if (!dialogOpen) return;
    const ay = form.academicYearId ? Number(form.academicYearId) : null;
    const cls = form.classId ? Number(form.classId) : null;
    const ids = form.programCourseIds;
    if (!ay || !cls || ids.length === 0) {
      setPromotionCount(null);
      setCountLoading(false);
      return;
    }
    setCountLoading(true);
    const handle = window.setTimeout(async () => {
      try {
        const n = await getPromotionCountForScope({
          academicYearId: ay,
          classId: cls,
          programCourseIds: ids,
        });
        setPromotionCount(n);
      } catch {
        setPromotionCount(null);
      } finally {
        setCountLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [dialogOpen, form.academicYearId, form.classId, form.programCourseIds]);

  const handleSave = () => {
    if (!form.documentTypeId) return toast.error("Pick the document type");
    if (!form.academicYearId) return toast.error("Pick the academic year");
    if (!form.classId) return toast.error("Pick the class");
    if (form.programCourseIds.length === 0) {
      return toast.error("Pick at least one program course");
    }
    if (examLinkedEnabled && !form.expectedArrivalDate) {
      return toast.error("Expected arrival is required when Exam-linked is on");
    }
    if (adminEnabled && !form.availableFromDate) {
      return toast.error("Available from is required when Administrative is on");
    }

    // The Name field is editable but auto-populates from composedName until the
    // user types. Fall back to composedName if they cleared it entirely.
    const nameToSend = form.name.trim() || composedName || `Batch #${Date.now()}`;
    const body: BatchReceiptUpsertBody = {
      name: nameToSend,
      documentTypeId: Number(form.documentTypeId),
      academicYearId: Number(form.academicYearId),
      classId: Number(form.classId),
      programCourseIds: form.programCourseIds,
      expectedArrivalDate: form.expectedArrivalDate || null,
      availableFromDate: form.availableFromDate || null,
      isArchived,
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

  // Bridge MultiSelect's string[] api with our number[] state.
  const asNums = (vals: string[]) => vals.map((v) => Number(v)).filter(Number.isFinite);

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
        <DialogContent className="flex h-[95vh] max-h-[95vh] w-[1440px] max-w-[98vw] flex-col gap-0 overflow-hidden p-0">
          <div className="border-b bg-background px-6 py-4">
            <DialogTitle className="flex items-center gap-2 text-lg">
              {editingRow ? (
                <Pencil className="h-5 w-5 rounded-md border border-slate-300 bg-slate-100 p-1 text-slate-700" />
              ) : (
                <PlusCircle className="h-5 w-5 text-emerald-600" />
              )}
              {editingRow ? "Edit batch receipt" : "New batch receipt"}
            </DialogTitle>
          </div>

          {/* Scrollable body — header and footer stay put. */}
          <div className="flex-1 overflow-y-auto px-6 pb-5 pt-5">
            {editingRow && editingRow.ledger.total > 0 && (
              <p className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                {scopeLocked
                  ? `This batch has ${editingRow.ledger.recorded} recorded document${editingRow.ledger.recorded === 1 ? "" : "s"} — the scope (document type, academic year, class, course level, streams, semester, affiliation, regulation) and the exam-linked toggle are fixed. Courses with recorded handovers can't be unchecked.`
                  : `This batch already has ${editingRow.ledger.total} ledger entries, so the document type, academic year and class are fixed — they define which students those entries belong to.`}
              </p>
            )}

            {/* Three columns: Scope | Narrowing + program courses | Dates + modes.
                Fixed outer widths keep the middle flexible without leaving right-side
                whitespace when the program-course rows are short. */}
            <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)_400px] lg:divide-x lg:divide-slate-200">
              {/* COLUMN 1 — SCOPE (dropdowns stacked) --------------------- */}
              <div className="flex min-w-0 flex-col gap-4 lg:pr-6">
                <SectionEyebrow>Scope</SectionEyebrow>
                <div className="grid gap-1.5">
                  <Label>Academic year</Label>
                  <Select
                    value={form.academicYearId}
                    disabled={scopeLocked}
                    onValueChange={(v) => setForm((f) => ({ ...f, academicYearId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((y) => (
                        <SelectItem key={y.id} value={String(y.id)}>
                          <span className="inline-flex items-center gap-2">
                            {y.year}
                            {y.isCurrentYear && (
                              <span
                                className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-1.5 py-[1px] text-[9px] font-medium uppercase tracking-wider text-emerald-700"
                                title="Current academic year"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Current
                              </span>
                            )}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Document type</Label>
                  <Select
                    value={form.documentTypeId}
                    disabled={scopeLocked}
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
                  <Label>Affiliation</Label>
                  <Select
                    value={filters.affiliationId ? String(filters.affiliationId) : ""}
                    disabled={scopeLocked}
                    onValueChange={(v) =>
                      setFilters((f) => ({ ...f, affiliationId: v ? Number(v) : null }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {affiliations.map((a) => (
                        <SelectItem key={a.id ?? 0} value={String(a.id ?? 0)}>
                          {a.shortName || a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Regulation</Label>
                  <Select
                    value={filters.regulationTypeId ? String(filters.regulationTypeId) : ""}
                    disabled={scopeLocked}
                    onValueChange={(v) =>
                      setFilters((f) => ({ ...f, regulationTypeId: v ? Number(v) : null }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {regulationTypes.map((r) => (
                        <SelectItem key={r.id ?? 0} value={String(r.id ?? 0)}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Name — auto-composed from the scope, editable. Once the user
                    types, the auto-sync stops (nameDirty). */}
                <div className="mt-1 grid gap-1.5 border-t pt-4">
                  <Label>Name</Label>
                  <Textarea
                    value={form.name}
                    placeholder={composedName || "Auto-fills from the scope"}
                    rows={3}
                    className="resize-none text-sm leading-snug"
                    onChange={(e) => {
                      setNameDirty(true);
                      setForm((f) => ({ ...f, name: e.target.value }));
                    }}
                  />
                  <span className="text-[11px] text-muted-foreground">
                    {nameDirty
                      ? "Custom name — clear the field to auto-generate again."
                      : "Auto-generated from the scope. Edit to override."}
                  </span>
                  {nameDirty && (
                    <button
                      type="button"
                      className="mt-0.5 self-start text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
                      onClick={() => {
                        setNameDirty(false);
                        setForm((f) => ({ ...f, name: composedName }));
                      }}
                    >
                      Reset to auto-generated
                    </button>
                  )}
                </div>
              </div>

              {/* COLUMN 2 — NARROWING + PROGRAM COURSES ------------------- */}
              <div className="flex min-w-0 flex-col gap-4 lg:px-6">
                <SectionEyebrow>Narrow &amp; choose courses</SectionEyebrow>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label>Course level</Label>
                    <Select
                      value={filters.courseLevelId ? String(filters.courseLevelId) : ""}
                      disabled={scopeLocked}
                      onValueChange={(v) =>
                        setFilters((f) => ({
                          ...f,
                          courseLevelId: v ? Number(v) : null,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {courseLevels.map((c) => (
                          <SelectItem key={c.id} value={String(c.id ?? 0)}>
                            {c.shortName || c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Streams</Label>
                    <MultiSelect
                      placeholder="All"
                      disabled={scopeLocked}
                      options={streams.map((s) => ({
                        value: String(s.id ?? 0),
                        label: streamLabel(s),
                      }))}
                      selectedOptions={filters.streamIds.map(String)}
                      onChange={(vals) => setFilters((f) => ({ ...f, streamIds: asNums(vals) }))}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Semester</Label>
                    <Select
                      value={form.classId}
                      disabled={scopeLocked}
                      onValueChange={(v) => setForm((f) => ({ ...f, classId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {trimSemester(c.name)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Program courses
                    </Label>
                    {scopeComplete && (
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        <span className="font-semibold text-foreground">
                          {form.programCourseIds.length}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-foreground">
                          {filteredProgramCourses.length}
                        </span>{" "}
                        matched
                      </span>
                    )}
                  </div>
                  <div className="flex h-[420px] flex-col gap-0.5 overflow-y-auto rounded-md border bg-slate-50 p-2">
                    {!scopeComplete ? (
                      <div className="flex h-full flex-col items-center justify-center gap-1.5 px-6 text-center">
                        <span className="text-xs font-medium text-slate-500">
                          Pick the scope first
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Program courses appear once academic year, document type, affiliation,
                          regulation, course level and at least one stream are set.
                        </span>
                      </div>
                    ) : filteredProgramCourses.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                        No program courses match these filters.
                      </div>
                    ) : (
                      filteredProgramCourses.map((p) => {
                        const recordedForCourse = recordedByCourse[p.id] ?? 0;
                        const isLocked = recordedForCourse > 0;
                        return (
                          <label
                            key={p.id}
                            className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm ${
                              isLocked
                                ? "cursor-not-allowed opacity-60"
                                : "cursor-pointer hover:bg-white"
                            }`}
                            title={
                              isLocked
                                ? `${recordedForCourse} recorded document${recordedForCourse === 1 ? "" : "s"} — this course can't be removed from the batch.`
                                : undefined
                            }
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-purple-600 disabled:cursor-not-allowed"
                              checked={form.programCourseIds.includes(p.id)}
                              disabled={isLocked}
                              onChange={() => toggleCourse(p.id)}
                            />
                            <span className="break-words">{p.shortName ?? p.name}</span>
                            {isLocked && (
                              <span className="ml-auto rounded-full border border-amber-300 bg-amber-50 px-1.5 py-[1px] text-[10px] font-medium text-amber-700">
                                {recordedForCourse} recorded
                              </span>
                            )}
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* COLUMN 3 — DATES + MODES --------------------------------- */}
              <div className="flex min-w-0 flex-col gap-4 lg:pl-6">
                <SectionEyebrow>Timing &amp; modes</SectionEyebrow>

                {/* Prominent count — the primary consequence of the scope choices. */}
                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold tabular-nums leading-none">
                      {form.academicYearId && form.classId && form.programCourseIds.length > 0
                        ? countLoading
                          ? "…"
                          : promotionCount !== null
                            ? promotionCount.toLocaleString()
                            : "?"
                        : "?"}
                    </span>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Active students in scope
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label className={!examLinkedEnabled ? "text-muted-foreground" : undefined}>
                      Expected arrival
                    </Label>
                    <Input
                      type="date"
                      value={form.expectedArrivalDate}
                      disabled={!examLinkedEnabled}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, expectedArrivalDate: e.target.value }))
                      }
                    />
                    <span className="text-[11px] text-muted-foreground">
                      When the bundle is expected from the university.
                    </span>
                  </div>
                  <div className="grid gap-1.5">
                    <Label className={!examLinkedEnabled ? "text-muted-foreground" : undefined}>
                      Available from
                    </Label>
                    <Input
                      type="date"
                      value={form.availableFromDate}
                      disabled={!examLinkedEnabled}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, availableFromDate: e.target.value }))
                      }
                    />
                    <span className="text-[11px] text-muted-foreground">
                      First day the college can hand it over.
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex flex-col gap-3">
                  <div className="flex items-start gap-4 rounded-md border border-indigo-200 bg-indigo-50/50 px-4 py-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-sm font-semibold">Exam-linked</span>
                      <span className="text-[11px] leading-relaxed text-muted-foreground">
                        Records the bundle's arrival from the university.
                      </span>
                    </div>
                    <Switch
                      className={SWITCH_ON}
                      checked={examLinkedEnabled}
                      disabled={scopeLocked || modeMutation.isLoading}
                      onCheckedChange={handleExamLinkedChange}
                    />
                  </div>

                  <div className="flex items-start gap-4 rounded-md border bg-background px-4 py-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="text-sm font-semibold">Administrative</span>
                      <span className="text-[11px] leading-relaxed text-muted-foreground">
                        Marks the bundle ready to be handed out.
                      </span>
                    </div>
                    <Switch
                      className={SWITCH_ON}
                      checked={adminEnabled}
                      onCheckedChange={handleAdminChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky footer — live count on the LEFT of the actions, so it reads as
              the primary consequence of the scope choices above. */}
          <DialogFooter className="flex items-center justify-between gap-4 border-t bg-slate-50 px-6 py-4 sm:justify-between">
            <div className="flex items-center gap-8">
              {/* Archive switch — hides this batch's ledger entries from the
                  student-facing document ledger. Never deletes rows. */}
              <label className="flex cursor-pointer items-center gap-2">
                <Switch
                  className={SWITCH_ON}
                  checked={isArchived}
                  onCheckedChange={setIsArchived}
                />
                <span className="text-sm font-medium">Archived</span>
              </label>

              {form.academicYearId && form.classId && form.programCourseIds.length > 0 && (
                <div className="flex flex-col text-left">
                  <span className="flex items-baseline gap-2">
                    <span className="text-xl font-semibold tabular-nums text-foreground">
                      {countLoading
                        ? "…"
                        : promotionCount !== null
                          ? promotionCount.toLocaleString()
                          : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      active students match this scope
                    </span>
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-purple-600 text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={saving || !canSave}
                title={
                  canSave
                    ? undefined
                    : "Pick academic year, document type, semester and at least one program course."
                }
                onClick={handleSave}
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingRow ? "Save changes" : "Create"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Uppercase section label with a trailing hairline rule. */
function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[10.5px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
      <span>{children}</span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
