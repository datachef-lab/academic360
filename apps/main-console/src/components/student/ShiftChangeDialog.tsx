import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Info,
  Loader2,
  Moon,
  PencilLine,
  Sun,
  SunMedium,
  Sunrise,
  Sunset,
} from "lucide-react";
import type { StudentDto } from "@repo/db/dtos/user";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  type ShiftChangeFeeGroupPreviewRow,
  type StudentShiftChangePreview,
  type UidBreakdownPreview,
} from "@/services/student-shift-change.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Shift } from "@/types/academics/shift";

type ShiftChangeDialogProps = {
  student: StudentDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (newUid: string) => void | Promise<void>;
};

const STUDENT_LOGIN_EMAIL_DOMAIN = "thebges.edu.in";

function getStudentAvatarUrl(uid: string | undefined): string | undefined {
  if (!uid) return undefined;
  const base =
    import.meta.env.VITE_STUDENT_IMAGE_BASE_URL ??
    "https://besc.academic360.app/id-card-generate/api/images?crop=true&uid=";
  return `${base}${uid}`;
}

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
    return {
      oldValue: "Paid this session",
      newValue: "New rates from next session",
    };
  }
  if (preview.feeComparison?.old.length) {
    const oldRow = preview.feeComparison.old[0];
    const newRow = preview.feeComparison.new[0];
    return {
      oldValue: formatFeeSlabLabel(oldRow, "Unpaid"),
      newValue: formatFeeSlabLabel(newRow, "Updated for new shift"),
    };
  }
  return {
    oldValue: "Not set up",
    newValue: "Set up for new shift",
  };
}

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
  if (preview.feesPaid) {
    return [];
  }

  if (preview.generatedFeeDocuments?.length) {
    return preview.generatedFeeDocuments.map((doc) => ({
      id: String(doc.feeStudentMappingId),
      semester: doc.promotionLabel,
      receiptName: doc.receiptType ?? "Unknown receipt",
      documentLabel: doc.generatedDocumentType === "receipt" ? "fee receipt" : "challan",
    }));
  }

  if (!preview.feeComparison?.old.length) {
    return [];
  }

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

function getGeneratedDocumentInvalidationMessage(documents: GeneratedFeeDocument[]): string {
  if (documents.length === 0) return "";

  const types = new Set(documents.map((doc) => doc.documentLabel));
  const plural = documents.length > 1;

  if (types.has("fee receipt") && types.has("challan")) {
    return plural
      ? "These downloaded fee receipts and challans will no longer be treated as valid after the shift change."
      : documents[0]!.documentLabel === "fee receipt"
        ? "The downloaded fee receipt will no longer be treated as valid after the shift change."
        : "The downloaded challan will no longer be treated as valid after the shift change.";
  }

  if (types.has("fee receipt")) {
    return plural
      ? "These downloaded fee receipts will no longer be treated as valid after the shift change."
      : "The downloaded fee receipt will no longer be treated as valid after the shift change.";
  }

  return plural
    ? "These downloaded challans will no longer be treated as valid after the shift change."
    : "The downloaded challan will no longer be treated as valid after the shift change.";
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

type ChangeRow = {
  label: string;
  current: string;
  next: string;
  mono?: boolean;
};

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
  if (preview.feesPaid) {
    notes.push("This session's payment is kept — nothing is removed.");
    notes.push("New fee amounts apply from the next session only.");
  } else {
    notes.push("Unpaid fees update immediately for this session.");
  }
  notes.push("Shift, UID, and login email change as soon as you save.");
  notes.push("Allowed only once per student.");
  if (preview.hasExamHistoryOnActivePromotions) {
    notes.push("Past exam records keep the previous shift.");
  }

  return (
    <div className="relative flex h-full min-h-[62vh] flex-col rounded-lg border border-slate-200 overflow-hidden bg-white">
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

export default function ShiftChangeDialog({
  student,
  open,
  onOpenChange,
  onSuccess,
}: ShiftChangeDialogProps) {
  const queryClient = useQueryClient();
  const { shifts, loading: shiftsLoading } = useShifts();
  const currentShiftId = student?.currentPromotion?.shift?.id;

  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

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
      return;
    }
    if (otherShifts.length > 0 && otherShifts[0]?.id != null) {
      setSelectedShiftId((prev) => {
        if (prev && otherShifts.some((s) => String(s.id) === prev)) {
          return prev;
        }
        return String(otherShifts[0]!.id);
      });
    }
  }, [open, otherShifts]);

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

  const handleConfirm = async () => {
    if (!student?.id || !selectedShiftId) return;
    setSubmitting(true);
    try {
      const result = await submitStudentShiftChange(student.id, Number(selectedShiftId));
      toast.success(`Shift updated. New student ID: ${result.newUid}`);
      if (onSuccess) {
        await onSuccess(result.newUid);
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      toast.error(msg || "Could not change shift. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canConfirm =
    !hasPreviousUid &&
    Boolean(selectedShiftId) &&
    preview?.allowed === true &&
    !submitting &&
    !isInitialPreviewLoad;

  const selectedShift = otherShifts.find((s) => String(s.id) === selectedShiftId);
  const avatarUrl = getStudentAvatarUrl(currentUid);
  const studentInitial =
    student?.personalDetails?.firstName?.charAt(0)?.toUpperCase() ??
    student?.name?.charAt(0)?.toUpperCase() ??
    "?";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[98vw] min-h-[90vh] max-h-[96vh] p-0 gap-0 overflow-hidden flex flex-col sm:max-w-7xl">
        <DialogHeader className="px-6 pt-5 pb-0 border-b-0 bg-slate-50/50 shrink-0">
          <DialogTitle className="flex items-center gap-2.5 text-xl text-left">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-700">
              <PencilLine className="h-4 w-4" />
            </span>
            Change student shift
          </DialogTitle>
        </DialogHeader>

        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/50 px-6 pb-3.5 pt-2.5">
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
            <Select
              value={selectedShiftId}
              onValueChange={setSelectedShiftId}
              disabled={shiftsLoading || otherShifts.length === 0}
            >
              <SelectTrigger
                id="newShift"
                className="h-10 min-w-[280px] w-[280px] shrink-0 text-base [&>span]:line-clamp-none"
              >
                <div className="flex flex-1 items-center gap-2.5 min-w-0 overflow-hidden">
                  {selectedShift ? (
                    <ShiftSelectLabel name={selectedShift.name} />
                  ) : (
                    <SelectValue placeholder="New shift" />
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="min-w-[280px]">
                {otherShifts.map((shift: Shift) => (
                  <SelectItem key={shift.id} value={String(shift.id)} className="py-2.5">
                    <ShiftSelectLabel name={shift.name} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col px-6 py-4 overflow-hidden">
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
              {!selectedShiftId ? (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed py-12 text-sm text-muted-foreground">
                  <Info className="h-4 w-4" />
                  Choose a shift to preview
                </div>
              ) : isInitialPreviewLoad ? (
                <PreviewSkeleton />
              ) : preview && !preview.allowed ? (
                <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{preview.blockReason}</p>
                </div>
              ) : preview?.allowed ? (
                <div className="flex min-h-0 flex-1 flex-col">
                  <PreviewPanel
                    preview={preview}
                    currentUid={currentUid}
                    currentShiftName={currentShiftName}
                    isRefreshing={isRefreshingPreview}
                  />
                </div>
              ) : null}
            </>
          )}
        </div>

        <DialogFooter className="px-6 py-3.5 border-t bg-slate-50/50 shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          {!hasPreviousUid ? (
            <Button onClick={handleConfirm} disabled={!canConfirm}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Confirm shift change"
              )}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
