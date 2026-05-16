import { useAuth } from "@/features/auth/hooks/use-auth";
import { ExportProgressDialog } from "@/components/ui/export-progress-dialog";
import { useSocket } from "@/hooks/useSocket";
import type { ProgressUpdate } from "@/types/progress";
import {
  postBulkDataUpload,
  downloadBulkDataUploadTemplate,
  type BulkDataUploadMode,
} from "@/services/bulk-data-upload.api";
import {
  fetchAvailableAffiliations,
  fetchAcademicYearsByAffiliation,
  fetchRegulationTypes,
} from "@/services/cascading-dropdowns-axios.api";
import { fetchAllClasses, type ClassRow } from "@/services/classes.api";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  Download,
  Eye,
  FileSpreadsheet,
  FileUp,
  GraduationCap,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import type { ApiResponse } from "@/types/api-response";
import { CATEGORIES, COLUMNS, type BulkCategoryId } from "../constants";

const SELECTABLE_CATEGORIES = CATEGORIES.filter((c) => c.id !== "result_upload");

type Option = { value: string; label: string };

function SelectKey({
  label,
  icon: Icon,
  options,
  value,
  onChange,
  placeholder,
  color,
  light,
  disabled = false,
}: {
  label?: string;
  icon?: LucideIcon;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  color: string;
  light: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value)?.label ?? "";
  return (
    <div className="relative min-w-0 flex-1">
      {label ? (
        <div
          className="mb-1 text-[10px] font-extrabold uppercase tracking-widest"
          style={{ color: disabled ? "#c4c9d4" : "#6b7280" }}
        >
          {label}
        </div>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((o) => !o);
        }}
        className="flex w-full cursor-pointer items-center gap-1.5 rounded-[9px] border-[1.5px] px-3 py-2 text-left text-xs font-semibold transition-all"
        style={{
          background: disabled ? "#f9fafb" : "white",
          borderColor: open ? color : disabled ? "#f0f0f0" : "#d1d5db",
          color: disabled ? "#c4c9d4" : value ? "#111827" : "#9ca3af",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: open ? `0 0 0 3px ${light}` : "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {Icon ? (
          <Icon
            size={13}
            color={disabled ? "#d1d5db" : value ? color : "#9ca3af"}
            className="shrink-0"
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate">{selected || placeholder}</span>
        <ChevronDown
          size={11}
          color={disabled ? "#d1d5db" : "#9ca3af"}
          className="shrink-0 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : undefined }}
        />
      </button>
      {open && !disabled ? (
        <div
          className="absolute z-[999] mt-1 max-h-60 w-full overflow-y-auto rounded-[11px] border-[1.5px] border-[#e5e7eb] bg-white shadow-xl"
          style={{ boxShadow: "0 12px 28px rgba(0,0,0,0.12)" }}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className="block w-full cursor-pointer border-none px-[13px] py-2 text-left text-xs font-medium"
              style={{
                fontWeight: value === o.value ? 700 : 500,
                color: value === o.value ? color : "#374151",
                background: value === o.value ? light : "white",
                borderLeft: value === o.value ? `3px solid ${color}` : "3px solid transparent",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SectionLabel({
  num,
  title,
  color,
  light,
  done,
  locked,
}: {
  num: string;
  title: string;
  color: string;
  light: string;
  done: boolean;
  locked: boolean;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2"
        style={{
          background: done ? "#16a34a" : locked ? "#e5e7eb" : light,
          borderColor: done ? "#16a34a" : locked ? "#e5e7eb" : color,
        }}
      >
        {done ? (
          <CheckCircle2 size={12} color="white" strokeWidth={2.5} />
        ) : (
          <span className="text-[10px] font-black" style={{ color: locked ? "#9ca3af" : color }}>
            {num}
          </span>
        )}
      </div>
      <span
        className="text-[13px] font-black"
        style={{ color: locked ? "#9ca3af" : done ? "#15803d" : "#111827" }}
      >
        {title}
      </span>
      {done ? <span className="ml-0.5 text-[10px] font-extrabold text-green-600">✓</span> : null}
    </div>
  );
}

function StatusBadge({ s, e }: { s: string; e?: string }) {
  if (s === "ok")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-800">
        <CheckCircle2 size={10} /> Valid
      </span>
    );
  return (
    <span
      title={e}
      className="inline-flex cursor-help items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-extrabold text-red-800"
    >
      <XCircle size={10} /> Error
    </span>
  );
}

function ConfirmModal({
  fileName,
  onConfirm,
  onCancel,
}: {
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div
        className="w-full max-w-[420px] rounded-[20px] border-[1.5px] border-[#e5e7eb] bg-white p-6 shadow-2xl sm:p-8"
        style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.2)" }}
      >
        <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-[14px] bg-amber-100">
          <AlertTriangle size={22} color="#d97706" />
        </div>
        <div className="mb-1.5 text-base font-black text-gray-900">Validate file (simulation)</div>
        <p className="mb-3.5 text-xs font-semibold leading-relaxed text-gray-500">
          The file will be sent to the server for validation only. No database changes will be made
          until you confirm the final submit.
        </p>
        <div className="mb-3 flex items-center gap-3 rounded-[11px] border-[1.5px] border-[#e5e7eb] bg-gray-50 px-3.5 py-2.5">
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-emerald-100">
            <FileSpreadsheet size={16} color="#059669" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-extrabold text-gray-900">{fileName}</div>
            <div className="text-[11px] font-semibold text-gray-400">Excel · validation run</div>
          </div>
        </div>
        <div className="mb-4 rounded-[9px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          Confirm this is the correct file for validation.
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-[11px] border-[1.5px] border-[#e5e7eb] bg-white py-2 text-[13px] font-bold text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 cursor-pointer rounded-[11px] border-none bg-indigo-600 py-2 text-[13px] font-extrabold text-white"
          >
            Run validation
          </button>
        </div>
      </div>
    </div>
  );
}

function CommitSuccess({
  cat,
  labels,
  total,
  onReset,
  userName,
}: {
  cat: BulkCategoryId;
  labels: { aff: string; reg: string; yr: string; sem: string };
  total: number;
  onReset: () => void;
  userName: string;
}) {
  const sel = CATEGORIES.find((c) => c.id === cat);
  return (
    <div className="flex flex-col items-center gap-0 px-4 py-9 text-center sm:px-6">
      <div className="relative mb-5 h-[88px] w-[88px]">
        <div
          className="absolute inset-0 animate-ping rounded-full bg-emerald-200 opacity-80"
          style={{ animationDuration: "1.5s" }}
        />
        <div
          className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full bg-gradient-to-br from-green-600 to-emerald-600 shadow-lg"
          style={{ boxShadow: "0 8px 24px rgba(22,163,74,0.35)" }}
        >
          <CheckCircle2 size={38} color="white" strokeWidth={2} />
        </div>
      </div>

      <div className="mb-1.5 text-xl font-black text-gray-900 sm:text-[22px]">
        Data saved successfully
      </div>
      <p className="mb-6 max-w-md text-[13px] font-semibold leading-relaxed text-gray-500">
        <b className="text-green-600">{total}</b> record(s) were processed and written to the
        database.
      </p>

      <div className="mb-7 flex flex-wrap justify-center gap-2">
        {[
          { label: "Affiliation", val: labels.aff, color: "#4f46e5", bg: "#eef2ff" },
          { label: "Regulation", val: labels.reg, color: "#0369a1", bg: "#e0f2fe" },
          { label: "Academic Year", val: labels.yr, color: "#047857", bg: "#d1fae5" },
          { label: "Semester / Class", val: labels.sem, color: "#b45309", bg: "#fef3c7" },
          {
            label: "Category",
            val: sel?.label ?? cat,
            color: sel?.color ?? "#7c3aed",
            bg: sel?.light ?? "#ede9fe",
          },
        ].map((t) => (
          <div
            key={t.label}
            className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5"
            style={{ background: t.bg }}
          >
            <span
              className="text-[9px] font-black uppercase tracking-wider opacity-55"
              style={{ color: t.color }}
            >
              {t.label}
            </span>
            <span
              className="max-w-[200px] truncate text-xs font-extrabold"
              style={{ color: t.color }}
            >
              {t.val}
            </span>
          </div>
        ))}
      </div>

      <div className="mb-7 flex flex-wrap items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-gray-50 px-4 py-2 text-xs font-bold text-gray-500">
        <CheckCircle2 size={13} color="#16a34a" />
        <span>
          Completed{" "}
          {new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} ·{" "}
        </span>
        <span className="font-black text-gray-900">{userName}</span>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="flex items-center gap-2 rounded-[11px] border-none bg-indigo-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-md"
        style={{ boxShadow: "0 4px 12px rgba(79,70,229,0.25)" }}
      >
        <RotateCcw size={13} /> Upload another file
      </button>
    </div>
  );
}

function categoryToApiMode(cat: BulkCategoryId): BulkDataUploadMode | null {
  if (cat === "form_fillup") return "exam-form-fillup";
  if (cat === "reg_roll") return "cu-reg-roll";
  return null;
}

type ExamPayload = {
  summary: { total: number; successful: number; failed: number };
  errors: Array<{
    row: number;
    data: Record<string, string>;
    error: string;
  }>;
  dryRun?: boolean;
  /** Parsed file cells per logical row — present for validation table on success rows */
  fileRows?: Array<{ row: number } & Record<string, string>>;
};

type CuPayload = {
  totalRows: number;
  updated: number;
  notFound: string[];
  errors: Array<{ rowNumber: number; uid: string; error: string }>;
  duplicates: Array<{ uid: string; rowNumbers: number[] }>;
  /** Present when API returns parsed Excel rows (for validation table) */
  fileRows?: Array<{
    rowNumber: number;
    uid: string;
    cuRegistrationNumber: string | null;
    cuRollNumber: string | null;
  }>;
  dryRun?: boolean;
};

function displayCell(v: string | null | undefined): string {
  if (v == null || String(v).trim() === "") return "—";
  return String(v);
}

/** 400 BULK_UPLOAD_* / parse failures — show inline instead of toast-only */
type HttpValidationFailure = {
  message: string;
  errors?: string[];
  validationErrors?: string[] | null;
};

/** API may send `errors` / `validationErrors` as string[] or a single string; never spread unknown values (string spreads into chars). */
function normalizeApiErrorStrings(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === "string") return value.trim() ? [value.trim()] : [];
  if (Array.isArray(value)) {
    return value
      .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
      .map((s) => s.trim());
  }
  return [];
}

function parseRowPrefixedMessages(messages: string[]): Array<{ row: number; text: string }> {
  const out: Array<{ row: number; text: string }> = [];
  for (const m of messages) {
    const trimmed = m.trim();
    if (!trimmed) continue;
    const match =
      /^Row\s+(\d+)\s*:\s*(.*)$/i.exec(trimmed) ||
      /^Excel\s+row\s+(\d+)\s*:\s*(.*)$/i.exec(trimmed) ||
      /^Line\s+(\d+)\s*:\s*(.*)$/i.exec(trimmed);
    if (match) {
      out.push({
        row: Number(match[1]),
        text: (match[2] || "").trim() || trimmed,
      });
    }
  }
  out.sort((a, b) => a.row - b.row);
  return out;
}

function downloadBulkErrorReportCsv(filename: string, headers: string[], rows: string[][]) {
  const esc = (c: string) => `"${String(c).replace(/"/g, '""')}"`;
  const line = (r: string[]) => r.map(esc).join(",");
  const blob = new Blob([[headers.map(esc).join(","), ...rows.map(line)].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function BulkUploadDataPanel() {
  const { user } = useAuth();
  const userIdStr = (user?.id ?? "").toString();
  const displayName = user?.name?.trim() || "User";

  const [exportProgressOpen, setExportProgressOpen] = useState(false);
  const [progressUpdate, setProgressUpdate] = useState<ProgressUpdate | null>(null);

  const handleSocketProgress = useCallback((data: ProgressUpdate) => {
    setProgressUpdate(data);
  }, []);

  useSocket({
    userId: userIdStr,
    onProgressUpdate: handleSocketProgress,
  });

  const [affiliations, setAffiliations] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [regulations, setRegulations] = useState<Option[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);

  const [affiliationId, setAffiliationId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [regulationTypeId, setRegulationTypeId] = useState("");
  const [classId, setClassId] = useState("");

  const [affLabel, setAffLabel] = useState("");
  const [yearLabel, setYearLabel] = useState("");
  const [regLabel, setRegLabel] = useState("");
  const [classLabel, setClassLabel] = useState("");

  const [cat, setCat] = useState<BulkCategoryId | "">("");
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [dryRunPayload, setDryRunPayload] = useState<ExamPayload | CuPayload | null>(null);
  const [validationHttpFailure, setValidationHttpFailure] = useState<HttpValidationFailure | null>(
    null,
  );
  const [commitCount, setCommitCount] = useState(0);

  const apiMode = cat ? categoryToApiMode(cat) : null;

  /** Original wizard: define full academic context first, then pick category. Cascading: affiliation → year → regulation → class. */
  const contextDone = !!(affiliationId && academicYearId && regulationTypeId && classId);
  const catDone = !!(contextDone && cat);

  const sel = cat ? CATEGORIES.find((c) => c.id === cat) : undefined;
  const cols = cat ? COLUMNS[cat] : [];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [affs, cls] = await Promise.all([fetchAvailableAffiliations(), fetchAllClasses()]);
        if (cancelled) return;
        setAffiliations(affs.map((a) => ({ value: String(a.id), label: a.name })));
        const sem = cls
          .filter((c) => c.type === "SEMESTER" && c.isActive !== false)
          .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
        setClasses(sem);
      } catch {
        toast.error("Failed to load affiliations or classes");
      } finally {
        if (!cancelled) setLoadingMeta(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!affiliationId) {
      setYears([]);
      setAcademicYearId("");
      setRegulations([]);
      setRegulationTypeId("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchAcademicYearsByAffiliation(Number(affiliationId));
        if (cancelled) return;
        setYears(list.map((y) => ({ value: String(y.id), label: y.year })));
        setAcademicYearId("");
        setRegulations([]);
        setRegulationTypeId("");
      } catch {
        toast.error("Failed to load academic years");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [affiliationId]);

  useEffect(() => {
    if (!affiliationId || !academicYearId) {
      setRegulations([]);
      setRegulationTypeId("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchRegulationTypes(Number(affiliationId), Number(academicYearId));
        if (cancelled) return;
        setRegulations(list.map((r) => ({ value: String(r.id), label: r.name })));
        setRegulationTypeId("");
      } catch {
        toast.error("Failed to load regulations");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [affiliationId, academicYearId]);

  const classOptions: Option[] = useMemo(
    () => classes.map((c) => ({ value: String(c.id), label: c.name })),
    [classes],
  );

  const examStats = useMemo(() => {
    if (!dryRunPayload || !("summary" in dryRunPayload)) return null;
    const p = dryRunPayload as ExamPayload;
    return {
      total: p.summary.total,
      valid: p.summary.successful,
      errs: p.summary.failed,
      hasErrors: p.summary.failed > 0,
    };
  }, [dryRunPayload]);

  const cuStats = useMemo(() => {
    if (!dryRunPayload || !("totalRows" in dryRunPayload)) return null;
    const p = dryRunPayload as CuPayload;
    const errCount = p.errors.length + p.notFound.length;
    return {
      total: p.totalRows,
      valid: p.updated,
      errs: errCount,
      hasErrors: errCount > 0 || p.duplicates.length > 0,
    };
  }, [dryRunPayload]);

  const httpFailureParsed = useMemo(() => {
    if (!validationHttpFailure) return null;
    const fromApi = [
      ...normalizeApiErrorStrings(validationHttpFailure.validationErrors),
      ...normalizeApiErrorStrings(validationHttpFailure.errors),
    ];
    const msgs =
      fromApi.length > 0
        ? fromApi
        : validationHttpFailure.message?.trim()
          ? [validationHttpFailure.message.trim()]
          : [];
    return {
      parsed: parseRowPrefixedMessages(msgs),
      rawMessages: msgs,
    };
  }, [validationHttpFailure]);

  const total: number | null = validationHttpFailure
    ? null
    : cat === "form_fillup"
      ? (examStats?.total ?? null)
      : (cuStats?.total ?? null);
  const valid: number | null = validationHttpFailure
    ? null
    : cat === "form_fillup"
      ? (examStats?.valid ?? null)
      : (cuStats?.valid ?? null);
  const errs = validationHttpFailure
    ? httpFailureParsed
      ? httpFailureParsed.parsed.length > 0
        ? new Set(httpFailureParsed.parsed.map((p) => p.row)).size
        : httpFailureParsed.rawMessages.length || 1
      : 1
    : cat === "form_fillup"
      ? (examStats?.errs ?? 0)
      : (cuStats?.errs ?? 0);
  const hasErrors =
    !!validationHttpFailure ||
    (cat === "form_fillup" ? !!examStats?.hasErrors : !!cuStats?.hasErrors);

  const uploadDone = !!(catDone && file && validated && (dryRunPayload || validationHttpFailure));

  function buildFormData(f: File): FormData {
    const fd = new FormData();
    fd.append("file", f);
    if (user?.id != null) fd.append("uploadSessionId", String(user.id));
    if (apiMode === "exam-form-fillup") {
      fd.append("affiliationId", affiliationId);
      fd.append("regulationTypeId", regulationTypeId);
      fd.append("academicYearId", academicYearId);
      fd.append("classId", classId);
    }
    return fd;
  }

  async function runValidation(f: File) {
    if (!apiMode) return;
    setLoading(true);
    setDryRunPayload(null);
    setValidationHttpFailure(null);
    try {
      const payload = (await postBulkDataUpload(apiMode, buildFormData(f), true)) as
        | ExamPayload
        | CuPayload;
      setDryRunPayload(payload);
      setValidated(true);
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 400 && e.response.data) {
        const d = e.response.data as ApiResponse<{
          errors?: string[];
          validationErrors?: string[] | null;
        }>;
        const p = d.payload;
        setValidationHttpFailure({
          message: d.message ?? "Validation failed",
          errors: p?.errors,
          validationErrors: p?.validationErrors ?? null,
        });
        setValidated(true);
        return;
      }
      let msg = "Validation failed";
      if (axios.isAxiosError(e) && e.response?.data) {
        const d = e.response.data as { message?: string };
        msg = d.message ?? msg;
      } else if (e instanceof Error) msg = e.message;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function pickFile(f: File) {
    setPendingFile(f);
    setShowConfirm(true);
  }

  function confirmUpload() {
    setShowConfirm(false);
    if (!pendingFile) return;
    setFile(pendingFile);
    setValidated(false);
    void runValidation(pendingFile);
  }

  function cancelUpload() {
    setPendingFile(null);
    setShowConfirm(false);
  }

  function resetFile() {
    setFile(null);
    setPendingFile(null);
    setValidated(false);
    setLoading(false);
    setCommitted(false);
    setCommitting(false);
    setDryRunPayload(null);
    setValidationHttpFailure(null);
  }

  function fullReset() {
    resetFile();
    setAffiliationId("");
    setAcademicYearId("");
    setRegulationTypeId("");
    setClassId("");
    setAffLabel("");
    setYearLabel("");
    setRegLabel("");
    setClassLabel("");
    setCat("");
  }

  async function handleCommit() {
    if (!file || !apiMode || !cat) return;
    setCommitting(true);
    setExportProgressOpen(true);
    setProgressUpdate(null);
    setValidationHttpFailure(null);
    try {
      const payload = (await postBulkDataUpload(apiMode, buildFormData(file), false)) as
        | ExamPayload
        | CuPayload;
      if ("summary" in payload) {
        setCommitCount(payload.summary.successful);
      } else {
        setCommitCount(payload.updated);
      }
      setCommitted(true);
      toast.success("Bulk upload completed");
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.status === 400 && e.response.data) {
        const d = e.response.data as ApiResponse<{
          errors?: string[];
          validationErrors?: string[] | null;
        }>;
        const p = d.payload;
        setValidationHttpFailure({
          message: d.message ?? "Upload failed",
          errors: p?.errors,
          validationErrors: p?.validationErrors ?? null,
        });
        setValidated(true);
        return;
      }
      const msg =
        e instanceof Error
          ? e.message
          : axios.isAxiosError(e)
            ? (e.response?.data as { message?: string })?.message
            : "Upload failed";
      toast.error(typeof msg === "string" ? msg : "Upload failed");
    } finally {
      setCommitting(false);
      setExportProgressOpen(false);
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  }, []);

  async function handleDownloadTemplate() {
    if (!apiMode) {
      toast.error("Select a data category first");
      return;
    }
    try {
      const blob = await downloadBulkDataUploadTemplate(apiMode);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        apiMode === "cu-reg-roll"
          ? "bulk-upload-cu-reg-roll-template.xlsx"
          : "bulk-upload-exam-form-fillup-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download template");
    }
  }

  const handleDownloadErrorReport = useCallback(() => {
    if (validationHttpFailure && httpFailureParsed) {
      const { parsed, rawMessages } = httpFailureParsed;
      if (parsed.length > 0) {
        downloadBulkErrorReportCsv(
          "bulk-upload-validation-errors.csv",
          ["Excel row", "Error detail"],
          parsed.map((p) => [String(p.row), p.text]),
        );
        return;
      }
      if (rawMessages.length > 0) {
        downloadBulkErrorReportCsv(
          "bulk-upload-validation-errors.csv",
          ["Message"],
          rawMessages.map((m) => [m]),
        );
        return;
      }
      if (validationHttpFailure.message?.trim()) {
        downloadBulkErrorReportCsv(
          "bulk-upload-validation-errors.csv",
          ["Message"],
          [[validationHttpFailure.message.trim()]],
        );
        return;
      }
      return;
    }
    if (dryRunPayload && cat === "form_fillup" && "errors" in dryRunPayload) {
      const p = dryRunPayload as ExamPayload;
      downloadBulkErrorReportCsv(
        "bulk-upload-validation-errors.csv",
        ["Row", ...cols, "Error"],
        p.errors.map((err) => [
          String(err.row),
          ...cols.map((c) => String(err.data[c] ?? "")),
          err.error,
        ]),
      );
      return;
    }
    if (dryRunPayload && cat === "reg_roll" && "errors" in dryRunPayload) {
      const p = dryRunPayload as CuPayload;
      downloadBulkErrorReportCsv(
        "bulk-upload-validation-errors.csv",
        ["Excel row", "UID", "Error"],
        p.errors.map((e) => [String(e.rowNumber), e.uid, e.error]),
      );
    }
  }, [validationHttpFailure, httpFailureParsed, dryRunPayload, cat, cols]);

  const divider = <div className="my-4 h-px bg-gray-100" />;

  const successLabels = {
    aff: affLabel,
    reg: regLabel,
    yr: yearLabel,
    sem: classLabel,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col px-4 py-5 sm:px-7">
      <ExportProgressDialog
        isOpen={exportProgressOpen}
        onClose={() => setExportProgressOpen(false)}
        progressUpdate={progressUpdate}
      />

      {showConfirm && pendingFile ? (
        <ConfirmModal
          fileName={pendingFile.name}
          onConfirm={confirmUpload}
          onCancel={cancelUpload}
        />
      ) : null}

      <div
        className="flex flex-col gap-0 rounded-[20px] border-[1.5px] border-[#e5e7eb] bg-white p-4 shadow-sm sm:p-6"
        style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
      >
        {committed && cat ? (
          <div className="animate-in fade-in duration-300">
            <CommitSuccess
              cat={cat}
              labels={successLabels}
              total={commitCount}
              onReset={fullReset}
              userName={displayName}
            />
          </div>
        ) : (
          <>
            <SectionLabel
              num="1"
              title="Define context"
              color="#4f46e5"
              light="#eef2ff"
              done={contextDone}
              locked={false}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <SelectKey
                label="Affiliation"
                icon={GraduationCap}
                options={affiliations}
                value={affiliationId}
                onChange={(v) => {
                  setAffiliationId(v);
                  const lab = affiliations.find((x) => x.value === v)?.label ?? "";
                  setAffLabel(lab);
                }}
                placeholder={loadingMeta ? "Loading…" : "Select university"}
                color="#4f46e5"
                light="#eef2ff"
                disabled={loadingMeta}
              />
              <SelectKey
                label="Academic year"
                icon={Calendar}
                options={years}
                value={academicYearId}
                onChange={(v) => {
                  setAcademicYearId(v);
                  setYearLabel(years.find((x) => x.value === v)?.label ?? "");
                }}
                placeholder="Select year"
                color="#047857"
                light="#d1fae5"
                disabled={!affiliationId}
              />
              <SelectKey
                label="Regulation"
                icon={BookOpen}
                options={regulations}
                value={regulationTypeId}
                onChange={(v) => {
                  setRegulationTypeId(v);
                  setRegLabel(regulations.find((x) => x.value === v)?.label ?? "");
                }}
                placeholder="Select regulation"
                color="#0369a1"
                light="#e0f2fe"
                disabled={!academicYearId}
              />
              <SelectKey
                label="Semester (class)"
                icon={BookOpen}
                options={classOptions}
                value={classId}
                onChange={(v) => {
                  setClassId(v);
                  setClassLabel(classOptions.find((x) => x.value === v)?.label ?? "");
                }}
                placeholder="Select semester"
                color="#b45309"
                light="#fef3c7"
                disabled={loadingMeta}
              />
            </div>

            {divider}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-6">
              <div
                className="min-w-0 flex-1 lg:min-h-0 lg:border-r lg:border-gray-100 lg:pr-6"
                style={{
                  opacity: contextDone ? 1 : 0.4,
                  pointerEvents: contextDone ? "auto" : "none",
                }}
              >
                <SectionLabel
                  num="2"
                  title="Data category"
                  color="#0369a1"
                  light="#e0f2fe"
                  done={catDone}
                  locked={!contextDone}
                />
                <div className="flex flex-col gap-2">
                  {SELECTABLE_CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const active = cat === c.id;
                    const disabled = c.id === "result_upload";
                    return (
                      <button
                        key={c.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (disabled) return;
                          setCat(c.id);
                          resetFile();
                        }}
                        className="flex w-full cursor-pointer items-start gap-2.5 rounded-xl border-[1.5px] p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50"
                        style={{
                          background: active ? c.light : "#f9fafb",
                          borderColor: active ? c.color : "#e5e7eb",
                          boxShadow: active ? `0 2px 10px ${c.color}18` : "none",
                        }}
                      >
                        <div
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] transition-all"
                          style={{ background: active ? c.color : "#e5e7eb" }}
                        >
                          <Icon size={15} color={active ? "white" : "#6b7280"} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className="mb-0.5 text-xs font-extrabold leading-snug"
                            style={{ color: active ? c.color : "#374151" }}
                          >
                            {c.full}
                            {c.id === "result_upload" ? " (coming soon)" : ""}
                          </div>
                          <div className="text-[10px] font-semibold leading-snug text-gray-400">
                            {COLUMNS[c.id].join(" · ")}
                          </div>
                        </div>
                        {active ? (
                          <CheckCircle2 size={15} color={c.color} className="shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className="min-h-px min-w-0 flex-1 lg:max-w-md lg:flex-[0.92]"
                style={{
                  opacity: catDone ? 1 : 0.4,
                  pointerEvents: catDone ? "auto" : "none",
                }}
              >
                <div className="min-w-0 lg:pt-0">
                  <SectionLabel
                    num="3"
                    title="Download template"
                    color="#047857"
                    light="#d1fae5"
                    done={false}
                    locked={!catDone}
                  />
                  {sel ? (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex flex-wrap gap-1">
                        {cols.map((col, i) => (
                          <span
                            key={col}
                            className="rounded-md border px-2 py-0.5 text-[10px] font-bold"
                            style={{
                              background: sel.light,
                              color: sel.color,
                              borderColor: sel.border,
                            }}
                          >
                            <span className="mr-0.5 opacity-40">{i + 1}.</span>
                            {col}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        disabled={!catDone}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-none py-2.5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ background: sel.color, lineHeight: 1.4 }}
                      >
                        <Download size={13} className="shrink-0" />
                        <span>Download {sel.label} template</span>
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-[10px] border-[1.5px] border-dashed border-[#e5e7eb] bg-gray-50 px-3.5 py-4 text-center">
                      <div className="text-[11px] font-semibold text-gray-400">
                        Complete context and select a data category
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {divider}

            <div
              style={{
                opacity: catDone ? 1 : 0.4,
                pointerEvents: catDone ? "auto" : "none",
              }}
            >
              <SectionLabel
                num="4"
                title="Upload filled file"
                color="#b45309"
                light="#fef3c7"
                done={uploadDone && !hasErrors}
                locked={!catDone}
              />

              {!file && !loading ? (
                <div
                  role="presentation"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDrag(true);
                  }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={onDrop}
                  onClick={() => catDone && fileRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed py-6 text-center transition-all"
                  style={{
                    borderColor: drag ? sel?.color || "#4f46e5" : "#d1d5db",
                    background: drag ? sel?.light || "#eef2ff" : "#fafafa",
                    cursor: catDone ? "pointer" : "not-allowed",
                  }}
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-[11px] transition-all"
                    style={{ background: drag ? sel?.color || "#4f46e5" : "#f3f4f6" }}
                  >
                    <CloudUpload size={18} color={drag ? "white" : "#9ca3af"} />
                  </div>
                  <div>
                    <div
                      className="text-[13px] font-extrabold"
                      style={{ color: drag ? sel?.color || "#4f46e5" : "#374151" }}
                    >
                      {drag ? "Release to upload" : "Drag & drop Excel file here"}
                    </div>
                    <div className="text-[11px] font-semibold text-gray-400">
                      or click to browse · .xlsx, .xls
                    </div>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) pickFile(f);
                      e.target.value = "";
                    }}
                  />
                </div>
              ) : null}

              {loading ? (
                <div className="flex flex-col items-center gap-2.5 py-6 text-center">
                  <div className="inline-block animate-spin">
                    <RefreshCw size={22} color={sel?.color || "#4f46e5"} />
                  </div>
                  <div className="text-[13px] font-extrabold text-gray-800">
                    Validating on server…
                  </div>
                </div>
              ) : null}

              {file && validated && (dryRunPayload || validationHttpFailure) ? (
                <div className="flex flex-col gap-3 md:flex-row md:gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    <div className="flex items-center gap-2 rounded-[10px] border-[1.5px] border-[#e5e7eb] bg-gray-50 px-3 py-2">
                      <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                        <FileUp size={13} color="#059669" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-extrabold text-gray-900">
                          {file.name}
                        </div>
                        <div className="text-[10px] font-semibold text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB ·{" "}
                          {validationHttpFailure
                            ? "Validation finished with issues"
                            : "Validated (simulation)"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={resetFile}
                        className="flex cursor-pointer border-none bg-transparent p-1 text-gray-400"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          label: "Total",
                          v: total == null ? "—" : total,
                          bg: "#f3f4f6",
                          tc: "#374151",
                        },
                        {
                          label: "Valid",
                          v: valid == null ? "—" : valid,
                          bg: "#d1fae5",
                          tc: "#065f46",
                        },
                        { label: "Errors", v: errs, bg: "#fee2e2", tc: "#991b1b" },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className="rounded-[10px] py-2.5 text-center"
                          style={{ background: s.bg }}
                        >
                          <div
                            className="text-[22px] font-black leading-none"
                            style={{ color: s.tc }}
                          >
                            {s.v}
                          </div>
                          <div
                            className="mt-0.5 text-[9px] font-extrabold uppercase tracking-wide opacity-65"
                            style={{ color: s.tc }}
                          >
                            {s.label}
                          </div>
                        </div>
                      ))}
                    </div>
                    {validationHttpFailure && total == null && valid == null ? (
                      <p className="text-[10px] font-semibold text-gray-400">
                        Row totals may be unknown until the file passes server checks. Use the table
                        below for details.
                      </p>
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    {hasErrors ? (
                      <div className="rounded-[11px] border-[1.5px] border-red-300 bg-red-50 px-3.5 py-3">
                        <div className="mb-1 flex items-center gap-2">
                          <ShieldAlert size={15} color="#dc2626" />
                          <div className="text-xs font-black text-red-900">
                            Upload blocked — {errs} error{errs !== 1 ? "s" : ""}
                          </div>
                        </div>
                        <p className="text-[11px] font-semibold leading-relaxed text-red-600">
                          Fix errors in your file and re-upload. See the validation table below.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-[11px] border-[1.5px] border-green-200 bg-green-50 px-3.5 py-3">
                        <div className="mb-1 flex items-center gap-2">
                          <CheckCircle2 size={15} color="#16a34a" />
                          <div className="text-xs font-black text-green-800">Ready to commit</div>
                        </div>
                        <p className="mb-2.5 text-[11px] font-semibold leading-relaxed text-green-700">
                          Submitting will write to the database. Progress is shown in real time.
                        </p>
                        <button
                          type="button"
                          onClick={handleCommit}
                          disabled={committing}
                          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-none py-2 text-xs font-extrabold text-white disabled:cursor-not-allowed"
                          style={{
                            background: committing ? "#86efac" : "#16a34a",
                          }}
                        >
                          {committing ? (
                            <>
                              <span className="inline-block animate-spin">
                                <RefreshCw size={13} />
                              </span>{" "}
                              Submitting…
                            </>
                          ) : (
                            <>
                              <Upload size={13} /> Commit to database
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {uploadDone ? (
              <>
                {divider}
                <SectionLabel
                  num="5"
                  title="Review"
                  color="#7c3aed"
                  light="#ede9fe"
                  done={false}
                  locked={false}
                />

                {hasErrors ? (
                  <div className="mb-3 flex flex-col gap-3 rounded-[11px] border-2 border-red-300 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <ShieldAlert size={17} color="#dc2626" className="mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black text-red-900">
                          Upload blocked — {errs} error{errs !== 1 ? "s" : ""} must be fixed before
                          committing
                        </div>
                        <div className="text-[11px] font-semibold text-red-600">
                          Download the error report, correct your Excel file, and re-upload.
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadErrorReport}
                      className="flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg border-none bg-red-600 px-4 py-2 text-[11px] font-extrabold text-white"
                    >
                      <Download size={12} /> Download error report
                    </button>
                  </div>
                ) : (
                  <div className="mb-3 flex flex-col gap-3 rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-3 sm:flex-row sm:items-center">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-green-600 shadow-md">
                      <CheckCircle2 size={18} color="white" strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-0.5 text-[13px] font-black text-green-900">
                        All checks passed for {valid} row(s)
                      </div>
                      <p className="text-[11px] font-semibold leading-snug text-green-700">
                        Use <b>Commit to database</b> above to apply changes.
                      </p>
                    </div>
                  </div>
                )}

                <div
                  className="rounded-xl border-[1.5px]"
                  style={{ borderColor: hasErrors ? "#fca5a5" : "#bbf7d0" }}
                >
                  <div
                    className="flex flex-wrap items-center gap-2 border-b-[1.5px] px-4 py-2"
                    style={{
                      background: hasErrors ? "#fff8f8" : "#f0fdf4",
                      borderColor: hasErrors ? "#fca5a5" : "#bbf7d0",
                    }}
                  >
                    <Eye size={12} color="#7c3aed" />
                    <span className="text-xs font-black text-gray-900">Validation detail</span>
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                      {total == null ? "—" : total} rows
                    </span>
                    {valid != null && valid > 0 ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        {valid} valid
                      </span>
                    ) : null}
                    {errs > 0 ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-800">
                        {errs} errors
                      </span>
                    ) : null}
                  </div>
                  <div className="overflow-x-auto">
                    {cat === "form_fillup" && dryRunPayload && "summary" in dryRunPayload ? (
                      <table className="w-full min-w-[640px] border-collapse text-xs">
                        <thead>
                          <tr className="border-b-[1.5px] border-gray-100 bg-gray-50">
                            <th className="px-3.5 py-1.5 text-left text-[10px] font-black uppercase text-gray-400">
                              #
                            </th>
                            {cols.map((c) => (
                              <th
                                key={c}
                                className="whitespace-nowrap px-3.5 py-1.5 text-left text-[10px] font-black uppercase text-gray-600"
                              >
                                {c}
                              </th>
                            ))}
                            <th className="px-3.5 py-1.5 text-left text-[10px] font-black uppercase text-gray-600">
                              Status
                            </th>
                            <th className="px-3.5 py-1.5 text-left text-[10px] font-black uppercase text-gray-600">
                              Detail
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from(
                            { length: (dryRunPayload as ExamPayload).summary.total },
                            (_, i) => {
                              const rowNum = i + 1;
                              const exam = dryRunPayload as ExamPayload;
                              const rowErr = exam.errors.find((e) => e.row === rowNum);
                              const ok = !rowErr;
                              const fileRow = exam.fileRows?.find((f) => f.row === rowNum);
                              return (
                                <tr
                                  key={rowNum}
                                  className="border-b border-gray-50"
                                  style={{ background: ok ? "white" : "#fff8f8" }}
                                >
                                  <td className="px-3.5 py-2 text-[11px] font-extrabold text-gray-300">
                                    {rowNum}
                                  </td>
                                  {cols.map((col) => {
                                    const fromErr = rowErr?.data?.[col];
                                    const fromFile = fileRow?.[col];
                                    const v =
                                      fromErr != null && fromErr !== ""
                                        ? String(fromErr)
                                        : fromFile != null && String(fromFile).trim() !== ""
                                          ? String(fromFile)
                                          : null;
                                    return (
                                      <td
                                        key={col}
                                        className="px-3.5 py-2 font-medium text-gray-900"
                                      >
                                        {v != null ? v : "—"}
                                      </td>
                                    );
                                  })}
                                  <td className="px-3.5 py-2">
                                    <StatusBadge s={ok ? "ok" : "err"} e={rowErr?.error} />
                                  </td>
                                  <td
                                    className={`px-3.5 py-2 text-[11px] font-semibold ${rowErr ? "text-red-600" : "text-gray-400"}`}
                                  >
                                    {rowErr?.error ?? "—"}
                                  </td>
                                </tr>
                              );
                            },
                          )}
                        </tbody>
                      </table>
                    ) : null}

                    {validationHttpFailure &&
                    httpFailureParsed &&
                    httpFailureParsed.parsed.length > 0 ? (
                      <table className="w-full min-w-[520px] border-collapse text-xs">
                        <thead>
                          <tr className="border-b-[1.5px] border-gray-100 bg-gray-50">
                            <th className="px-3.5 py-1.5 text-left text-[10px] font-black uppercase text-gray-400">
                              #
                            </th>
                            <th className="px-3.5 py-1.5 text-left text-[10px] font-black uppercase text-gray-600">
                              Row (Excel)
                            </th>
                            <th className="px-3.5 py-1.5 text-left text-[10px] font-black uppercase text-gray-600">
                              Error detail
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {httpFailureParsed.parsed.map((row, i) => (
                            <tr key={i} className="border-b border-red-50 bg-red-50/40">
                              <td className="px-3.5 py-2 text-[11px] font-extrabold text-gray-300">
                                {i + 1}
                              </td>
                              <td className="px-3.5 py-2 font-mono font-medium text-gray-900">
                                {row.row}
                              </td>
                              <td className="px-3.5 py-2 font-semibold text-red-600">{row.text}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : validationHttpFailure &&
                      httpFailureParsed &&
                      httpFailureParsed.rawMessages.length > 0 ? (
                      <table className="w-full min-w-[480px] border-collapse text-xs">
                        <thead>
                          <tr className="border-b-[1.5px] border-gray-100 bg-gray-50">
                            <th className="px-3.5 py-1.5 text-left text-[10px] font-black uppercase text-gray-400">
                              #
                            </th>
                            <th className="px-3.5 py-1.5 text-left text-[10px] font-black uppercase text-gray-600">
                              Message
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {httpFailureParsed.rawMessages.map((m, i) => (
                            <tr key={i} className="border-b border-red-50 bg-red-50/40">
                              <td className="px-3.5 py-2 text-[11px] font-extrabold text-gray-300">
                                {i + 1}
                              </td>
                              <td className="px-3.5 py-2 font-semibold text-red-700">{m}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : null}

                    {cat === "reg_roll" && dryRunPayload && "totalRows" in dryRunPayload ? (
                      <div className="p-4 text-xs">
                        {(dryRunPayload as CuPayload).notFound.length > 0 ? (
                          <p className="mb-2 font-semibold text-red-600">
                            Not found: {(dryRunPayload as CuPayload).notFound.join(", ")}
                          </p>
                        ) : null}
                        {(dryRunPayload as CuPayload).duplicates.length > 0 ? (
                          <p className="mb-2 font-semibold text-amber-800">
                            Duplicate UIDs in file — review rows{" "}
                            {(dryRunPayload as CuPayload).duplicates
                              .map((d) => d.rowNumbers.join(", "))
                              .join("; ")}
                          </p>
                        ) : null}
                        <table className="w-full min-w-[640px] border-collapse">
                          <thead>
                            <tr className="border-b-[1.5px] border-gray-100 bg-gray-50">
                              <th className="px-3.5 py-1.5 text-left text-[10px] font-black uppercase text-gray-400">
                                #
                              </th>
                              <th className="whitespace-nowrap px-3.5 py-1.5 text-left text-[10px] font-black uppercase text-gray-600">
                                UID
                              </th>
                              <th className="whitespace-nowrap px-3.5 py-1.5 text-left text-[10px] font-black uppercase text-gray-600">
                                CU Reg Number
                              </th>
                              <th className="whitespace-nowrap px-3.5 py-1.5 text-left text-[10px] font-black uppercase text-gray-600">
                                CU Roll Number
                              </th>
                              <th className="px-3.5 py-1.5 text-left text-[10px] font-black uppercase text-gray-600">
                                Status
                              </th>
                              <th className="px-3.5 py-1.5 text-left text-[10px] font-black uppercase text-gray-600">
                                Error detail
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from(
                              { length: (dryRunPayload as CuPayload).totalRows },
                              (_, i) => {
                                const excelRow = i + 2;
                                const cu = dryRunPayload as CuPayload;
                                const err = cu.errors.find((e) => e.rowNumber === excelRow);
                                const fr = cu.fileRows?.find((r) => r.rowNumber === excelRow);
                                const ok = !err;
                                const uid = displayCell(fr?.uid ?? err?.uid);
                                const reg = displayCell(fr?.cuRegistrationNumber);
                                const roll = displayCell(fr?.cuRollNumber);
                                return (
                                  <tr
                                    key={excelRow}
                                    className="border-b border-gray-50"
                                    style={{ background: ok ? "white" : "#fff8f8" }}
                                  >
                                    <td className="px-3.5 py-2 text-[11px] font-extrabold text-gray-300">
                                      {i + 1}
                                    </td>
                                    <td className="px-3.5 py-2 font-mono font-medium text-gray-900">
                                      {uid}
                                    </td>
                                    <td className="px-3.5 py-2 text-gray-900">{reg}</td>
                                    <td className="px-3.5 py-2 text-gray-900">{roll}</td>
                                    <td className="px-3.5 py-2">
                                      <StatusBadge s={ok ? "ok" : "err"} e={err?.error} />
                                    </td>
                                    <td
                                      className={`px-3.5 py-2 text-[11px] font-semibold ${err ? "text-red-600" : "text-gray-400"}`}
                                    >
                                      {err?.error ?? "—"}
                                    </td>
                                  </tr>
                                );
                              },
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
