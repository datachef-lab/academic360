import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Archive,
  CheckCircle2,
  Eye,
  Filter,
  Loader2,
  NotebookText,
  RotateCcw,
  Search,
  Upload,
  UserX,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { StudentAvatar } from "@/components/student/StudentAvatar";
import { fetchStudentByUid } from "@/services/student";
import { useAuth } from "@/features/auth/providers/auth-provider";
import {
  getStudentLedger,
  markLedgerEntryCollected,
  type StudentLedgerRow,
} from "@/features/document-issuance/services/document-batch-receipt.service";
import { useDocumentsRealtime } from "@/features/document-issuance/hooks/useDocumentsRealtime";

const ALL = "__all__";

/**
 * Match the outline badges used on the Subject Paper Mapping page: soft
 * bg-<hue>-50 tint, a single 1px bg-<hue>-300 border, saturated text-700.
 * No dot, no icon — just the label. Palette per the current spec:
 *   COLLECTED → green, PENDING → red, UPLOADED → orange, ON_HOLD → purple,
 *   WAIVED → violet, EXPECTED → blue, NO_CHANGE → slate.
 */
const STATUS_STYLES: Record<StudentLedgerRow["status"], { label: string; className: string }> = {
  COLLECTED: {
    label: "Collected",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700",
  },
  PENDING: {
    label: "Pending",
    className: "border-red-300 bg-red-50 text-red-700",
  },
  UPLOADED: {
    label: "Uploaded",
    className: "border-orange-300 bg-orange-50 text-orange-700",
  },
  ON_HOLD: {
    label: "On hold",
    className: "border-purple-300 bg-purple-50 text-purple-700",
  },
  WAIVED: {
    label: "Waived",
    className: "border-violet-300 bg-violet-50 text-violet-700",
  },
  EXPECTED: {
    label: "Expected",
    className: "border-blue-300 bg-blue-50 text-blue-700",
  },
  NO_CHANGE: {
    label: "No change",
    className: "border-slate-300 bg-slate-50 text-slate-600",
  },
};

function StatusPill({ status }: { status: StudentLedgerRow["status"] }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-[2px] text-[11px] font-medium ${s.className}`}
    >
      {s.label}
    </span>
  );
}

function OriginPill({ isSelfSourced }: { isSelfSourced: boolean }) {
  return isSelfSourced ? (
    <span className="inline-flex items-center rounded-full border border-yellow-300 bg-yellow-50 px-2.5 py-[2px] text-[11px] font-medium text-yellow-800">
      Self
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-blue-300 bg-blue-50 px-2.5 py-[2px] text-[11px] font-medium text-blue-700">
      College
    </span>
  );
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * dd/mm/yyyy hh:mm am/pm — the format the passbook cells use for every
 * timestamp (entry date, collected date). Falls back to em-dash for the
 * null case so the cell height stays consistent.
 */
function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const day = pad2(d.getDate());
  const month = pad2(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours24 = d.getHours();
  const suffix = hours24 >= 12 ? "pm" : "am";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutes = pad2(d.getMinutes());
  return `${day}/${month}/${year}, ${pad2(hours12)}:${minutes} ${suffix}`;
}

/** DB stores class as "SEMESTER I" / "Semester I". Show only the roman
 *  numeral in the passbook's Semester column. */
function displaySemester(name: string | null): string {
  if (!name) return "—";
  const rest = name.replace(/^\s*semester\s+/i, "").trim();
  return rest || name;
}

/**
 * View URL for a ledger row. ID cards don't store their photo URL on
 * `document_ledger.link` — the front image lives on `id_card_issues` and is
 * streamed by `/api/idcard/issues/:id/front`. Every other row can use the
 * plain `link` field the ledger already carries.
 */
function resolveViewUrl(r: StudentLedgerRow): string | null {
  if (r.documentTypeCode === "ID_CARD" && r.idCardIssueId) {
    return `/api/idcard/issues/${r.idCardIssueId}/front`;
  }
  return r.link || null;
}

/** All cells share the same border treatment for the "grid" passbook look. */
const CELL = "border border-slate-200 align-middle";

/** Small indigo pill for the Semester column — distinct hue from Status
 *  (multi-colour) and Origin (yellow/blue). */
function SemesterBadge({ label }: { label: string }) {
  if (label === "—") return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center rounded-full border border-indigo-300 bg-indigo-50 px-2.5 py-[2px] text-[11px] font-semibold text-indigo-700 tabular-nums">
      {label}
    </span>
  );
}

/** Provided-by cell/row — plain name, em-dash when unset. */
function ProvidedByBadge({ name }: { name: string | null }) {
  if (!name) return <span className="text-muted-foreground">—</span>;
  return <span className="text-sm">{name}</span>;
}

export default function StudentLedgerPage() {
  const [uidInput, setUidInput] = useState("");
  const [searchUid, setSearchUid] = useState("");

  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [typeFilter, setTypeFilter] = useState<string>(ALL);
  const [yearFilter, setYearFilter] = useState<string>(ALL);
  const [originFilter, setOriginFilter] = useState<string>(ALL);
  // Passbook opens focused on university-issued documents — that's the
  // day-to-day handover surface. Staff can switch to COLLEGE or ALL from
  // the filter dialog.
  const [issuingAuthorityFilter, setIssuingAuthorityFilter] = useState<string>("UNIVERSITY");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  /** Row currently awaiting a "Collect" confirmation in the dialog. */
  const [confirmRow, setConfirmRow] = useState<StudentLedgerRow | null>(null);
  const { user: authUser } = useAuth();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadTarget, setUploadTarget] = useState<StudentLedgerRow | null>(null);

  const activeFilterCount = [
    statusFilter !== ALL,
    typeFilter !== ALL,
    yearFilter !== ALL,
    originFilter !== ALL,
    issuingAuthorityFilter !== ALL,
    includeArchived,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setStatusFilter(ALL);
    setTypeFilter(ALL);
    setYearFilter(ALL);
    setOriginFilter(ALL);
    setIssuingAuthorityFilter("UNIVERSITY");
    setIncludeArchived(false);
  };

  const studentQuery = useQuery({
    queryKey: ["student-ledger-student", searchUid],
    enabled: Boolean(searchUid),
    queryFn: () => fetchStudentByUid(searchUid),
    retry: false,
  });
  const student = studentQuery.data;

  const ledgerQuery = useQuery({
    queryKey: ["student-ledger", student?.id],
    enabled: Boolean(student?.id),
    queryFn: () => getStudentLedger(student!.id!),
  });

  // Live sync: any ledger write for this student (collect / upload / issue /
  // top-up generation) on any backend node invalidates the passbook query,
  // so a hand-over made by staff-B appears on staff-A's screen without a
  // reload. Global documents events also invalidate — they carry hints that
  // could touch this student without knowing it upfront.
  useDocumentsRealtime({ studentId: student?.id ?? null });

  const queryClient = useQueryClient();
  const collectMutation = useMutation({
    mutationFn: (ledgerId: number) => markLedgerEntryCollected(ledgerId),
    onSuccess: async (result) => {
      if (result?.alreadyCollected) {
        toast.warning("Already collected — nothing to do.");
      } else {
        toast.success("Marked as collected.");
      }
      setConfirmRow(null);
      if (student?.id) {
        await queryClient.invalidateQueries({ queryKey: ["student-ledger", student.id] });
      }
    },
    onError: () => toast.error("Could not mark this entry as collected."),
  });

  const openUploadPicker = (row: StudentLedgerRow) => {
    setUploadTarget(row);
    // The hidden file input is shared; reset value so picking the same file
    // twice in a row still triggers onChange.
    if (uploadInputRef.current) uploadInputRef.current.value = "";
    uploadInputRef.current?.click();
  };
  const handleUploadFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    // Upload endpoint is not wired yet — surface the selection so the flow is
    // debuggable; the actual POST lands in a follow-up.
    toast.info(
      `Selected "${file.name}" for ${uploadTarget.documentTypeName}. Upload endpoint wiring is pending.`,
    );
    setUploadTarget(null);
  };

  const rawRows = ledgerQuery.data ?? [];

  const uniqueTypes = useMemo(
    () =>
      [...new Map(rawRows.map((r) => [r.documentTypeId, r.documentTypeName])).entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [rawRows],
  );
  const uniqueYears = useMemo(
    () => [...new Set(rawRows.map((r) => r.academicYear).filter(Boolean) as string[])],
    [rawRows],
  );

  const filteredRows = useMemo(() => {
    return rawRows.filter((r) => {
      if (statusFilter !== ALL && r.status !== statusFilter) return false;
      if (typeFilter !== ALL && String(r.documentTypeId) !== typeFilter) return false;
      if (yearFilter !== ALL && r.academicYear !== yearFilter) return false;
      if (originFilter === "SELF" && !r.isSelfSourced) return false;
      if (originFilter === "COLLEGE" && r.isSelfSourced) return false;
      if (issuingAuthorityFilter !== ALL && r.issuingAuthority !== issuingAuthorityFilter)
        return false;
      if (!includeArchived && r.isBatchArchived) return false;
      return true;
    });
  }, [
    rawRows,
    statusFilter,
    typeFilter,
    yearFilter,
    originFilter,
    issuingAuthorityFilter,
    includeArchived,
  ]);

  const totals = useMemo(() => {
    const t = { total: 0, collected: 0, pending: 0 };
    for (const r of filteredRows) {
      t.total++;
      if (r.status === "COLLECTED") t.collected++;
      if (r.status === "PENDING") t.pending++;
    }
    return t;
  }, [filteredRows]);

  const handleSearch = () => {
    const uid = uidInput.trim();
    if (!uid) return;
    setSearchUid(uid);
  };

  const notFound =
    Boolean(searchUid) && !studentQuery.isFetching && !student && studentQuery.isError;

  return (
    <div className="space-y-4 p-2 sm:p-4">
      {/* --------------- header: title + inline search + filter button ----------- */}
      <div className="flex flex-col gap-3 rounded-md border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center">
          <NotebookText className="h-9 w-9 shrink-0 rounded-md border border-slate-300 p-1.5 text-indigo-700" />
          <div className="min-w-0">
            <div className="text-lg font-semibold leading-tight">Student's Ledger</div>
            <div className="text-[11px] text-muted-foreground">
              Every document a student holds — issued, uploaded, collected.
            </div>
          </div>
        </div>

        <form
          className="flex w-full items-center gap-2 sm:w-auto"
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
        >
          <div className="relative w-full sm:w-[320px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={uidInput}
              onChange={(e) => setUidInput(e.target.value)}
              className="pl-8 font-mono text-sm"
            />
          </div>
          <Button
            type="submit"
            disabled={!uidInput.trim() || studentQuery.isFetching}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {studentQuery.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span className="ml-2 hidden sm:inline">Open</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!student}
            onClick={() => setFiltersOpen(true)}
            className="relative"
          >
            <Filter className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Filter</span>
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </form>
      </div>

      {/* -------------------------------- states --------------------------------- */}
      {!searchUid ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-background py-16 text-slate-500">
          <NotebookText className="mb-2 h-8 w-8 text-slate-400" />
          <div className="text-sm">Enter a UID above to open a student's passbook.</div>
        </div>
      ) : studentQuery.isFetching ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading student…
        </div>
      ) : notFound ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed bg-background py-16 text-slate-500">
          <UserX className="mb-2 h-8 w-8 text-slate-400" />
          <div className="text-sm">
            No student found for UID <span className="font-mono">{searchUid}</span>.
          </div>
        </div>
      ) : student ? (
        <div className="overflow-hidden rounded-md border bg-background shadow-sm">
          {/* Student strip (passbook cover) */}
          <div className="flex flex-col justify-between gap-3 border-b bg-gradient-to-r from-indigo-50 to-white px-4 py-3 sm:flex-row sm:items-center">
            <div className="flex min-w-0 items-center gap-3">
              {/* Canonical avatar component — hits the same UID resolver and
                  falls back to coloured initials on 404. */}
              <StudentAvatar uid={student.uid} name={student.name} size="lg" />
              <div className="min-w-0">
                <div className="truncate text-base font-semibold">{student.name}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  UID <span className="font-mono">{student.uid}</span>
                  {student.programCourse?.name && <> · {student.programCourse.name}</>}
                  {student.currentPromotion?.class?.name && (
                    <> · Currently {student.currentPromotion.class.name}</>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs tabular-nums">
              <span className="flex items-baseline gap-1 rounded-md border bg-white px-2 py-1">
                <span className="text-sm font-semibold">{totals.total}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Records
                </span>
              </span>
              <span className="flex items-baseline gap-1 rounded-md border border-emerald-500/25 bg-emerald-50 px-2 py-1">
                <span className="text-sm font-semibold text-emerald-700">{totals.collected}</span>
                <span className="text-[10px] uppercase tracking-wider text-emerald-700/80">
                  Collected
                </span>
              </span>
              <span className="flex items-baseline gap-1 rounded-md border border-amber-500/25 bg-amber-50 px-2 py-1">
                <span className="text-sm font-semibold text-amber-700">{totals.pending}</span>
                <span className="text-[10px] uppercase tracking-wider text-amber-700/80">
                  Pending
                </span>
              </span>
            </div>
          </div>

          {/* Body */}
          {ledgerQuery.isFetching ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading ledger…
            </div>
          ) : ledgerQuery.isError ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-red-700">
              <div className="font-medium">Could not load the student's ledger.</div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => ledgerQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : rawRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-16 text-slate-500">
              <NotebookText className="mb-1 h-8 w-8 text-slate-400" />
              <div className="text-sm">No entries in this passbook yet.</div>
              <div className="text-[11px] text-muted-foreground">
                Records appear as batches are generated and documents are uploaded or collected.
              </div>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
              <div>No entries match the current filters.</div>
              {issuingAuthorityFilter === "UNIVERSITY" && (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="text-xs">
                    Passbook opens on <strong>university-issued</strong> documents by default.
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIssuingAuthorityFilter(ALL)}
                  >
                    Show all documents
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-700">
                  <tr>
                    <th className={`${CELL} w-[90px] px-3 py-3 text-center`}>Year / Sem</th>
                    <th className={`${CELL} w-1/2 px-4 py-3 text-left`}>Document</th>
                    <th className={`${CELL} w-1/2 px-4 py-3 text-center`}>Source</th>
                    <th className={`${CELL} w-[100px] px-3 py-3 text-center`}>Status</th>
                    <th className={`${CELL} w-[200px] px-3 py-3 text-center`}>Recorded</th>
                    <th className={`${CELL} w-[90px] px-2 py-3 text-center`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredRows.map((r) => {
                    // Row action logic:
                    //   - college-issued + PENDING → Collect (opens confirm)
                    //     Gated on the parent batch's ADMINISTRATIVE mode
                    //     being enabled — the college hasn't marked the
                    //     batch ready to distribute until then.
                    //   - self-sourced (any status) → Upload (also acts as
                    //     re-upload for rows already UPLOADED).
                    //   - Eye shows independently whenever a file exists.
                    const batchReadyToDistribute = r.batchAdministrativeEnabled !== false;
                    const canCollect =
                      !r.isSelfSourced && r.status === "PENDING" && batchReadyToDistribute;
                    const canUpload = r.isSelfSourced;
                    const viewUrl = resolveViewUrl(r);
                    // "Recorded at" only carries a meaningful timestamp once
                    // the row has materialised. Pending/Expected/On-hold/
                    // No-change rows have nothing to record yet, so show a
                    // dash rather than a misleading createdAt.
                    const recordedAt =
                      r.status === "COLLECTED"
                        ? r.collectedAt
                        : r.status === "UPLOADED"
                          ? r.createdAt
                          : r.status === "WAIVED"
                            ? r.updatedAt
                            : null;
                    return (
                      <tr key={r.ledgerId} className="hover:bg-indigo-50/40">
                        <td className={`${CELL} px-4 py-2.5 text-center`}>
                          <div className="flex flex-col items-center gap-1">
                            <span className="whitespace-nowrap text-sm font-medium tabular-nums">
                              {r.academicYear ?? "—"}
                            </span>
                            <SemesterBadge label={displaySemester(r.className)} />
                          </div>
                        </td>
                        <td className={`${CELL} px-4 py-2.5`}>
                          <div className="font-medium">{r.documentTypeName}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <OriginPill isSelfSourced={r.isSelfSourced} />
                          </div>
                        </td>
                        <td className={`${CELL} px-4 py-2.5 text-center`}>
                          {r.batchReceiptName ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs leading-snug break-words">
                                {r.batchReceiptName}
                              </span>
                              {r.isBatchArchived && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-1.5 py-[1px] text-[10px] text-slate-500">
                                  <Archive className="h-2.5 w-2.5" />
                                  Archived
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="italic text-muted-foreground">Direct</span>
                          )}
                        </td>
                        <td className={`${CELL} px-4 py-2.5 text-center`}>
                          <StatusPill status={r.status} />
                        </td>
                        <td className={`${CELL} px-4 py-2.5 text-center`}>
                          {recordedAt || r.providedByName ? (
                            <div className="flex flex-col items-center gap-1">
                              {r.providedByName && <ProvidedByBadge name={r.providedByName} />}
                              {recordedAt && (
                                <span className="whitespace-nowrap text-xs tabular-nums">
                                  {formatDateTime(recordedAt)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className={`${CELL} px-3 py-2 text-center`}>
                          <div className="flex items-center justify-center gap-1.5">
                            {viewUrl && (
                              <a
                                href={viewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-indigo-700"
                                title="Open document in a new tab"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </a>
                            )}
                            {canCollect ? (
                              <button
                                type="button"
                                onClick={() => setConfirmRow(r)}
                                className="inline-flex h-7 items-center gap-1 rounded-md border border-emerald-500 bg-emerald-50 px-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                                title="Mark this document as collected"
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Collect
                              </button>
                            ) : canUpload ? (
                              <button
                                type="button"
                                onClick={() => openUploadPicker(r)}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-purple-500 bg-purple-50 text-purple-700 hover:bg-purple-100"
                                title="Upload the student's file"
                                aria-label="Upload"
                              >
                                <Upload className="h-3.5 w-3.5" />
                              </button>
                            ) : !viewUrl ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {/* ------------------------------ filter dialog ---------------------------- */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter passbook
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {(Object.keys(STATUS_STYLES) as Array<keyof typeof STATUS_STYLES>).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_STYLES[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Origin</Label>
              <Select value={originFilter} onValueChange={setOriginFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Any origin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any origin</SelectItem>
                  <SelectItem value="COLLEGE">College-issued</SelectItem>
                  <SelectItem value="SELF">Self-sourced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Issuing authority</Label>
              <Select value={issuingAuthorityFilter} onValueChange={setIssuingAuthorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Any issuing authority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any issuing authority</SelectItem>
                  <SelectItem value="UNIVERSITY">University</SelectItem>
                  <SelectItem value="COLLEGE">College</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Document type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All document types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All document types</SelectItem>
                  {uniqueTypes.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Academic year</Label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All years</SelectItem>
                  {uniqueYears.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="mt-1 inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 accent-indigo-600"
                checked={includeArchived}
                onChange={(e) => setIncludeArchived(e.target.checked)}
              />
              <Archive className="h-3.5 w-3.5" />
              Include archived batches
            </label>
          </div>

          <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              type="button"
              className="bg-indigo-600 text-white hover:bg-indigo-700"
              onClick={() => setFiltersOpen(false)}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------- collect: confirmation dialog --------------------- */}
      <Dialog open={confirmRow !== null} onOpenChange={(open) => !open && setConfirmRow(null)}>
        <DialogContent className="max-w-md">
          {confirmRow ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Confirm collection
                </DialogTitle>
              </DialogHeader>

              <div className="mt-2 space-y-3 text-sm">
                <p>
                  Mark <strong>{confirmRow.documentTypeName}</strong> as collected for{" "}
                  <strong>{student?.name ?? "this student"}</strong>?
                </p>
                <div className="rounded-md border bg-slate-50 px-3 py-2 text-xs">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Recording as provided by
                  </div>
                  <div className="mt-1 font-medium">{authUser?.name ?? "the current user"}</div>
                </div>
              </div>

              <DialogFooter className="mt-3 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmRow(null)}
                  disabled={collectMutation.isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  disabled={collectMutation.isLoading}
                  onClick={() => collectMutation.mutate(confirmRow.ledgerId)}
                >
                  {collectMutation.isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Confirm collect
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Hidden file input driven by the row-level Upload buttons. */}
      <input
        ref={uploadInputRef}
        type="file"
        className="hidden"
        onChange={handleUploadFileSelected}
      />
    </div>
  );
}
