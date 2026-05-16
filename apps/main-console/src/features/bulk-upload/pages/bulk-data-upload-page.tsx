import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import {
  fetchAvailableAffiliations,
  fetchAcademicYearsByAffiliation,
  fetchRegulationTypes,
} from "@/services/cascading-dropdowns-axios.api";
import { fetchAllClasses } from "@/services/classes.api";
import {
  downloadBulkDataExport,
  downloadBulkDataUploadTemplate,
} from "@/services/bulk-data-upload.api";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Database,
  Download,
  FileDown,
  FolderDown,
  GraduationCap,
  Layers,
  Upload,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CATEGORIES } from "../constants";
import { BulkUploadDataPanel } from "../components/bulk-upload-data-panel";

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
  icon?: typeof GraduationCap;
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
      </button>
      {open && !disabled ? (
        <div className="absolute z-[999] mt-1 max-h-60 w-full overflow-y-auto rounded-[11px] border border-[#e5e7eb] bg-white shadow-xl">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className="block w-full cursor-pointer px-3 py-2 text-left text-xs"
              style={{
                fontWeight: value === o.value ? 700 : 500,
                color: value === o.value ? color : "#374151",
                background: value === o.value ? light : "white",
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

function DownloadModule() {
  const [affiliations, setAffiliations] = useState<Option[]>([]);
  const [years, setYears] = useState<Option[]>([]);
  const [regulations, setRegulations] = useState<Option[]>([]);
  const [classes, setClasses] = useState<Option[]>([]);
  const [affiliationId, setAffiliationId] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [regulationTypeId, setRegulationTypeId] = useState("");
  const [classId, setClassId] = useState("");
  const [dlCat, setDlCat] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let c = false;
    (async () => {
      try {
        const [affs, cls] = await Promise.all([fetchAvailableAffiliations(), fetchAllClasses()]);
        if (c) return;
        setAffiliations(affs.map((a) => ({ value: String(a.id), label: a.name })));
        setClasses(
          cls
            .filter((x) => x.type === "SEMESTER")
            .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
            .map((x) => ({ value: String(x.id), label: x.name })),
        );
      } catch {
        toast.error("Failed to load filters");
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
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
    let c = false;
    (async () => {
      try {
        const list = await fetchAcademicYearsByAffiliation(Number(affiliationId));
        if (c) return;
        setYears(list.map((y) => ({ value: String(y.id), label: y.year })));
        setAcademicYearId("");
        setRegulations([]);
        setRegulationTypeId("");
      } catch {
        toast.error("Failed to load academic years");
      }
    })();
    return () => {
      c = true;
    };
  }, [affiliationId]);

  useEffect(() => {
    if (!affiliationId || !academicYearId) {
      setRegulations([]);
      setRegulationTypeId("");
      return;
    }
    let c = false;
    (async () => {
      try {
        const list = await fetchRegulationTypes(Number(affiliationId), Number(academicYearId));
        if (c) return;
        setRegulations(list.map((r) => ({ value: String(r.id), label: r.name })));
        setRegulationTypeId("");
      } catch {
        toast.error("Failed to load regulations");
      }
    })();
    return () => {
      c = true;
    };
  }, [affiliationId, academicYearId]);

  const dlReady = !!(affiliationId && academicYearId && regulationTypeId && dlCat);
  const selCat = CATEGORIES.find((c) => c.full === dlCat);

  const downloadTemplateForCategory = useCallback(async () => {
    if (!dlCat) {
      toast.error("Select a data category");
      return;
    }
    const cat = CATEGORIES.find((c) => c.full === dlCat);
    if (!cat || cat.id === "result_upload") {
      toast.error("This export is not available yet");
      return;
    }
    const mode = cat.id === "reg_roll" ? "cu-reg-roll" : "exam-form-fillup";
    try {
      const blob = await downloadBulkDataUploadTemplate(mode);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        mode === "cu-reg-roll"
          ? "bulk-upload-cu-reg-roll-template.xlsx"
          : "bulk-upload-exam-form-fillup-template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Download failed");
    }
  }, [dlCat]);

  const downloadFilteredRecords = useCallback(async () => {
    if (!dlReady || !selCat) return;
    if (selCat.id === "result_upload") {
      toast.error("This export is not available yet");
      return;
    }
    setExporting(true);
    try {
      const mode = selCat.id === "reg_roll" ? "cu-reg-roll" : "exam-form-fillup";
      const blob = await downloadBulkDataExport({
        mode,
        affiliationId: Number(affiliationId),
        regulationTypeId: Number(regulationTypeId),
        academicYearId: Number(academicYearId),
        ...(classId ? { classId: Number(classId) } : {}),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        mode === "cu-reg-roll"
          ? "bulk-data-cu-reg-roll-records.xlsx"
          : "bulk-data-exam-form-fillup-records.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Records downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setExporting(false);
    }
  }, [dlReady, selCat, affiliationId, regulationTypeId, academicYearId, classId]);

  const chipData = useMemo(
    () =>
      [
        { label: "Affiliation", val: affiliations.find((x) => x.value === affiliationId)?.label },
        { label: "Regulation", val: regulations.find((x) => x.value === regulationTypeId)?.label },
        { label: "Academic Year", val: years.find((x) => x.value === academicYearId)?.label },
        { label: "Data Category", val: selCat?.label ?? dlCat },
        ...(classId
          ? [{ label: "Semester / Class", val: classes.find((x) => x.value === classId)?.label }]
          : []),
      ].filter((x) => x.val),
    [
      affiliationId,
      academicYearId,
      regulationTypeId,
      classId,
      dlCat,
      affiliations,
      years,
      regulations,
      classes,
      selCat?.label,
    ],
  );

  return (
    <div className="flex-1 overflow-auto px-4 py-5 sm:px-7">
      <div
        className="flex flex-col gap-4 rounded-[20px] border border-[#e5e7eb] bg-white p-4 shadow-sm sm:p-6"
        style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
      >
        <div>
          <div className="mb-1 text-base font-black text-gray-900">Download existing records</div>
          <p className="text-xs font-semibold leading-relaxed text-gray-500">
            Set affiliation, academic year, regulation, and data category to match your upload
            context. Optionally narrow by semester. Download records exports live data for those
            filters; Empty template downloads a blank sheet with headers only.
          </p>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
          <SelectKey
            label="Affiliation"
            icon={GraduationCap}
            options={affiliations}
            value={affiliationId}
            onChange={setAffiliationId}
            placeholder={loading ? "Loading…" : "Select university"}
            color="#4f46e5"
            light="#eef2ff"
            disabled={loading}
          />
          <SelectKey
            label="Academic year"
            icon={Calendar}
            options={years}
            value={academicYearId}
            onChange={setAcademicYearId}
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
            onChange={setRegulationTypeId}
            placeholder="Select regulation"
            color="#0369a1"
            light="#e0f2fe"
            disabled={!academicYearId}
          />
          <SelectKey
            label="Data category"
            icon={Database}
            options={CATEGORIES.filter((c) => c.id !== "result_upload").map((c) => ({
              value: c.full,
              label: c.full,
            }))}
            value={dlCat}
            onChange={setDlCat}
            placeholder="Select category"
            color="#7c3aed"
            light="#ede9fe"
          />
          <SelectKey
            label="Semester / Class (optional)"
            icon={BookOpen}
            options={classes}
            value={classId}
            onChange={setClassId}
            placeholder="All semesters"
            color="#b45309"
            light="#fef3c7"
            disabled={loading}
          />
        </div>
        {!dlReady ? (
          <div className="flex items-center gap-2.5 rounded-[11px] border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertCircle size={15} color="#d97706" className="shrink-0" />
            <span className="text-xs font-bold text-amber-900">
              Select affiliation, academic year, regulation, and data category to enable download.
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-[13px] border border-indigo-200 bg-indigo-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {chipData.map((t) => (
                <div
                  key={t.label}
                  className="flex flex-col gap-0.5 rounded-md px-2.5 py-1"
                  style={{
                    background: "#eef2ff",
                  }}
                >
                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-600 opacity-70">
                    {t.label}
                  </span>
                  <span className="max-w-[180px] truncate text-[11px] font-extrabold text-indigo-800">
                    {t.val}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={exporting}
                onClick={downloadFilteredRecords}
                className="flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[11px] border-none bg-emerald-600 px-5 py-2.5 text-sm font-black text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                style={{ boxShadow: "0 4px 12px rgba(5,150,105,0.25)" }}
              >
                <Download size={14} /> {exporting ? "Preparing…" : "Download records"}
              </button>
              <button
                type="button"
                onClick={downloadTemplateForCategory}
                className="flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[11px] border border-indigo-300 bg-white px-4 py-2.5 text-xs font-extrabold text-indigo-800 shadow-sm"
              >
                <FileDown size={14} /> Empty template
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Bulk Data Management — upload / download with backend validation, dry-run, and Socket.IO progress.
 */
export default function BulkDataUploadPage() {
  useRestrictTempUsers();
  const [mode, setMode] = useState<"upload" | "download">("upload");

  return (
    <div
      className="flex min-h-0 flex-1 flex-col bg-[#f0f2f5] font-sans"
      style={{ fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif" }}
    >
      <header className="z-10 flex min-h-[52px] shrink-0 flex-col gap-3 border-b border-[#e5e7eb] bg-white px-4 py-3 sm:h-[52px] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0">
        <div className="flex items-center gap-2.5">
          <div className="flex rounded-lg bg-indigo-50 px-1.5 py-1">
            <Layers size={17} color="#4f46e5" />
          </div>
          <div>
            <div className="text-sm font-black leading-tight text-gray-900">
              Bulk Data Management
            </div>
            <div className="text-[10px] font-bold tracking-wide text-gray-400">
              Educational ERP · Student Records
            </div>
          </div>
        </div>
        <div className="flex w-full gap-0.5 rounded-[11px] bg-gray-100 p-0.5 sm:w-auto">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition-all sm:flex-initial"
            style={{
              background: mode === "upload" ? "white" : "transparent",
              color: mode === "upload" ? "#4f46e5" : "#6b7280",
              boxShadow: mode === "upload" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <Upload size={12} /> Upload Data
          </button>
          <button
            type="button"
            onClick={() => setMode("download")}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition-all sm:flex-initial"
            style={{
              background: mode === "download" ? "white" : "transparent",
              color: mode === "download" ? "#047857" : "#6b7280",
              boxShadow: mode === "download" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <FolderDown size={12} /> Download Data
          </button>
        </div>
        <div className="hidden items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-100 px-2.5 py-1 text-[11px] font-extrabold text-emerald-800 sm:flex">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          System Active
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        {mode === "upload" ? <BulkUploadDataPanel /> : null}
        {mode === "download" ? <DownloadModule /> : null}
      </div>
    </div>
  );
}
