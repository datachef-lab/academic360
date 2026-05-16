import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "@/utils/api";
import { getFeeStudentMappingsByStudentId } from "@/services/fees-api";
import type { FeeStudentMappingDto } from "@repo/db/dtos/fees";
import { cn } from "@/lib/utils";
import { ExternalLink, Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useAuth } from "@/features/auth/providers/auth-provider";

/** Sentence-case class/semester labels; Roman numerals stay uppercase (e.g. Semester II). */
function formatSemesterBadgeLabel(name: string | undefined | null): string {
  if (!name?.trim()) return "";
  const ROMAN = /^(M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3}))$/i;
  return name
    .trim()
    .split(/\s+/)
    .map((w) =>
      ROMAN.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
    )
    .join(" ");
}

function isFeeMappingPaidUi(status: string | undefined): boolean {
  const s = (status || "").trim().toUpperCase();
  return s === "SUCCESS" || s === "COMPLETED" || s === "DONE" || s === "PAID";
}

function parseMappingDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function formatDateDdMmYyyy(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB");
}

type FeeOverviewHeadline = "Pending" | "Paid latest" | "Upcoming latest";

function feeMappingSemesterLabel(m: FeeStudentMappingDto): string {
  const promotion = m.feeGroupPromotionMappings?.[0]?.promotion;
  return promotion?.class?.name || m.feeStructure?.class?.name || "—";
}

function feeMappingPayable(m: FeeStudentMappingDto): number {
  return Number(m.totalPayable ?? 0);
}

function pickLatestPaidMappingByTxn(mappings: FeeStudentMappingDto[]): FeeStudentMappingDto | null {
  const paid = mappings.filter((m) => isFeeMappingPaidUi(m.paymentStatus));
  if (!paid.length) return null;
  let best: FeeStudentMappingDto = paid[0]!;
  let bestT = -1;
  for (const m of paid) {
    const t = parseMappingDate(m.transactionDate as string | Date | null);
    const ms = t ? t.getTime() : -1;
    if (ms > bestT) {
      bestT = ms;
      best = m;
    }
  }
  return best;
}

/**
 * When fee mappings exist: Pending (owed / overdue), Upcoming latest (next window not open yet),
 * or Paid latest (all settled). Includes the row used for semester + amount on the card.
 */
function computeFeeCardSummary(mappings: FeeStudentMappingDto[]): {
  headline: FeeOverviewHeadline;
  detail: string | null;
  focusMapping: FeeStudentMappingDto;
} | null {
  if (!mappings.length) return null;

  const unpaid = mappings.filter((m) => !isFeeMappingPaidUi(m.paymentStatus));
  const now = Date.now();

  const windowStart = (m: FeeStudentMappingDto) =>
    parseMappingDate(m.feeStructureInstallment?.startDate ?? m.feeStructure?.startDate ?? null);
  const windowEnd = (m: FeeStudentMappingDto) =>
    parseMappingDate(m.feeStructureInstallment?.endDate ?? m.feeStructure?.endDate ?? null);

  const isOverdue = (m: FeeStudentMappingDto) => {
    const end = windowEnd(m);
    if (end && end.getTime() < now) return true;
    const start = windowStart(m);
    if (start && start.getTime() <= now && !end) return true;
    return false;
  };

  if (unpaid.length === 0) {
    const focusMapping = pickLatestPaidMappingByTxn(mappings) ?? mappings[0]!;
    let latest: Date | null = null;
    for (const m of mappings) {
      const t = parseMappingDate(m.transactionDate as string | Date | null);
      if (t && (!latest || t.getTime() > latest.getTime())) latest = t;
    }
    return {
      headline: "Paid latest",
      detail: latest
        ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(
            latest,
          )
        : null,
      focusMapping,
    };
  }

  const anyOverdue = unpaid.some(isOverdue);
  const allFuture = unpaid.every((m) => {
    const start = windowStart(m);
    return start != null && start.getTime() > now;
  });

  if (anyOverdue || !allFuture) {
    const focusMapping = unpaid.find(isOverdue) ?? unpaid[0]!;
    return { headline: "Pending", detail: null, focusMapping };
  }

  const withStart = unpaid
    .map((m) => ({ m, s: windowStart(m) }))
    .filter((x): x is { m: FeeStudentMappingDto; s: Date } => x.s != null)
    .sort((a, b) => a.s.getTime() - b.s.getTime());
  const next = withStart[0]?.s;
  const focusMapping = withStart[0]?.m ?? unpaid[0]!;
  return {
    headline: "Upcoming latest",
    detail: next
      ? `Opens ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(next)}`
      : null,
    focusMapping,
  };
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserStatusMappingRow {
  id: number;
  sessionId: number;
  userId: number;
  studentId: number | null;
  promotionId: number | null;
  suspendedReason: string | null;
  suspendedTillDate: string | null;
  remarks: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userStatusMaster: UserStatusMasterRow;
  session?: { id: number; name?: string; academicYearId?: number } | null;
  academicYear?: { id: number; year?: string; name?: string } | null;
  class?: { id: number; name?: string; type?: string } | null;
}

interface UserStatusMasterRow {
  id: number;
  status: string;
  tag: string;
  description: string;
  enrollmentStatus: string;
  remarks: string;
  domains: { domain: string }[];
  frequencies: { frequency: string }[];
  levels: { level: string }[];
}

interface PromotionRow {
  id: number;
  studentId: number;
  sessionId: number;
  classId: number;
  dateOfJoining?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  remarks?: string | null;
  academicYear?: { id: number; year?: string; name?: string } | null;
  class?: { id: number; name?: string; type?: string } | null;
  appearTypeName?: string | null;
  /** Board / exam outcome; wired when API exposes it */
  result?: string | null;
}

interface OverviewTabProps {
  studentId?: number;
  userId?: number;
  /** For deep-link to Student Fees search */
  studentUid?: string | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OverviewTab({ studentId, userId, studentUid }: OverviewTabProps) {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { availableAcademicYears } = useAcademicYear();
  const [filterAcademicYearId, setFilterAcademicYearId] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<UserStatusMappingRow | null>(null);

  // ── Fetch user-status-mappings ──
  const {
    data: mappings,
    isLoading,
    isError,
    refetch,
  } = useQuery<UserStatusMappingRow[]>({
    queryKey: ["user-status-mappings", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const res = await axiosInstance.get(`/api/user-statuses/student/${studentId}`);
      return res.data?.payload ?? [];
    },
    enabled: !!studentId && studentId > 0,
  });

  // ── Fetch user-status-masters ──
  const { data: masters } = useQuery<UserStatusMasterRow[]>({
    queryKey: ["user-status-masters"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/user-statuses/masters");
      return res.data?.payload ?? [];
    },
  });

  // ── Fetch promotions for this student ──
  const {
    data: promotionsData,
    isLoading: promotionsLoading,
    isError: promotionsError,
  } = useQuery<{
    promotions: PromotionRow[];
    meta: { totalSemesters: number | null; completedSemesters: number };
  }>({
    queryKey: ["student-promotions", studentId],
    queryFn: async () => {
      if (!studentId)
        return { promotions: [], meta: { totalSemesters: null, completedSemesters: 0 } };
      const res = await axiosInstance.get(`/api/user-statuses/student/${studentId}/promotions`);
      return {
        promotions: res.data?.payload ?? [],
        meta: res.data?.meta ?? { totalSemesters: null, completedSemesters: 0 },
      };
    },
    enabled: !!studentId && studentId > 0,
  });

  const {
    data: feeMappingsRes,
    isLoading: feeMappingsLoading,
    isError: feeMappingsError,
  } = useQuery({
    queryKey: ["student-fee-mappings", studentId],
    queryFn: async () => {
      if (!studentId) return [] as FeeStudentMappingDto[];
      const res = await getFeeStudentMappingsByStudentId(studentId);
      return res.payload ?? [];
    },
    enabled: !!studentId && studentId > 0,
  });

  const feeMappings = feeMappingsRes ?? [];
  const feeCardSummary = useMemo(() => computeFeeCardSummary(feeMappings), [feeMappings]);

  const promotions = promotionsData?.promotions ?? [];
  const isEligibleForAlumni =
    promotionsData?.meta?.totalSemesters &&
    promotionsData?.meta?.completedSemesters >= promotionsData.meta.totalSemesters;

  // ── Filter mappings by academic year ──
  const filteredMappings = useMemo(() => {
    if (!mappings) return [];
    if (filterAcademicYearId === "all") return mappings;
    return mappings.filter((m) => String(m.academicYear?.id) === filterAcademicYearId);
  }, [mappings, filterAcademicYearId]);

  // ── Check if there's any active terminal status ──
  const hasActiveTerminalStatus = useMemo(() => {
    if (!mappings) return false;
    const terminalTags = ["alumni", "transfer certificate", "tc", "cancel"];
    return mappings.some(
      (m) =>
        m.isActive &&
        terminalTags.some((tag) => m.userStatusMaster.tag.toLowerCase().includes(tag)),
    );
  }, [mappings]);

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6">
      {/* Fee summary card — compact width */}
      <div className="w-full max-w-xs sm:max-w-sm">
        <Card className="shadow-sm border">
          <CardHeader className="p-2.5 sm:p-3 pb-2">
            <CardTitle className="text-sm font-semibold">Fee details</CardTitle>
          </CardHeader>
          <CardContent className="p-2.5 sm:p-3 pt-0 space-y-1.5 text-xs sm:text-sm">
            {feeMappingsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                Loading fee summary…
              </div>
            ) : feeMappingsError ? (
              <p className="text-red-500">Could not load fee data.</p>
            ) : feeCardSummary ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] sm:text-xs font-medium",
                      feeCardSummary.headline === "Pending" &&
                        "bg-yellow-50 text-yellow-900 border-yellow-300",
                      feeCardSummary.headline === "Paid latest" &&
                        "bg-green-50 text-green-900 border-green-300",
                      feeCardSummary.headline === "Upcoming latest" &&
                        "bg-sky-50 text-sky-900 border-sky-300",
                    )}
                  >
                    {feeCardSummary.headline}
                  </Badge>
                </div>
                <p className="text-sm text-foreground">
                  <span className="font-medium">
                    {formatSemesterBadgeLabel(feeMappingSemesterLabel(feeCardSummary.focusMapping))}
                  </span>
                  <span className="text-muted-foreground"> · </span>
                  <span className="font-semibold tabular-nums">
                    ₹{feeMappingPayable(feeCardSummary.focusMapping).toLocaleString("en-IN")}
                  </span>
                </p>
                {feeCardSummary.detail ? (
                  <p className="text-muted-foreground">{feeCardSummary.detail}</p>
                ) : null}
                {studentUid ? (
                  <Link
                    to={`/dashboard/fees/student-fees?search=${encodeURIComponent(studentUid)}`}
                    className="inline-flex items-center gap-1 font-medium text-violet-700 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View all fees
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground">No fee mappings for this student.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Promotion history */}
      <div>
        <h3 className="text-sm sm:text-base font-semibold mb-3">Promotion history</h3>
        {promotionsLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading promotions…</span>
          </div>
        ) : promotionsError ? (
          <p className="text-sm text-red-500 py-4">Failed to load promotion history.</p>
        ) : promotions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No promotion records found.</p>
        ) : (
          <div className="rounded-md border border-gray-200 overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead className="text-xs font-semibold text-gray-600 w-12">Sr.</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 min-w-[120px]">
                      Academic year
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 min-w-[120px]">
                      Semester
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 min-w-[140px]">
                      Appear Type
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 min-w-[100px]">
                      Result
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 min-w-[130px]">
                      Start date
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 min-w-[130px]">
                      End date
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 min-w-[160px]">
                      Remarks
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.map((p, index) => (
                    <TableRow key={p.id} className="border-b border-gray-200">
                      <TableCell className="text-sm text-gray-800">{index + 1}</TableCell>
                      <TableCell className="text-sm">
                        {p.academicYear?.year || p.academicYear?.name || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.class?.name ? (
                          <Badge
                            variant="outline"
                            className="text-xs border-orange-300 text-orange-800 bg-orange-50 font-normal"
                          >
                            {formatSemesterBadgeLabel(p.class.name)}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{p.appearTypeName?.trim() || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.result?.trim() || "Pending"}
                      </TableCell>
                      <TableCell className="text-sm">{formatDateDdMmYyyy(p.startDate)}</TableCell>
                      <TableCell className="text-sm">{formatDateDdMmYyyy(p.endDate)}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[240px] truncate">
                        {p.remarks?.trim() || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* User Status History — no Card wrapper */}
      <div>
        <h3 className="text-sm sm:text-base font-semibold mb-3">User Status History</h3>

        {/* Filter bar + Add button — above table */}
        <div className="flex items-center justify-between mb-3 gap-4">
          {/* Left: Academic Year Filter */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-500 whitespace-nowrap">Academic Year:</Label>
            <Select value={filterAcademicYearId} onValueChange={setFilterAcademicYearId}>
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableAcademicYears.map((ay) => (
                  <SelectItem key={ay.id} value={String(ay.id)}>
                    {ay.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Right: Add Button */}
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white text-xs gap-1"
            onClick={() => {
              setEditingMapping(null);
              setDialogOpen(true);
            }}
            disabled={hasActiveTerminalStatus}
            title={
              hasActiveTerminalStatus
                ? "Cannot add new status when a terminal status (Alumni/TC/Dropped/Cancelled) is active"
                : ""
            }
          >
            <Plus className="h-3.5 w-3.5" />
            Add Status
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading status history...</span>
          </div>
        ) : isError ? (
          <p className="text-sm text-red-500 py-4">Failed to load status history.</p>
        ) : !mappings || mappings.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No status records found.</p>
        ) : (
          <div className="rounded-md border border-gray-200 overflow-hidden shadow-none">
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50/80">
                    <TableHead
                      style={{
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                        minWidth: "60px",
                      }}
                      className="text-xs font-semibold text-gray-600"
                    >
                      Sr. No.
                    </TableHead>
                    <TableHead
                      style={{
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                        minWidth: "100px",
                      }}
                      className="text-xs font-semibold text-gray-600"
                    >
                      Status
                    </TableHead>
                    <TableHead
                      style={{
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                        minWidth: "180px",
                      }}
                      className="text-xs font-semibold text-gray-600"
                    >
                      Tag
                    </TableHead>
                    <TableHead
                      style={{
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                        minWidth: "120px",
                      }}
                      className="text-xs font-semibold text-gray-600"
                    >
                      Academic Year
                    </TableHead>
                    <TableHead
                      style={{
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                        minWidth: "100px",
                      }}
                      className="text-xs font-semibold text-gray-600"
                    >
                      Semester
                    </TableHead>
                    <TableHead
                      style={{
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                        minWidth: "200px",
                      }}
                      className="text-xs font-semibold text-gray-600"
                    >
                      Remarks
                    </TableHead>
                    <TableHead
                      style={{
                        padding: "12px 8px",
                        borderRight: "1px solid #e5e7eb",
                        minWidth: "150px",
                      }}
                      className="text-xs font-semibold text-gray-600"
                    >
                      Suspended Till
                    </TableHead>
                    <TableHead
                      style={{ padding: "12px 8px", minWidth: "80px" }}
                      className="text-xs font-semibold text-gray-600 text-center"
                    >
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMappings.map((mapping, index) => (
                    <TableRow
                      key={mapping.id}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${!mapping.isActive ? "opacity-60" : ""}`}
                    >
                      <TableCell
                        style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}
                        className={`text-sm ${!mapping.isActive ? "line-through" : ""}`}
                      >
                        {index + 1}
                      </TableCell>
                      <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}>
                        <div className={!mapping.isActive ? "line-through" : ""}>
                          {mapping.userStatusMaster.status === "ACTIVE" ? (
                            <Badge className="bg-green-500 text-white hover:bg-green-600 text-xs">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500 text-white hover:bg-red-600 text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}>
                        <div className={!mapping.isActive ? "line-through" : ""}>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${getTagBadgeStyle(mapping.userStatusMaster.tag)} w-fit`}
                            >
                              {mapping.userStatusMaster.tag}
                            </Badge>
                            <span className="text-[10px] text-gray-400">
                              {new Date(mapping.updatedAt).toLocaleDateString("en-GB", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              })}
                              ,{" "}
                              {new Date(mapping.updatedAt).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}>
                        <div className={!mapping.isActive ? "line-through" : ""}>
                          {mapping.academicYear?.year || mapping.academicYear?.name ? (
                            <Badge
                              variant="outline"
                              className="text-xs border-blue-300 text-blue-700 bg-blue-50"
                            >
                              {mapping.academicYear.year || mapping.academicYear.name}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}>
                        <div className={!mapping.isActive ? "line-through" : ""}>
                          {mapping.class?.name ? (
                            <Badge
                              variant="outline"
                              className="text-xs border-orange-300 text-orange-700 bg-orange-50"
                            >
                              {mapping.class.name.replace(/SEMESTER\s*/i, "")}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}>
                        <div className={!mapping.isActive ? "line-through" : ""}>
                          <span className="text-xs text-gray-600">
                            {mapping.remarks || mapping.suspendedReason || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell style={{ padding: "12px 8px", borderRight: "1px solid #e5e7eb" }}>
                        <div className={!mapping.isActive ? "line-through" : ""}>
                          {mapping.suspendedTillDate ? (
                            <span className="text-xs text-gray-600">
                              {new Date(mapping.suspendedTillDate).toLocaleString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell style={{ padding: "12px 8px" }} className="text-center">
                        <button
                          className={`p-1.5 rounded-md transition-colors ${
                            !mapping.isActive
                              ? "cursor-not-allowed opacity-40"
                              : "hover:bg-gray-100 cursor-pointer"
                          }`}
                          onClick={() => {
                            if (mapping.isActive) {
                              setEditingMapping(mapping);
                              setDialogOpen(true);
                            }
                          }}
                          disabled={!mapping.isActive}
                        >
                          <Pencil className="h-4 w-4 text-gray-600" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Status Dialog */}
      <AddStatusDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingMapping(null);
        }}
        studentId={studentId}
        userId={userId}
        byUserId={authUser?.id}
        masters={masters ?? []}
        promotions={promotions}
        existingMappings={mappings ?? []}
        editingMapping={editingMapping}
        isEligibleForAlumni={!!isEligibleForAlumni}
        onSuccess={() => {
          refetch();
          setEditingMapping(null);
          queryClient.invalidateQueries({ queryKey: ["user-status-mappings", studentId] });
        }}
      />
    </div>
  );
}

// ─── Add Status Dialog ───────────────────────────────────────────────────────

interface AddStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId?: number;
  userId?: number;
  byUserId?: number;
  masters: UserStatusMasterRow[];
  promotions: PromotionRow[];
  existingMappings: UserStatusMappingRow[];
  editingMapping: UserStatusMappingRow | null;
  isEligibleForAlumni: boolean;
  onSuccess: () => void;
}

function AddStatusDialog({
  open,
  onOpenChange,
  studentId,
  userId,
  byUserId,
  masters,
  promotions,
  existingMappings,
  editingMapping,
  isEligibleForAlumni,
  onSuccess,
}: AddStatusDialogProps) {
  const isEditMode = !!editingMapping;

  const [selectedMasterId, setSelectedMasterId] = useState<string>("");
  const [selectedPromotionId, setSelectedPromotionId] = useState<string>("");
  const [remarks, setRemarks] = useState("");
  const [suspendedTillDate, setSuspendedTillDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize form when editing
  useMemo(() => {
    if (editingMapping && open) {
      setSelectedMasterId(String(editingMapping.userStatusMaster.id));
      setSelectedPromotionId(editingMapping.promotionId ? String(editingMapping.promotionId) : "");
      setRemarks(editingMapping.remarks || "");
      setSuspendedTillDate(
        editingMapping.suspendedTillDate
          ? new Date(editingMapping.suspendedTillDate).toISOString().slice(0, 16)
          : "",
      );
      setIsActive(editingMapping.isActive);
    } else if (!editingMapping && open) {
      // Reset for create mode
      setSelectedMasterId("");
      setSelectedPromotionId("");
      setRemarks("");
      setSuspendedTillDate("");
      setIsActive(true);
    }
  }, [editingMapping, open]);

  // Only show masters with domain STUDENT
  const studentMasters = useMemo(() => {
    return masters.filter((m) => m.domains.some((d) => d.domain === "STUDENT"));
  }, [masters]);

  const selectedMaster = useMemo(() => {
    return studentMasters.find((m) => String(m.id) === selectedMasterId) ?? null;
  }, [studentMasters, selectedMasterId]);

  const selectedPromotion = useMemo(() => {
    return promotions.find((p) => String(p.id) === selectedPromotionId) ?? null;
  }, [promotions, selectedPromotionId]);

  // Filter out conflicting statuses based on selected promotion
  const availableMasters = useMemo(() => {
    // In edit mode, show all student masters
    if (isEditMode) return studentMasters;

    // Require batch selection first
    if (!selectedPromotion) return [];

    return studentMasters.filter((master) => {
      const masterTag = master.tag.toLowerCase();
      const isRegular = masterTag.includes("regular");
      const isCasual = masterTag.includes("casual");
      const isAlumni = masterTag.includes("alumni");

      // Filter out Alumni if student hasn't completed all semesters
      if (isAlumni && !isEligibleForAlumni) return false;

      // Check if Regular or Casual - they are mutually exclusive
      if (isRegular || isCasual) {
        const conflictingTag = isRegular ? "casual" : "regular";
        const hasConflict = existingMappings.some(
          (m) =>
            m.isActive &&
            m.class?.id === selectedPromotion.class?.id &&
            m.userStatusMaster.tag.toLowerCase().includes(conflictingTag),
        );
        if (hasConflict) return false;
      }

      // Check if this exact status already exists for this semester
      const alreadyExists = existingMappings.some(
        (m) =>
          m.isActive &&
          m.class?.id === selectedPromotion.class?.id &&
          m.userStatusMaster.id === master.id,
      );
      if (alreadyExists) return false;

      return true;
    });
  }, [studentMasters, selectedPromotion, existingMappings, isEditMode, isEligibleForAlumni]);

  const isSuspended = selectedMaster?.tag?.toLowerCase().includes("suspended") ?? false;

  // ── Client-side frequency validation ──
  const validateFrequency = (): string | null => {
    if (!selectedMaster) return "Please select a status.";
    if (!selectedPromotion) return "Please select a batch.";

    // Suspended must have a till-date and reason
    if (isSuspended && !suspendedTillDate) {
      return "Suspended till date is required when assigning a Suspended status.";
    }
    if (isSuspended && !remarks.trim()) {
      return "Reason is required when assigning a Suspended status.";
    }

    const frequencies = selectedMaster.frequencies.map((f) => f.frequency);

    // ONLY_ONCE: check if this master already exists for this user (only active)
    if (frequencies.includes("ONLY_ONCE")) {
      const exists = existingMappings.some(
        (m) => m.isActive && m.userStatusMaster.id === selectedMaster.id,
      );
      if (exists) {
        return `"${selectedMaster.tag}" can only be assigned once. It already exists for this student.`;
      }
    }

    // PER_ACADEMIC_YEAR: check if same master + same academic year already exists (only active)
    if (frequencies.includes("PER_ACADEMIC_YEAR") && selectedPromotion?.academicYear?.id) {
      const exists = existingMappings.some(
        (m) =>
          m.isActive &&
          m.userStatusMaster.id === selectedMaster.id &&
          m.academicYear?.id === selectedPromotion.academicYear?.id,
      );
      if (exists) {
        return `"${selectedMaster.tag}" already exists for academic year ${selectedPromotion.academicYear?.year || ""}.`;
      }
    }

    // PER_SEMESTER: check if same master + same class (via promotion) already exists (only active)
    if (frequencies.includes("PER_SEMESTER") && selectedPromotion?.class?.id) {
      const exists = existingMappings.some(
        (m) =>
          m.isActive &&
          m.userStatusMaster.id === selectedMaster.id &&
          m.class?.id === selectedPromotion.class?.id,
      );
      if (exists) {
        return `"${selectedMaster.tag}" already exists for semester ${selectedPromotion.class?.name || ""}.`;
      }
    }

    // Regular and Casual are mutually exclusive for the same semester
    const isRegular = selectedMaster.tag.toLowerCase().includes("regular");
    const isCasual = selectedMaster.tag.toLowerCase().includes("casual");

    if ((isRegular || isCasual) && selectedPromotion?.class?.id) {
      const conflictingTag = isRegular ? "casual" : "regular";
      const hasConflict = existingMappings.some(
        (m) =>
          m.isActive &&
          m.class?.id === selectedPromotion.class?.id &&
          m.userStatusMaster.tag.toLowerCase().includes(conflictingTag),
      );

      if (hasConflict) {
        const currentTag = isRegular ? "Regular" : "Casual";
        const existingTag = isRegular ? "Casual" : "Regular";
        return `Cannot add "${currentTag}" status. A "${existingTag}" status already exists for this semester. Only one of Regular or Casual is allowed per semester.`;
      }
    }

    // Check terminal status coexistence (only check active terminal statuses)
    const terminalTags = ["Alumni", "Taken Transfer Certificate (TC)", "Cancelled Admission"];
    const hasActiveTerminal = existingMappings.some(
      (m) => m.isActive && terminalTags.includes(m.userStatusMaster.tag),
    );
    if (hasActiveTerminal && terminalTags.includes(selectedMaster.tag)) {
      return "A terminal status (Alumni / TC / Cancelled Admission) already exists. No further terminal statuses can be added.";
    }

    return null;
  };

  const handleMasterChange = (val: string) => {
    setSelectedMasterId(val);
    setValidationError(null);

    const master = studentMasters.find((m) => String(m.id) === val);
    if (master) {
      // Set default remarks from the master
      setRemarks(master.remarks || "");

      // Clear suspended date when switching away from suspended
      if (!master.tag?.toLowerCase().includes("suspended")) {
        setSuspendedTillDate("");
      }
    }
  };

  const handlePromotionChange = (val: string) => {
    setSelectedPromotionId(val);
    setValidationError(null);
  };

  const handleSubmit = async () => {
    // Skip validation for edit mode when only toggling isActive
    if (!isEditMode) {
      const error = validateFrequency();
      if (error) {
        setValidationError(error);
        return;
      }
    }

    if (!userId || !studentId || !byUserId || !selectedMaster || !selectedPromotion) {
      toast.error("Missing required information");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id: editingMapping?.id,
        userId,
        studentId,
        sessionId: selectedPromotion.sessionId,
        promotionId: selectedPromotion.id,
        byUserId,
        remarks: remarks || null,
        suspendedTillDate:
          isSuspended && suspendedTillDate ? new Date(suspendedTillDate).toISOString() : null,
        suspendedReason: isSuspended ? remarks || null : null,
        isActive,
        userStatusMaster: selectedMaster,
      };

      if (isEditMode) {
        await axiosInstance.put(`/api/user-statuses/${editingMapping.id}`, payload);
        toast.success("Status mapping updated");
      } else {
        await axiosInstance.post("/api/user-statuses", payload);
        toast.success("Status mapping created");
      }

      onSuccess();
      resetAndClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (isEditMode ? "Failed to update status mapping" : "Failed to create status mapping");
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setSelectedMasterId("");
    setSelectedPromotionId("");
    setRemarks("");
    setSuspendedTillDate("");
    setIsActive(true);
    setValidationError(null);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetAndClose();
        else onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            {isEditMode ? "Edit User Status" : "Add User Status"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Batch (linked to session + academic year + class) */}
          <div className="grid grid-cols-4 items-center gap-3">
            <Label className="text-xs text-right text-gray-500">Batch</Label>
            <div className="col-span-3">
              <Select value={selectedPromotionId} onValueChange={handlePromotionChange}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {promotions.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.academicYear?.year || "N/A"} | {p.class?.name || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected batch info badges */}
          {selectedPromotion && (
            <div className="grid grid-cols-4 items-center gap-3">
              <div />
              <div className="col-span-3 flex gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-xs border-blue-300 text-blue-700 bg-blue-50"
                >
                  {selectedPromotion.academicYear?.year || "-"}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-xs border-orange-300 text-orange-700 bg-orange-50"
                >
                  {selectedPromotion.class?.name || "-"}
                </Badge>
              </div>
            </div>
          )}

          {/* User Status Master */}
          <div className="grid grid-cols-4 items-center gap-3">
            <Label className="text-xs text-right text-gray-500">Status</Label>
            <div className="col-span-3">
              <Select
                value={selectedMasterId}
                onValueChange={handleMasterChange}
                disabled={isEditMode || (!isEditMode && !selectedPromotionId)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue
                    placeholder={
                      !selectedPromotionId && !isEditMode
                        ? "Select batch first"
                        : "Select status tag"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableMasters.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${getMasterDotColor(m.tag)}`}
                        />
                        <span>{m.tag}</span>
                        <span className="text-gray-400 text-[10px]">({m.enrollmentStatus})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description — always reserve space to prevent layout shift */}
          <div
            className="grid grid-cols-4 items-start gap-3"
            style={{ minHeight: selectedMaster ? undefined : 0 }}
          >
            <div />
            <div className="col-span-3">
              {selectedMaster ? (
                <div className="text-[11px] text-gray-500 leading-relaxed bg-gray-50 rounded-md p-2 border">
                  {selectedMaster.description}
                </div>
              ) : null}
            </div>
          </div>

          {/* Suspended Till Date — only shown when Suspended is selected */}
          {isSuspended && (
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-xs text-right text-gray-500">
                Suspended Till <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  type="datetime-local"
                  className="h-9 text-xs"
                  value={suspendedTillDate}
                  onChange={(e) => setSuspendedTillDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* isActive toggle - only in edit mode */}
          {isEditMode && (
            <div className="grid grid-cols-4 items-center gap-3">
              <Label className="text-xs text-right text-gray-500">Revoke Request?</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Checkbox
                  checked={!isActive}
                  onCheckedChange={(checked) => setIsActive(!checked)}
                  className="data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                />
                <span className="text-xs text-gray-600">{!isActive ? "Revoked" : "Active"}</span>
              </div>
            </div>
          )}

          {/* Remarks */}
          <div className="grid grid-cols-4 items-start gap-3">
            <Label className="text-xs text-right text-gray-500 pt-2">
              {isSuspended ? (
                <>
                  Reason <span className="text-red-500">*</span>
                </>
              ) : (
                "Remarks"
              )}
            </Label>
            <div className="col-span-3">
              <Textarea
                className="text-xs min-h-[60px]"
                placeholder={isSuspended ? "Reason for suspension..." : "Optional remarks..."}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-xs text-red-700">{validationError}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={resetAndClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
            onClick={handleSubmit}
            disabled={submitting || !selectedMasterId || !selectedPromotionId}
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            {isEditMode ? "Update Status" : "Add Status"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTagBadgeStyle(tag: string): string {
  const lower = tag.toLowerCase();
  if (lower.includes("regular"))
    return "border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100";
  if (lower.includes("suspended"))
    return "border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100";
  if (lower.includes("dropped")) return "border-red-400 text-red-700 bg-red-50 hover:bg-red-100";
  if (lower.includes("alumni")) return "border-cyan-400 text-cyan-700 bg-cyan-50 hover:bg-cyan-100";
  if (lower.includes("transfer") || lower.includes("tc"))
    return "border-violet-400 text-violet-700 bg-violet-50 hover:bg-violet-100";
  if (lower.includes("cancel")) return "border-rose-400 text-rose-700 bg-rose-50 hover:bg-rose-100";
  if (lower.includes("casual")) return "border-teal-400 text-teal-700 bg-teal-50 hover:bg-teal-100";
  return "border-gray-400 text-gray-600 bg-gray-50 hover:bg-gray-100";
}

/** Colored dot for each tag in the status dropdown */
function getMasterDotColor(tag: string): string {
  const lower = tag.toLowerCase();
  if (lower.includes("regular")) return "bg-green-500";
  if (lower.includes("suspended")) return "bg-amber-500";
  if (lower.includes("dropped")) return "bg-red-500";
  if (lower.includes("alumni")) return "bg-cyan-500";
  if (lower.includes("transfer") || lower.includes("tc")) return "bg-violet-500";
  if (lower.includes("cancel")) return "bg-rose-500";
  if (lower.includes("casual")) return "bg-teal-500";
  return "bg-gray-400";
}
