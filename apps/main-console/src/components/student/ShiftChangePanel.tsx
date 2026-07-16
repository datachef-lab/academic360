import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Info, Loader2, Moon, Sun, SunMedium, Sunrise, Sunset } from "lucide-react";
import type { StudentDto } from "@repo/db/dtos/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { useShifts } from "@/hooks/useShifts";
import {
  fetchStudentShiftChangePreview,
  submitStudentShiftChange,
  updateActivePromotionFields,
  type ShiftChangeFeeGroupPreviewRow,
  type StudentShiftChangePreview,
  type UidBreakdownPreview,
} from "@/services/student-shift-change.service";
import axiosInstance from "@/utils/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Shift } from "@/types/academics/shift";
import { studentAvatarUrl } from "@/utils/studentAvatarUrl";

type ShiftChangePanelProps = {
  student: StudentDto | undefined;
  onSuccess?: (newUid: string) => void | Promise<void>;
  onCancel?: () => void;
  /** Show a Cancel button (used inside the dialog). */
  showCancel?: boolean;
};

const STUDENT_LOGIN_EMAIL_DOMAIN = "thebges.edu.in";
const getStudentAvatarUrl = studentAvatarUrl;

function ShiftIcon({ name, className }: { name: string; className?: string }) {
  const normalized = name.toLowerCase();
  if (normalized.includes("morning")) return <Sunrise className={className} />;
  if (normalized.includes("day")) return <Sun className={className} />;
  if (normalized.includes("afternoon")) return <SunMedium className={className} />;
  if (normalized.includes("evening")) return <Moon className={className} />;
  return <Sunset className={className} />;
}

function ShiftSelectLabel({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <ShiftIcon name={name} className="h-4 w-4 shrink-0 text-violet-600" />
      <span className="whitespace-nowrap leading-none">{name}</span>
    </div>
  );
}

function studentLoginEmail(uid: string): string {
  return `${uid}@${STUDENT_LOGIN_EMAIL_DOMAIN}`;
}

function isManualApproval(approvalType: string | null | undefined): boolean {
  return approvalType?.toUpperCase() === "MANUAL";
}

function formatFeeSlabLabel(
  row: ShiftChangeFeeGroupPreviewRow | undefined,
  fallback: string,
): string {
  if (!row?.feeSlab && !row?.feeCategory) return fallback;
  if (row.feeSlab && row.feeCategory) return `${row.feeSlab} (${row.feeCategory})`;
  return row.feeSlab ?? row.feeCategory ?? fallback;
}

function buildFeeRow(preview: StudentShiftChangePreview): { oldValue: string; newValue: string } {
  if (preview.feesPaid) {
    return { oldValue: "Paid this session", newValue: "New rates from next session" };
  }
  if (preview.feeComparison?.old.length) {
    const oldRow = preview.feeComparison.old[0];
    const newRow = preview.feeComparison.new[0];
    return {
      oldValue: formatFeeSlabLabel(oldRow, "Unpaid"),
      newValue: formatFeeSlabLabel(newRow, "Updated for new shift"),
    };
  }
  return { oldValue: "Not set up", newValue: "Set up for new shift" };
}

type ChangeRow = {
  label: string;
  current: string;
  next: string;
  mono?: boolean;
};

function buildChangeRows(
  preview: StudentShiftChangePreview,
  currentUid: string,
  currentShiftName: string,
): ChangeRow[] {
  const newUid = preview.newUidPreview ?? preview.uidBreakdown?.newUid ?? "—";
  const newShiftName = preview.newShift?.name ?? "—";
  const fees = buildFeeRow(preview);
  const oldFee = preview.feeComparison?.old[0];
  const newFee = preview.feeComparison?.new[0];

  const rows: ChangeRow[] = [
    { label: "Shift", current: currentShiftName, next: newShiftName },
    { label: "UID", current: currentUid, next: newUid, mono: true },
    {
      label: "Email",
      current: studentLoginEmail(currentUid),
      next: studentLoginEmail(newUid),
      mono: true,
    },
    { label: "Fee slab", current: fees.oldValue, next: fees.newValue },
  ];

  if (!preview.feesPaid && preview.feeComparison?.old.length) {
    const showApproval =
      isManualApproval(oldFee?.approvalType) || isManualApproval(newFee?.approvalType);
    if (showApproval) {
      rows.push({
        label: "Approved by",
        current: oldFee?.approvedByUser ?? "—",
        next: newFee?.approvedByUser ?? "—",
      });
    }
  }

  return rows;
}

type GeneratedFeeDocument = {
  id: string;
  semester: string;
  receiptName: string;
  documentLabel: "fee receipt" | "challan";
};

function getGeneratedFeeDocuments(preview: StudentShiftChangePreview): GeneratedFeeDocument[] {
  if (preview.feesPaid) return [];
  if (preview.generatedFeeDocuments?.length) {
    return preview.generatedFeeDocuments.map((doc) => ({
      id: String(doc.feeStudentMappingId),
      semester: doc.promotionLabel,
      receiptName: doc.receiptType ?? "Unknown receipt",
      documentLabel: doc.generatedDocumentType === "receipt" ? "fee receipt" : "challan",
    }));
  }
  if (!preview.feeComparison?.old.length) return [];
  return preview.feeComparison.old
    .filter((row) => row.generatedDocumentType)
    .map((row) => ({
      id: `${row.promotionId}-${row.receiptType ?? "unknown"}-${row.generatedDocumentType}`,
      semester: row.promotionLabel,
      receiptName: row.receiptType ?? "Unknown receipt",
      documentLabel: row.generatedDocumentType === "receipt" ? "fee receipt" : "challan",
    }));
}

function getGeneratedDocumentDetectionMessage(documents: GeneratedFeeDocument[]): string {
  const types = new Set(documents.map((doc) => doc.documentLabel));
  const plural = documents.length > 1;
  if (types.has("fee receipt") && types.has("challan")) {
    return "We have detected that fee receipts and challans have already been generated for this student:";
  }
  if (types.has("fee receipt")) {
    return plural
      ? "We have detected that fee receipts have already been generated for this student:"
      : "We have detected that a fee receipt has already been generated for this student:";
  }
  return plural
    ? "We have detected that challans have already been generated for this student:"
    : "We have detected that a challan has already been generated for this student:";
}

function getGeneratedDocumentInvalidationMessage(_documents: GeneratedFeeDocument[]): string {
  return "These challans/receipts carry the current UID and will be invalidated by the shift change — the student must regenerate them under the new shift. (This does not block the change unless fees are actually paid.)";
}

function PreviewSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden bg-white animate-pulse">
      <div className="bg-violet-50/60 border-b border-violet-100 px-4 py-3">
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-md border border-slate-200 bg-white h-20" />
          ))}
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_420px]">
        <div className="p-3 lg:border-r border-slate-200 space-y-2">
          <div className="h-3 w-24 bg-slate-200 rounded" />
          <div className="h-36 bg-slate-100 rounded-md border border-slate-200" />
        </div>
        <div className="bg-slate-50 px-3 py-3 space-y-2">
          <div className="h-3 w-14 bg-slate-200 rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 bg-slate-200 rounded w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

function UidBreakdownPanel({ breakdown }: { breakdown: UidBreakdownPreview }) {
  const courseLabel =
    breakdown.programCourseShortName?.trim() || breakdown.programCourseName?.trim() || null;
  const parts = [
    { label: "Course", value: breakdown.programCoursePrefix, hint: courseLabel },
    { label: "Shift", value: breakdown.shiftPrefix, hint: breakdown.shiftName, changed: true },
    { label: "Year", value: breakdown.registrationYear, hint: "Admission year" },
    { label: "Serial", value: breakdown.sequence, hint: "Unchanged" },
  ];
  return (
    <div className="grid grid-cols-4 gap-3">
      {parts.map((part) => (
        <div
          key={part.label}
          className={cn(
            "rounded-md border bg-white px-3 py-3 text-center",
            part.changed ? "border-violet-400 ring-1 ring-violet-100" : "border-slate-200",
          )}
        >
          <p
            className={cn(
              "text-[11px] uppercase tracking-wider font-semibold",
              part.changed ? "text-violet-700" : "text-slate-500",
            )}
          >
            {part.label}
          </p>
          <p className="font-mono text-[1.65rem] font-bold text-slate-900 mt-1">{part.value}</p>
          {part.hint ? (
            <p
              className="text-sm text-muted-foreground mt-1 leading-snug truncate"
              title={
                part.label === "Course" ? (breakdown.programCourseName ?? part.hint) : part.hint
              }
            >
              {part.hint}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function PreviewPanel({
  preview,
  currentUid,
  currentShiftName,
  isRefreshing,
}: {
  preview: StudentShiftChangePreview;
  currentUid: string;
  currentShiftName: string;
  isRefreshing?: boolean;
}) {
  const rows = buildChangeRows(preview, currentUid, currentShiftName);
  const generatedFeeDocuments = getGeneratedFeeDocuments(preview);
  const documentDetectionMessage = getGeneratedDocumentDetectionMessage(generatedFeeDocuments);
  const documentInvalidationMessage =
    getGeneratedDocumentInvalidationMessage(generatedFeeDocuments);

  const notes: string[] = [];
  notes.push("Unpaid fees update immediately for this session.");
  notes.push("Shift, UID, and login email change as soon as you save.");
  notes.push("Allowed only once per student.");
  if (preview.hasExamHistoryOnActivePromotions) {
    notes.push("Past exam records keep the previous shift.");
  }

  return (
    <div className="relative flex h-full min-h-[420px] flex-col rounded-lg border border-slate-200 overflow-hidden bg-white">
      {isRefreshing ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
        </div>
      ) : null}

      {preview.uidBreakdown ? (
        <div className="bg-violet-50/60 border-b border-violet-100 px-5 py-4">
          <UidBreakdownPanel breakdown={preview.uidBreakdown} />
        </div>
      ) : null}

      <div className="grid flex-1 lg:grid-cols-[1fr_420px] min-h-0">
        <div className="flex flex-col p-4 lg:border-r border-slate-200">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            What changes
          </p>
          <Table
            containerClassName="overflow-x-hidden flex-1 rounded-md border border-slate-300"
            className="border-collapse h-full"
          >
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-300 bg-slate-50">
                <TableHead className="h-10 px-4 text-sm font-semibold w-[110px] border-slate-300">
                  Field
                </TableHead>
                <TableHead className="h-10 px-4 text-sm font-semibold border-slate-300">
                  Current
                </TableHead>
                <TableHead className="h-10 px-4 text-sm font-semibold border-slate-300">
                  New
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.label} className="border-slate-300">
                  <TableCell className="px-4 py-2.5 text-[15px] font-medium text-slate-600 align-middle border-slate-300 bg-slate-50/50">
                    {row.label}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-4 py-2.5 text-[15px] text-slate-600 align-middle border-slate-300",
                      row.mono && "font-mono text-sm",
                    )}
                  >
                    {row.current}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "px-4 py-2.5 text-[15px] font-medium text-slate-900 align-middle border-slate-300",
                      row.mono && "font-mono text-sm",
                    )}
                  >
                    {row.next}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col bg-slate-50 px-4 py-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">Notes</p>
          {generatedFeeDocuments.length > 0 ? (
            <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-3">
              <div className="flex gap-2.5 text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-snug text-red-800">
                    {documentDetectionMessage}
                  </p>
                  <ul className="mt-2.5 space-y-2">
                    {generatedFeeDocuments.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex gap-2 text-[14px] leading-snug text-red-800/95"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-600" />
                        <span>
                          <span className="font-medium">{doc.receiptName}</span>
                          <span className="text-red-800/80"> — {doc.semester}</span>
                          <span className="text-red-700/75"> ({doc.documentLabel})</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2.5 text-[15px] font-semibold leading-snug text-red-800">
                    {documentInvalidationMessage}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
          <ul className="space-y-2.5">
            {notes.map((note) => (
              <li key={note} className="flex gap-2.5 text-[15px] text-slate-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                <span className="whitespace-nowrap">{note}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ShiftChangePanel({
  student,
  onSuccess,
  onCancel,
  showCancel = false,
}: ShiftChangePanelProps) {
  const queryClient = useQueryClient();
  const { shifts, loading: shiftsLoading } = useShifts();
  const open = Boolean(student?.id);
  const currentShiftId = student?.currentPromotion?.shift?.id;

  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [classRollNumber, setClassRollNumber] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const sectionsQuery = useQuery({
    queryKey: ["sections", "for-shift-change-panel"],
    enabled: open,
    queryFn: async () => {
      const res = await axiosInstance.get<{
        payload: Array<{ id: number; name: string; isActive: boolean | null }>;
      }>("/api/v1/sections");
      return (res.data.payload ?? []).filter((s) => s.isActive !== false);
    },
  });
  const sections = sectionsQuery.data ?? [];

  const currentSectionId = student?.currentPromotion?.section?.id ?? null;
  const currentClassRollNumber = student?.currentPromotion?.classRollNumber ?? "";

  const otherShifts = useMemo(
    () => shifts.filter((s) => s.id != null && s.id !== currentShiftId && !s.disabled),
    [shifts, currentShiftId],
  );

  const hasPreviousUid = Boolean(student?.previousUid?.trim());
  const currentUid = student?.uid ?? "";
  const currentShiftName = student?.currentPromotion?.shift?.name ?? "—";

  useEffect(() => {
    if (!open) {
      setSelectedShiftId("");
      setSelectedSectionId("");
      setClassRollNumber("");
      return;
    }
    if (otherShifts.length > 0 && otherShifts[0]?.id != null) {
      setSelectedShiftId((prev) => {
        if (prev && otherShifts.some((s) => String(s.id) === prev)) return prev;
        return String(otherShifts[0]!.id);
      });
    }
    setSelectedSectionId(currentSectionId ? String(currentSectionId) : "");
    setClassRollNumber(currentClassRollNumber ?? "");
  }, [open, otherShifts, currentSectionId, currentClassRollNumber]);

  useEffect(() => {
    if (!open || !student?.id || hasPreviousUid) return;
    const defaultShiftId = otherShifts[0]?.id;
    if (!defaultShiftId) return;
    void queryClient.prefetchQuery({
      queryKey: ["shift-change-preview", student.id, String(defaultShiftId)],
      queryFn: () => fetchStudentShiftChangePreview(student.id!, defaultShiftId),
    });
  }, [open, student?.id, otherShifts, hasPreviousUid, queryClient]);

  const previewQuery = useQuery({
    queryKey: ["shift-change-preview", student?.id, selectedShiftId],
    enabled: open && Boolean(student?.id) && Boolean(selectedShiftId) && !hasPreviousUid,
    queryFn: () => fetchStudentShiftChangePreview(student!.id!, Number(selectedShiftId)),
    keepPreviousData: true,
  });

  const preview = previewQuery.data;
  const isInitialPreviewLoad = previewQuery.isLoading && !preview;
  const isRefreshingPreview = previewQuery.isFetching && Boolean(preview);

  const sectionChanged =
    selectedSectionId !== "" && Number(selectedSectionId) !== (currentSectionId ?? -1);
  const trimmedRoll = classRollNumber.trim();
  const rollChanged = trimmedRoll !== "" && trimmedRoll !== (currentClassRollNumber ?? "");
  const shiftPicked =
    Boolean(selectedShiftId) && Number(selectedShiftId) !== (currentShiftId ?? -1);

  const errorMessage = (err: unknown): string | null => {
    if (!err || typeof err !== "object") return null;
    const response = (err as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message ?? null;
  };

  // Block the shift change ONLY when fees are actually paid (a successful
  // payment). A merely-generated (unpaid) challan/receipt must NOT block it —
  // the backend already permits it (deletes the old-shift unpaid mappings and
  // recreates new-shift fees), and the generated-document warning still shows
  // below for the admin's awareness.
  const shiftBlockedByFees = preview?.feesPaid === true;

  const handleConfirm = async () => {
    if (!student?.id) return;
    if (!shiftPicked && !sectionChanged && !rollChanged) {
      toast.info("Nothing to update.");
      return;
    }
    if (shiftBlockedByFees) {
      toast.error("Shift change is blocked because fees have already been paid for this student.");
      return;
    }
    setSubmitting(true);
    try {
      let newUid: string | null = null;
      // Apply the shift change FIRST: it closes the current promotion (kept as
      // history with its original section/roll) and clones a new active one. The
      // section/roll edit below then lands on that NEW active promotion — so the
      // deprecated historical promotion is never touched.
      if (shiftPicked) {
        const result = await submitStudentShiftChange(student.id, Number(selectedShiftId));
        newUid = result.newUid;
      }
      if (sectionChanged || rollChanged) {
        await updateActivePromotionFields(student.id, {
          sectionId: sectionChanged ? Number(selectedSectionId) : undefined,
          classRollNumber: rollChanged ? trimmedRoll : undefined,
        });
      }
      if (shiftPicked) {
        toast.success(`Shift updated. New student ID: ${newUid}`);
      } else {
        toast.success("Student details updated.");
      }
      if (newUid && onSuccess) {
        await onSuccess(newUid);
      } else if (onSuccess) {
        await onSuccess(student.uid ?? "");
      }
    } catch (err: unknown) {
      toast.error(errorMessage(err) || "Could not save changes. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canConfirm =
    !hasPreviousUid &&
    !submitting &&
    !isInitialPreviewLoad &&
    !shiftBlockedByFees &&
    (sectionChanged || rollChanged || (shiftPicked && preview?.allowed === true));

  const selectedShift = otherShifts.find((s) => String(s.id) === selectedShiftId);
  const avatarUrl = getStudentAvatarUrl(currentUid);
  const studentInitial =
    student?.personalDetails?.firstName?.charAt(0)?.toUpperCase() ??
    student?.name?.charAt(0)?.toUpperCase() ??
    "?";

  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden">
      {/* Header: student + shift/section/roll inputs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/50 px-4 sm:px-6 py-3.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar className="h-11 w-11 shrink-0 border-2 border-white shadow-sm ring-1 ring-slate-200">
            <AvatarImage
              src={avatarUrl}
              alt={student?.name ?? "Student"}
              className="object-cover"
            />
            <AvatarFallback className="bg-violet-100 text-violet-700 text-sm font-semibold">
              {studentInitial}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 items-center gap-2 text-base whitespace-nowrap">
            <span className="truncate font-semibold text-foreground">
              {student?.name ?? "Student"}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{currentShiftName}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-foreground">{currentUid}</span>
          </div>
        </div>

        {!hasPreviousUid ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-medium text-muted-foreground">New shift</Label>
              <Select
                value={selectedShiftId}
                onValueChange={setSelectedShiftId}
                disabled={shiftsLoading || otherShifts.length === 0 || shiftBlockedByFees}
              >
                <SelectTrigger
                  id="newShift"
                  className="h-10 min-w-[220px] w-[220px] shrink-0 text-sm [&>span]:line-clamp-none"
                >
                  <div className="flex flex-1 items-center gap-2.5 min-w-0 overflow-hidden">
                    {selectedShift ? (
                      <ShiftSelectLabel name={selectedShift.name} />
                    ) : (
                      <SelectValue placeholder="Keep current" />
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent className="min-w-[220px]">
                  {otherShifts.map((shift: Shift) => (
                    <SelectItem key={shift.id} value={String(shift.id)} className="py-2.5">
                      <ShiftSelectLabel name={shift.name} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-medium text-muted-foreground">Section</Label>
              <Select
                value={selectedSectionId}
                onValueChange={setSelectedSectionId}
                disabled={sectionsQuery.isLoading || sections.length === 0}
              >
                <SelectTrigger className="h-10 min-w-[180px] w-[180px] text-sm">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent className="min-w-[180px]">
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-medium text-muted-foreground">
                Class Roll No.
              </Label>
              <Input
                value={classRollNumber}
                onChange={(e) => setClassRollNumber(e.target.value)}
                placeholder="e.g. 23"
                className="h-10 min-w-[140px] w-[140px] text-sm"
              />
            </div>
          </div>
        ) : null}
      </div>

      {/* Body */}
      <div className="flex flex-col px-4 sm:px-6 py-4">
        {hasPreviousUid ? (
          <div className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p>
                Shift change has already been used for this student (previous UID:{" "}
                <span className="font-mono font-medium">{student?.previousUid}</span>).
              </p>
              <p className="text-red-800/90">
                As per policy, only one shift change is allowed per student.
              </p>
            </div>
          </div>
        ) : (
          <>
            {!shiftPicked ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                {sectionChanged || rollChanged
                  ? "Section / class roll number will be applied to every active promotion on save."
                  : "Pick a new shift to preview the UID change, or just update section / class roll number."}
              </div>
            ) : isInitialPreviewLoad ? (
              <PreviewSkeleton />
            ) : preview && !preview.allowed ? (
              <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{preview.blockReason}</p>
              </div>
            ) : shiftBlockedByFees ? (
              <div className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium">
                    Shift change is not allowed — fees have already been paid for this student.
                  </p>
                  <p className="text-red-800/90">
                    Reverse the existing fee receipt before attempting to change the shift.
                  </p>
                </div>
              </div>
            ) : preview?.allowed ? (
              <PreviewPanel
                preview={preview}
                currentUid={currentUid}
                currentShiftName={currentShiftName}
                isRefreshing={isRefreshingPreview}
              />
            ) : null}
          </>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-2 border-t bg-slate-50/50 px-4 sm:px-6 py-3.5">
        {showCancel ? (
          <Button variant="outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
        ) : null}
        {!hasPreviousUid ? (
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : shiftPicked ? (
              "Confirm shift change"
            ) : (
              "Save section & roll"
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
