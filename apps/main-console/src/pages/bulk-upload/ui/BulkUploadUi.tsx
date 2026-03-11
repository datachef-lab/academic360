import { type DragEvent, useCallback, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  Database,
  Download,
  Eye,
  FileDown,
  FileSpreadsheet,
  FileUp,
  FolderDown,
  GraduationCap,
  Layers,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Upload,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";

const AFFILIATIONS = ["Calcutta University", "Jadavpur University", "Presidency University", "WBUT"];
const REGULATIONS = ["Regulation 2019", "Regulation 2021", "Regulation 2023", "CBCS 2017"];
const YEARS = ["2024-25", "2023-24", "2022-23", "2021-22"];
const SEMESTERS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

type CategoryId = "reg_roll" | "form_fillup" | "result_upload";
type SampleRow = {
  _s: "ok" | "err";
  _e?: string;
} & Record<string, string>;

const CATEGORIES = [
  {
    id: "reg_roll",
    label: "CU Reg & Roll Number",
    full: "CU Reg Number and Roll Number",
    icon: Database,
    color: "#4f46e5",
    light: "#eef2ff",
    border: "#c7d2fe",
  },
  {
    id: "form_fillup",
    label: "Form Fill Up Data",
    full: "Form Fill Up Data",
    icon: BookOpen,
    color: "#0369a1",
    light: "#e0f2fe",
    border: "#bae6fd",
  },
  {
    id: "result_upload",
    label: "Result Upload",
    full: "Result Upload",
    icon: GraduationCap,
    color: "#047857",
    light: "#d1fae5",
    border: "#a7f3d0",
  },
];

const COLUMNS: Record<CategoryId, string[]> = {
  reg_roll: ["UID", "CU Reg Number", "CU Roll Number"],
  form_fillup: ["CU Reg Number", "CU Roll Number", "Appear Type", "Approval Status", "Form Filled By"],
  result_upload: ["CU Reg Number", "CU Roll Number", "Appear Type", "Result Status"],
};

const SAMPLE_CLEAN: Record<CategoryId, SampleRow[]> = {
  reg_roll: [
    { UID: "STU001", "CU Reg Number": "2021-0001", "CU Roll Number": "10101", _s: "ok" },
    { UID: "STU002", "CU Reg Number": "2021-0002", "CU Roll Number": "10102", _s: "ok" },
    { UID: "STU003", "CU Reg Number": "2021-0003", "CU Roll Number": "10103", _s: "ok" },
    { UID: "STU004", "CU Reg Number": "2021-0004", "CU Roll Number": "10104", _s: "ok" },
    { UID: "STU005", "CU Reg Number": "2021-0005", "CU Roll Number": "10105", _s: "ok" },
  ],
  form_fillup: [
    {
      "CU Reg Number": "2021-0001",
      "CU Roll Number": "10101",
      "Appear Type": "Regular",
      "Approval Status": "Approved",
      "Form Filled By": "Admin",
      _s: "ok",
    },
    {
      "CU Reg Number": "2021-0002",
      "CU Roll Number": "10102",
      "Appear Type": "Back",
      "Approval Status": "Approved",
      "Form Filled By": "Student",
      _s: "ok",
    },
    {
      "CU Reg Number": "2021-0003",
      "CU Roll Number": "10103",
      "Appear Type": "Regular",
      "Approval Status": "Approved",
      "Form Filled By": "Admin",
      _s: "ok",
    },
  ],
  result_upload: [
    {
      "CU Reg Number": "2021-0001",
      "CU Roll Number": "10101",
      "Appear Type": "Regular",
      "Result Status": "Pass",
      _s: "ok",
    },
    {
      "CU Reg Number": "2021-0002",
      "CU Roll Number": "10102",
      "Appear Type": "Back",
      "Result Status": "Fail",
      _s: "ok",
    },
    {
      "CU Reg Number": "2021-0003",
      "CU Roll Number": "10103",
      "Appear Type": "Regular",
      "Result Status": "Pass",
      _s: "ok",
    },
  ],
};

const SAMPLE_ERRORS: Record<CategoryId, SampleRow[]> = {
  reg_roll: [
    { UID: "STU001", "CU Reg Number": "2021-0001", "CU Roll Number": "10101", _s: "ok" },
    { UID: "STU002", "CU Reg Number": "", "CU Roll Number": "10102", _s: "err", _e: "CU Reg Number is missing" },
    { UID: "STU003", "CU Reg Number": "2021-0003", "CU Roll Number": "10103", _s: "ok" },
    { UID: "STU004", "CU Reg Number": "2021-0004", "CU Roll Number": "", _s: "err", _e: "CU Roll Number is missing" },
    { UID: "STU005", "CU Reg Number": "2021-0005", "CU Roll Number": "10105", _s: "ok" },
  ],
  form_fillup: [
    {
      "CU Reg Number": "2021-0001",
      "CU Roll Number": "10101",
      "Appear Type": "Regular",
      "Approval Status": "Approved",
      "Form Filled By": "Admin",
      _s: "ok",
    },
    {
      "CU Reg Number": "2021-0002",
      "CU Roll Number": "10102",
      "Appear Type": "Back",
      "Approval Status": "Pending",
      "Form Filled By": "Student",
      _s: "err",
      _e: "Approval Status cannot be Pending",
    },
    {
      "CU Reg Number": "2021-0003",
      "CU Roll Number": "",
      "Appear Type": "Regular",
      "Approval Status": "",
      "Form Filled By": "Admin",
      _s: "err",
      _e: "CU Roll Number and Approval Status missing",
    },
  ],
  result_upload: [
    {
      "CU Reg Number": "2021-0001",
      "CU Roll Number": "10101",
      "Appear Type": "Regular",
      "Result Status": "Pass",
      _s: "ok",
    },
    {
      "CU Reg Number": "2021-0002",
      "CU Roll Number": "10102",
      "Appear Type": "Back",
      "Result Status": "Fail",
      _s: "ok",
    },
    {
      "CU Reg Number": "2021-0003",
      "CU Roll Number": "10103",
      "Appear Type": "Regular",
      "Result Status": "",
      _s: "err",
      _e: "Result Status is missing",
    },
  ],
};

function Select({
  label,
  icon: Icon,
  options,
  value,
  onChange,
  placeholder,
  color,
  light,
  disabled,
}: {
  label?: string;
  icon?: LucideIcon;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  color: string;
  light: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
      {label && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: disabled ? "#c4c9d4" : "#6b7280",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
        >
          {label}
        </div>
      )}
      <button
        onClick={() => {
          if (!disabled) setOpen((o) => !o);
        }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "8px 12px",
          borderRadius: 9,
          fontSize: 12,
          fontWeight: 600,
          transition: "all .15s",
          background: disabled ? "#f9fafb" : "white",
          border: `1.5px solid ${open ? color : disabled ? "#f0f0f0" : "#d1d5db"}`,
          color: disabled ? "#c4c9d4" : value ? "#111827" : "#9ca3af",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: open ? `0 0 0 3px ${light}` : "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {Icon && <Icon size={13} color={disabled ? "#d1d5db" : value ? color : "#9ca3af"} style={{ flexShrink: 0 }} />}
        <span
          style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {value || placeholder}
        </span>
        <ChevronDown
          size={11}
          color={disabled ? "#d1d5db" : "#9ca3af"}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }}
        />
      </button>
      {open && !disabled && (
        <div
          style={{
            position: "absolute",
            zIndex: 999,
            marginTop: 4,
            width: "100%",
            background: "white",
            borderRadius: 11,
            overflow: "hidden",
            border: "1.5px solid #e5e7eb",
            boxShadow: "0 12px 28px rgba(0,0,0,0.12)",
          }}
        >
          {options.map((o) => (
            <button
              key={o}
              onClick={() => {
                onChange(o);
                setOpen(false);
              }}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "8px 13px",
                fontSize: 12,
                fontWeight: value === o ? 700 : 500,
                color: value === o ? color : "#374151",
                background: value === o ? light : "white",
                borderLeft: value === o ? `3px solid ${color}` : "3px solid transparent",
                border: "none",
                cursor: "pointer",
                display: "block",
              }}
              onMouseEnter={(e) => {
                if (value !== o) e.currentTarget.style.background = "#f9fafb";
              }}
              onMouseLeave={(e) => {
                if (value !== o) e.currentTarget.style.background = "white";
              }}
            >
              {o}
            </button>
          ))}
        </div>
      )}
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
    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: done ? "#16a34a" : locked ? "#e5e7eb" : light,
          border: `2px solid ${done ? "#16a34a" : locked ? "#e5e7eb" : color}`,
        }}
      >
        {done ? (
          <CheckCircle2 size={12} color="white" strokeWidth={2.5} />
        ) : (
          <span style={{ fontSize: 10, fontWeight: 900, color: locked ? "#9ca3af" : color }}>{num}</span>
        )}
      </div>
      <span style={{ fontSize: 13, fontWeight: 900, color: locked ? "#9ca3af" : done ? "#15803d" : "#111827" }}>
        {title}
      </span>
      {done && <span style={{ fontSize: 10, fontWeight: 800, color: "#16a34a", marginLeft: 2 }}>✓</span>}
    </div>
  );
}

function StatusBadge({ s, e }: { s: "ok" | "err"; e?: string }) {
  if (s === "ok") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          padding: "2px 9px",
          borderRadius: 99,
          background: "#d1fae5",
          color: "#065f46",
          fontSize: 11,
          fontWeight: 800,
        }}
      >
        <CheckCircle2 size={10} /> Valid
      </span>
    );
  }
  return (
    <span
      title={e}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 9px",
        borderRadius: 99,
        background: "#fee2e2",
        color: "#991b1b",
        fontSize: 11,
        fontWeight: 800,
        cursor: "help",
      }}
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
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: 30,
          width: 420,
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          border: "1.5px solid #e5e7eb",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "#fef3c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <AlertTriangle size={22} color="#d97706" />
        </div>
        <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", marginBottom: 6 }}>Confirm Upload</div>
        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 14, lineHeight: 1.6 }}>
          The following file is about to be uploaded for validation:
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "10px 14px",
            background: "#f9fafb",
            border: "1.5px solid #e5e7eb",
            borderRadius: 11,
            marginBottom: 13,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "#d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileSpreadsheet size={16} color="#059669" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>{fileName}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>Excel File · Pending upload</div>
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#92400e",
            fontWeight: 600,
            marginBottom: 18,
            padding: "9px 13px",
            background: "#fffbeb",
            border: "1.5px solid #fde68a",
            borderRadius: 9,
            lineHeight: 1.6,
          }}
        >
          ⚠ Please confirm this is the correct file before proceeding.
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 11,
              background: "white",
              border: "1.5px solid #e5e7eb",
              color: "#374151",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 11,
              background: "#4f46e5",
              color: "white",
              fontWeight: 800,
              fontSize: 13,
              border: "none",
              cursor: "pointer",
            }}
          >
            Yes, Upload File
          </button>
        </div>
      </div>
    </div>
  );
}

function CommitSuccess({
  cat,
  aff,
  reg,
  yr,
  sem,
  total,
  onReset,
}: {
  cat: string;
  aff: string;
  reg: string;
  yr: string;
  sem: string;
  total: number;
  onReset: () => void;
}) {
  const sel = CATEGORIES.find((c) => c.id === cat);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "36px 24px",
        textAlign: "center",
        gap: 0,
      }}
    >
      <div style={{ position: "relative", width: 88, height: 88, marginBottom: 20 }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: "#d1fae5",
            animation: "ping 1.5s ease-out 1",
          }}
        >
          <style>{`@keyframes ping{0%{transform:scale(1);opacity:0.8}100%{transform:scale(1.6);opacity:0}}`}</style>
        </div>
        <div
          style={{
            position: "relative",
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#16a34a,#059669)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 24px rgba(22,163,74,0.35)",
          }}
        >
          <CheckCircle2 size={38} color="white" strokeWidth={2} />
        </div>
      </div>

      <div style={{ fontSize: 22, fontWeight: 900, color: "#111827", marginBottom: 6 }}>
        Data Submitted Successfully!
      </div>
      <div
        style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 24, lineHeight: 1.6, maxWidth: 400 }}
      >
        All <b style={{ color: "#16a34a" }}>{total} records</b> from your file have been pushed to the database and are
        now live.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 28 }}>
        {[
          { label: "Affiliation", val: aff, color: "#4f46e5", bg: "#eef2ff" },
          { label: "Regulation", val: reg, color: "#0369a1", bg: "#e0f2fe" },
          { label: "Academic Year", val: yr, color: "#047857", bg: "#d1fae5" },
          { label: "Semester", val: `Sem ${sem}`, color: "#b45309", bg: "#fef3c7" },
          { label: "Category", val: sel?.label || cat, color: sel?.color || "#7c3aed", bg: sel?.light || "#ede9fe" },
          { label: "Records", val: `${total} pushed`, color: "#16a34a", bg: "#dcfce7" },
        ].map((t) => (
          <div
            key={t.label}
            style={{
              padding: "5px 12px",
              borderRadius: 8,
              background: t.bg,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 900,
                color: t.color,
                opacity: 0.55,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {t.label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 800, color: t.color }}>{t.val}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "8px 16px",
          background: "#f9fafb",
          border: "1.5px solid #e5e7eb",
          borderRadius: 10,
          marginBottom: 28,
          fontSize: 12,
          fontWeight: 700,
          color: "#6b7280",
        }}
      >
        <CheckCircle2 size={13} color="#16a34a" />
        Uploaded on {new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} by{" "}
        <span style={{ color: "#111827", fontWeight: 900, marginLeft: 4 }}>Dipanwita Sarkar</span>
      </div>

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={onReset}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 20px",
            borderRadius: 11,
            background: "#4f46e5",
            color: "white",
            fontWeight: 800,
            fontSize: 12,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(79,70,229,0.25)",
          }}
        >
          <RotateCcw size={13} /> Upload Another File
        </button>
      </div>
    </div>
  );
}

function UploadModule() {
  const [aff, setAff] = useState("");
  const [reg, setReg] = useState("");
  const [yr, setYr] = useState("");
  const [sem, setSem] = useState("");
  const [cat, setCat] = useState("");
  const [useErrors, setUseErrors] = useState(false);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const SAMPLE = useErrors ? SAMPLE_ERRORS : SAMPLE_CLEAN;

  const contextDone = !!(aff && reg && yr && sem);
  const catDone = !!(contextDone && cat);
  const uploadDone = !!(catDone && file && validated);

  const sel = CATEGORIES.find((c) => c.id === cat);
  const cols: string[] = (COLUMNS as Record<string, string[]>)[cat] ?? [];
  const rows: SampleRow[] = (SAMPLE as Record<string, SampleRow[]>)[cat] ?? [];
  const total = rows.length;
  const valid = rows.filter((r) => r._s === "ok").length;
  const errs = rows.filter((r) => r._s === "err").length;
  const hasErrors = errs > 0;

  function pickFile(f: File) {
    setPendingFile(f);
    setShowConfirm(true);
  }
  function confirmUpload() {
    setShowConfirm(false);
    setFile(pendingFile);
    setValidated(false);
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      setValidated(true);
    }, 1600);
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
  }
  function fullReset() {
    resetFile();
    setAff("");
    setReg("");
    setYr("");
    setSem("");
    setCat("");
  }

  function handleCommit() {
    setCommitting(true);
    window.setTimeout(() => {
      setCommitting(false);
      setCommitted(true);
    }, 2000);
  }

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer.files[0];
      if (f) pickFile(f);
    },
    [setDrag],
  );

  const divider = <div style={{ height: "1px", background: "#f3f4f6", margin: "16px 0" }} />;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes bar{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes commitpulse{0%,100%{box-shadow:0 4px 16px rgba(22,163,74,0.3)}50%{box-shadow:0 4px 32px rgba(22,163,74,0.6)}}
      `}</style>
      {showConfirm && (
        <ConfirmModal fileName={pendingFile?.name || ""} onConfirm={confirmUpload} onCancel={cancelUpload} />
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          padding: "9px 14px",
          background: "white",
          borderRadius: 11,
          border: "1.5px solid #e5e7eb",
          width: "fit-content",
        }}
      >
        <Sparkles size={13} color="#7c3aed" />
        <span style={{ fontSize: 11, fontWeight: 800, color: "#374151" }}>Demo mode:</span>
        <button
          onClick={() => {
            setUseErrors(false);
            resetFile();
          }}
          style={{
            padding: "4px 12px",
            borderRadius: 7,
            fontSize: 11,
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            background: !useErrors ? "#d1fae5" : "#f3f4f6",
            color: !useErrors ? "#065f46" : "#6b7280",
            transition: "all .15s",
          }}
        >
          ✓ Clean File (No Errors)
        </button>
        <button
          onClick={() => {
            setUseErrors(true);
            resetFile();
          }}
          style={{
            padding: "4px 12px",
            borderRadius: 7,
            fontSize: 11,
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            background: useErrors ? "#fee2e2" : "#f3f4f6",
            color: useErrors ? "#991b1b" : "#6b7280",
            transition: "all .15s",
          }}
        >
          ✗ File With Errors
        </button>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 20,
          border: "1.5px solid #e5e7eb",
          boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
          padding: "22px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          overflow: "hidden",
        }}
      >
        {committed ? (
          <div style={{ animation: "fadein .4s ease" }}>
            <CommitSuccess cat={cat} aff={aff} reg={reg} yr={yr} sem={sem} total={valid} onReset={fullReset} />
          </div>
        ) : (
          <>
            <SectionLabel
              num="1"
              title="Define Context"
              color="#4f46e5"
              light="#eef2ff"
              done={contextDone}
              locked={false}
            />
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Select
                label="Affiliation"
                icon={GraduationCap}
                options={AFFILIATIONS}
                value={aff}
                onChange={setAff}
                placeholder="Select University"
                color="#4f46e5"
                light="#eef2ff"
              />
              <Select
                label="Regulation"
                icon={BookOpen}
                options={REGULATIONS}
                value={reg}
                onChange={setReg}
                placeholder="Select Regulation"
                color="#0369a1"
                light="#e0f2fe"
              />
              <Select
                label="Academic Year"
                icon={Calendar}
                options={YEARS}
                value={yr}
                onChange={setYr}
                placeholder="Select Year"
                color="#047857"
                light="#d1fae5"
              />
              <Select
                label="Semester"
                icon={BookOpen}
                options={SEMESTERS}
                value={sem}
                onChange={setSem}
                placeholder="Select Semester"
                color="#b45309"
                light="#fef3c7"
              />
            </div>

            {divider}

            <div
              style={{
                display: "flex",
                gap: 18,
                opacity: contextDone ? 1 : 0.4,
                pointerEvents: contextDone ? "all" : "none",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: "3 1 420px", minWidth: 0 }}>
                <SectionLabel
                  num="2"
                  title="Data Category"
                  color="#0369a1"
                  light="#e0f2fe"
                  done={catDone}
                  locked={!contextDone}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon;
                    const active = cat === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCat(c.id);
                          resetFile();
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          padding: "11px 14px",
                          borderRadius: 12,
                          textAlign: "left",
                          cursor: "pointer",
                          transition: "all .15s",
                          background: active ? c.light : "#f9fafb",
                          border: `1.5px solid ${active ? c.color : "#e5e7eb"}`,
                          boxShadow: active ? `0 2px 10px ${c.color}18` : "none",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 9,
                            background: active ? c.color : "#e5e7eb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            transition: "all .15s",
                            marginTop: 2,
                          }}
                        >
                          <Icon size={15} color={active ? "white" : "#6b7280"} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: active ? c.color : "#374151",
                              marginBottom: 2,
                              lineHeight: 1.4,
                            }}
                          >
                            {c.full}
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#9ca3af", lineHeight: 1.4 }}>
                            {((COLUMNS as Record<string, string[]>)[c.id] ?? []).join(" · ")}
                          </div>
                        </div>
                        {active && <CheckCircle2 size={15} color={c.color} style={{ flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ width: "1px", background: "#f3f4f6", flexShrink: 0, display: "none" }} />

              <div style={{ flex: "2 1 320px", minWidth: 0 }}>
                <SectionLabel
                  num="3"
                  title="Download Template"
                  color="#047857"
                  light="#d1fae5"
                  done={false}
                  locked={!catDone}
                />
                {sel ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {cols.map((c, i) => (
                        <span
                          key={c}
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: sel.light,
                            color: sel.color,
                            border: `1px solid ${sel.border}`,
                          }}
                        >
                          <span style={{ opacity: 0.4, marginRight: 2 }}>{i + 1}.</span>
                          {c}
                        </span>
                      ))}
                    </div>
                    <button
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 7,
                        padding: "9px 12px",
                        borderRadius: 10,
                        background: sel.color,
                        color: "white",
                        fontWeight: 800,
                        fontSize: 12,
                        border: "none",
                        cursor: "pointer",
                        lineHeight: 1.4,
                      }}
                    >
                      <Download size={13} style={{ flexShrink: 0 }} /> <span>Download {sel.label} Template</span>
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: "18px 14px",
                      borderRadius: 10,
                      background: "#f9fafb",
                      border: "1.5px dashed #e5e7eb",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>Select a category first</div>
                  </div>
                )}
              </div>
            </div>

            {divider}

            <div
              style={{
                display: "flex",
                gap: 18,
                opacity: catDone ? 1 : 0.4,
                pointerEvents: catDone ? "all" : "none",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: "1 1 720px", minWidth: 0 }}>
                <SectionLabel
                  num="4"
                  title="Upload Filled File"
                  color="#b45309"
                  light="#fef3c7"
                  done={uploadDone && !hasErrors}
                  locked={!catDone}
                />

                {!file && !loading && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDrag(true);
                    }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={onDrop}
                    onClick={() => catDone && fileRef.current?.click()}
                    style={{
                      border: `2px dashed ${drag ? sel?.color || "#4f46e5" : "#d1d5db"}`,
                      background: drag ? sel?.light || "#eef2ff" : "#fafafa",
                      borderRadius: 12,
                      padding: "22px 0",
                      textAlign: "center",
                      cursor: catDone ? "pointer" : "not-allowed",
                      transition: "all .2s",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 11,
                        background: drag ? sel?.color || "#4f46e5" : "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all .2s",
                      }}
                    >
                      <CloudUpload size={18} color={drag ? "white" : "#9ca3af"} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: drag ? sel?.color || "#4f46e5" : "#374151" }}>
                        {drag ? "Release to upload" : "Drag & drop Excel file here"}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af" }}>
                        or click to browse · .xlsx, .xls
                      </div>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx,.xls"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) pickFile(f);
                        e.target.value = "";
                      }}
                    />
                  </div>
                )}

                {loading && (
                  <div
                    style={{
                      padding: "22px 0",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>
                      <RefreshCw size={22} color={sel?.color || "#4f46e5"} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#374151" }}>Validating file…</div>
                    <div style={{ width: 180, height: 4, background: "#f3f4f6", borderRadius: 99, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: "70%",
                          background: sel?.color || "#4f46e5",
                          borderRadius: 99,
                          animation: "bar 1.2s ease-in-out infinite",
                        }}
                      />
                    </div>
                  </div>
                )}

                {file && validated && (
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 9,
                          padding: "9px 12px",
                          background: "#f9fafb",
                          border: "1.5px solid #e5e7eb",
                          borderRadius: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: "#d1fae5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <FileUp size={13} color="#059669" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 800,
                              color: "#111827",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {file.name}
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#6b7280" }}>
                            {(file.size / 1024).toFixed(1)} KB · Validated
                          </div>
                        </div>
                        <button
                          onClick={resetFile}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 4,
                            color: "#9ca3af",
                            display: "flex",
                          }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        {[
                          { label: "Total", v: total, bg: "#f3f4f6", tc: "#374151" },
                          { label: "Valid", v: valid, bg: "#d1fae5", tc: "#065f46" },
                          { label: "Errors", v: errs, bg: "#fee2e2", tc: "#991b1b" },
                        ].map((s) => (
                          <div
                            key={s.label}
                            style={{ padding: "10px 6px", background: s.bg, borderRadius: 10, textAlign: "center" }}
                          >
                            <div style={{ fontSize: 22, fontWeight: 900, color: s.tc, lineHeight: 1 }}>{s.v}</div>
                            <div
                              style={{
                                fontSize: 9,
                                fontWeight: 800,
                                color: s.tc,
                                opacity: 0.65,
                                marginTop: 3,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                              }}
                            >
                              {s.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ flex: "1 1 340px" }}>
                      {hasErrors ? (
                        <div
                          style={{
                            padding: "12px 14px",
                            background: "#fff1f2",
                            border: "1.5px solid #fca5a5",
                            borderRadius: 11,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                            <ShieldAlert size={15} color="#dc2626" />
                            <div style={{ fontSize: 12, fontWeight: 900, color: "#991b1b" }}>
                              Upload blocked — {errs} error{errs > 1 ? "s" : ""}
                            </div>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: "#dc2626", lineHeight: 1.6 }}>
                            Fix errors in your file and re-upload. See the validation table below.
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "12px 14px",
                            background: "#f0fdf4",
                            border: "1.5px solid #bbf7d0",
                            borderRadius: 11,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                            <CheckCircle2 size={15} color="#16a34a" />
                            <div style={{ fontSize: 12, fontWeight: 900, color: "#15803d" }}>
                              All {valid} records valid
                            </div>
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "#16a34a",
                              lineHeight: 1.6,
                              marginBottom: 10,
                            }}
                          >
                            Review the table below, then commit to database.
                          </div>
                          <button
                            onClick={handleCommit}
                            disabled={committing}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 7,
                              padding: "9px 0",
                              borderRadius: 9,
                              background: committing ? "#86efac" : "#16a34a",
                              color: "white",
                              fontWeight: 800,
                              fontSize: 12,
                              border: "none",
                              cursor: committing ? "not-allowed" : "pointer",
                              transition: "all .2s",
                              animation: committing ? "none" : "commitpulse 2s ease-in-out infinite",
                            }}
                          >
                            {committing ? (
                              <>
                                <div style={{ animation: "spin 0.8s linear infinite", display: "inline-block" }}>
                                  <RefreshCw size={13} />
                                </div>{" "}
                                Submitting…
                              </>
                            ) : (
                              <>
                                <Upload size={13} /> Confirm & Submit
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {uploadDone && (
              <>
                {divider}
                <SectionLabel
                  num="5"
                  title="Review & Submit"
                  color="#7c3aed"
                  light="#ede9fe"
                  done={false}
                  locked={false}
                />

                {hasErrors ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 11,
                      padding: "11px 16px",
                      background: "#fff1f2",
                      border: "2px solid #fca5a5",
                      borderRadius: 11,
                      marginBottom: 12,
                    }}
                  >
                    <ShieldAlert size={17} color="#dc2626" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 900, color: "#991b1b" }}>
                        Upload Blocked — {errs} error{errs > 1 ? "s" : ""} must be fixed before committing
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#dc2626" }}>
                        Download the error report, correct your Excel file, and re-upload.
                      </div>
                    </div>
                    <button
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "8px 14px",
                        borderRadius: 9,
                        background: "#dc2626",
                        color: "white",
                        fontWeight: 800,
                        fontSize: 11,
                        border: "none",
                        cursor: "pointer",
                        flexShrink: 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Download size={12} /> Download Error Report
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      background: "linear-gradient(135deg,#f0fdf4,#dcfce7)",
                      border: "2px solid #86efac",
                      borderRadius: 12,
                      marginBottom: 12,
                      animation: "fadein .4s ease",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "#16a34a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 4px 10px rgba(22,163,74,0.3)",
                      }}
                    >
                      <CheckCircle2 size={18} color="white" strokeWidth={2.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 900, color: "#14532d", marginBottom: 2 }}>
                        All {valid} records passed validation — ready to commit
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#16a34a", lineHeight: 1.5 }}>
                        No issues found. Click <b>"Commit to Database"</b> above to push these records live. This action
                        cannot be undone.
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: "#16a34a",
                        borderRadius: 8,
                        padding: "5px 11px",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 900, color: "white" }}>✓ Clean</span>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    border: `1.5px solid ${hasErrors ? "#fca5a5" : "#bbf7d0"}`,
                  }}
                >
                  <div
                    style={{
                      padding: "9px 16px",
                      background: hasErrors ? "#fff8f8" : "#f0fdf4",
                      borderBottom: `1.5px solid ${hasErrors ? "#fca5a5" : "#bbf7d0"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Eye size={12} color="#7c3aed" />
                      <span style={{ fontSize: 12, fontWeight: 900, color: "#111827" }}>Validation Detail</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: 99,
                          background: "#ede9fe",
                          color: "#7c3aed",
                        }}
                      >
                        {total} rows
                      </span>
                      {errs > 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 99,
                            background: "#fee2e2",
                            color: "#991b1b",
                          }}
                        >
                          {errs} errors
                        </span>
                      )}
                      {valid > 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 99,
                            background: "#d1fae5",
                            color: "#065f46",
                          }}
                        >
                          {valid} valid
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: "#f9fafb", borderBottom: "1.5px solid #f3f4f6" }}>
                          <th
                            style={{
                              padding: "7px 14px",
                              textAlign: "left",
                              fontSize: 10,
                              fontWeight: 900,
                              color: "#9ca3af",
                              textTransform: "uppercase",
                              letterSpacing: "0.07em",
                              width: 26,
                            }}
                          >
                            #
                          </th>
                          {cols.map((c) => (
                            <th
                              key={c}
                              style={{
                                padding: "7px 14px",
                                textAlign: "left",
                                fontSize: 10,
                                fontWeight: 900,
                                color: "#6b7280",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {c}
                            </th>
                          ))}
                          <th
                            style={{
                              padding: "7px 14px",
                              textAlign: "left",
                              fontSize: 10,
                              fontWeight: 900,
                              color: "#6b7280",
                              textTransform: "uppercase",
                            }}
                          >
                            Status
                          </th>
                          <th
                            style={{
                              padding: "7px 14px",
                              textAlign: "left",
                              fontSize: 10,
                              fontWeight: 900,
                              color: "#6b7280",
                              textTransform: "uppercase",
                            }}
                          >
                            Error Detail
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr
                            key={i}
                            style={{
                              borderBottom: "1px solid #f9fafb",
                              background: row._s === "err" ? "#fff8f8" : "white",
                              transition: "background .1s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#f0fdf4";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = row._s === "err" ? "#fff8f8" : "white";
                            }}
                          >
                            <td style={{ padding: "8px 14px", color: "#d1d5db", fontWeight: 800, fontSize: 11 }}>
                              {i + 1}
                            </td>
                            {cols.map((c) => (
                              <td
                                key={c}
                                style={{
                                  padding: "8px 14px",
                                  color: row[c] ? "#111827" : "#dc2626",
                                  fontWeight: row[c] ? 500 : 800,
                                }}
                              >
                                {row[c] || "—"}
                              </td>
                            ))}
                            <td style={{ padding: "8px 14px" }}>
                              <StatusBadge s={row._s} e={row._e} />
                            </td>
                            <td
                              style={{
                                padding: "8px 14px",
                                fontSize: 11,
                                fontWeight: 600,
                                color: row._e ? "#dc2626" : "#9ca3af",
                              }}
                            >
                              {row._e || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div
                    style={{
                      padding: "8px 16px",
                      background: hasErrors ? "#fff8f8" : "#f0fdf4",
                      borderTop: `1.5px solid ${hasErrors ? "#fca5a5" : "#bbf7d0"}`,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#9ca3af",
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                    }}
                  >
                    <span>
                      <b style={{ color: "#374151" }}>{total}</b> total
                    </span>
                    <span>
                      <b style={{ color: "#065f46" }}>{valid}</b> valid
                    </span>
                    <span>
                      <b style={{ color: errs > 0 ? "#dc2626" : "#9ca3af" }}>{errs}</b> errors
                    </span>
                    {!hasErrors && (
                      <span
                        style={{
                          marginLeft: "auto",
                          color: "#16a34a",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        <CheckCircle2 size={11} /> All rows cleared — safe to commit
                      </span>
                    )}
                    {hasErrors && (
                      <span style={{ marginLeft: "auto", color: "#dc2626", fontWeight: 800 }}>
                        ⚠ Fix errors and re-upload to proceed
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DownloadModule() {
  const [dlAff, setDlAff] = useState("");
  const [dlReg, setDlReg] = useState("");
  const [dlYr, setDlYr] = useState("");
  const [dlCat, setDlCat] = useState("");
  const [dlSem, setDlSem] = useState("");
  const dlReady = !!(dlAff && dlReg && dlYr && dlCat);
  const selCat = CATEGORIES.find((c) => c.full === dlCat);

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "20px 28px" }}>
      <div
        style={{
          background: "white",
          borderRadius: 20,
          border: "1.5px solid #e5e7eb",
          boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
          padding: "22px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "#111827", marginBottom: 3 }}>
            Download Existing Records
          </div>
          <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, lineHeight: 1.6 }}>
            Select the context of the dataset you want to export.
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Select
            label="Affiliation"
            icon={GraduationCap}
            options={AFFILIATIONS}
            value={dlAff}
            onChange={setDlAff}
            placeholder="Select University"
            color="#4f46e5"
            light="#eef2ff"
          />
          <Select
            label="Regulation"
            icon={BookOpen}
            options={REGULATIONS}
            value={dlReg}
            onChange={setDlReg}
            placeholder="Select Regulation"
            color="#0369a1"
            light="#e0f2fe"
          />
          <Select
            label="Academic Year"
            icon={Calendar}
            options={YEARS}
            value={dlYr}
            onChange={setDlYr}
            placeholder="Select Year"
            color="#047857"
            light="#d1fae5"
          />
          <Select
            label="Data Category"
            icon={Database}
            options={CATEGORIES.map((c) => c.full)}
            value={dlCat}
            onChange={setDlCat}
            placeholder="Select Data Category"
            color="#7c3aed"
            light="#ede9fe"
          />
          <Select
            label="Semester"
            icon={BookOpen}
            options={SEMESTERS}
            value={dlSem}
            onChange={setDlSem}
            placeholder="All Semesters (optional)"
            color="#b45309"
            light="#fef3c7"
          />
        </div>

        {!dlReady ? (
          <div
            style={{
              padding: "13px 16px",
              background: "#fffbeb",
              border: "1.5px solid #fde68a",
              borderRadius: 11,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <AlertCircle size={15} color="#d97706" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>
              Select Affiliation, Regulation, Academic Year and Data Category to enable download.
            </span>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              padding: "14px 18px",
              background: "#f0f4ff",
              border: "1.5px solid #c7d2fe",
              borderRadius: 13,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {[
                { label: "Affiliation", val: dlAff, color: "#4f46e5", bg: "#eef2ff" },
                { label: "Regulation", val: dlReg, color: "#0369a1", bg: "#e0f2fe" },
                { label: "Academic Year", val: dlYr, color: "#047857", bg: "#d1fae5" },
                { label: "Category", val: selCat?.label || dlCat, color: "#7c3aed", bg: "#ede9fe" },
                ...(dlSem ? [{ label: "Semester", val: `Sem ${dlSem}`, color: "#b45309", bg: "#fef3c7" }] : []),
              ].map((t) => (
                <div
                  key={t.label}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 7,
                    background: t.bg,
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 900,
                      color: t.color,
                      opacity: 0.55,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {t.label}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: t.color }}>{t.val}</span>
                </div>
              ))}
            </div>
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 11,
                background: "#4f46e5",
                color: "white",
                fontWeight: 900,
                fontSize: 13,
                border: "none",
                cursor: "pointer",
                flexShrink: 0,
                whiteSpace: "nowrap",
                boxShadow: "0 4px 12px rgba(79,70,229,0.25)",
              }}
            >
              <FileDown size={14} /> Download Records
            </button>
          </div>
        )}

        {dlReady && !dlSem && (
          <div
            style={{
              padding: "8px 13px",
              background: "#f9fafb",
              border: "1.5px solid #f3f4f6",
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 600,
              color: "#6b7280",
            }}
          >
            💡 No semester selected — all semesters will be included in the export.
          </div>
        )}
      </div>
    </div>
  );
}

export default function BulkUploadUi() {
  const [mode, setMode] = useState<"upload" | "download">("upload");

  return (
    <div
      style={{
        fontFamily: "'Nunito','Segoe UI',sans-serif",
        background: "#f0f2f5",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          background: "white",
          borderBottom: "1.5px solid #e5e7eb",
          padding: "0 24px",
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ background: "#eef2ff", borderRadius: 9, padding: "5px 7px", display: "flex" }}>
            <Layers size={17} color="#4f46e5" />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 14, color: "#111827", lineHeight: 1.1 }}>Bulk Data Management</div>
            <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 700, letterSpacing: "0.04em" }}>
              Educational ERP · Student Records
            </div>
          </div>
        </div>
        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 11, padding: 3, gap: 2 }}>
          <button
            onClick={() => setMode("upload")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
              transition: "all .15s",
              border: "none",
              background: mode === "upload" ? "white" : "transparent",
              color: mode === "upload" ? "#4f46e5" : "#6b7280",
              boxShadow: mode === "upload" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <Upload size={12} /> Upload Data
          </button>
          <button
            onClick={() => setMode("download")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 12,
              cursor: "pointer",
              transition: "all .15s",
              border: "none",
              background: mode === "download" ? "white" : "transparent",
              color: mode === "download" ? "#047857" : "#6b7280",
              boxShadow: mode === "download" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}
          >
            <FolderDown size={12} /> Download Data
          </button>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "#d1fae5",
            border: "1.5px solid #6ee7b7",
            borderRadius: 9,
            padding: "4px 11px",
            fontSize: 11,
            fontWeight: 800,
            color: "#065f46",
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
          System Active
        </div>
      </header>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {mode === "upload" && <UploadModule />}
        {mode === "download" && <DownloadModule />}
      </div>
    </div>
  );
}
