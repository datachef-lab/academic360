import * as React from "react";
import { Info, Pencil, CircleAlert, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const SL = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"] as const;
const SESSIONS = ["2024-25", "2023-24"] as const;

const ALL_AFFS = [
  { id: "sc", l: "Scottish Church College" },
  { id: "presi", l: "Presidency University" },
  { id: "lore", l: "Loreto College" },
  { id: "stxa", l: "St. Xavier's College" },
  { id: "maz", l: "Maulana Azad College" },
] as const;

const ALL_PROGRAMS = [
  { id: "bsc_cs", l: "B.Sc. Computer Science" },
  { id: "bsc_phy", l: "B.Sc. Physics" },
  { id: "bsc_chem", l: "B.Sc. Chemistry" },
  { id: "ba_eng", l: "B.A. English" },
  { id: "ba_hist", l: "B.A. History" },
  { id: "bcom_gen", l: "B.Com. General" },
  { id: "bcom_hons", l: "B.Com. Honours" },
  { id: "bsc_math", l: "B.Sc. Mathematics" },
] as const;

const ALL_SEMS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

const ACTIVITY_DEFS = [
  {
    id: "fee_payment",
    label: "Semester Fee Payment",
    icon: "💳",
    desc: "Online & cash payment gateway for semester fees",
    category: "Finance",
  },
  {
    id: "failed_paper_fee",
    label: "Failed Paper Fee Payment",
    icon: "🧾",
    desc: "Fee payment portal for students with failed paper re-examinations",
    category: "Finance",
  },
  {
    id: "admit_card",
    label: "Admit Card Download",
    icon: "🪪",
    desc: "Examination admit card generation and download",
    category: "Examination",
  },
  {
    id: "form_fillup",
    label: "Form Fill-up Upload",
    icon: "📋",
    desc: "CU form fill-up submission and document upload",
    category: "Examination",
  },
  {
    id: "cu_registration",
    label: "Calcutta University Registration",
    icon: "✍️",
    desc: "Official CU registration for newly admitted students",
    category: "Admission",
  },
  {
    id: "subject_select_s1",
    label: "Subject Selection for Semester I",
    icon: "📚",
    desc: "Initial subject and paper selection for first-semester students",
    category: "Admission",
  },
  {
    id: "specialization",
    label: "Specialization Selection",
    icon: "🔬",
    desc: "Honours / major specialization choice for eligible students",
    category: "Academic",
  },
  {
    id: "marks_upload",
    label: "Marks Upload",
    icon: "📊",
    desc: "Faculty portal for internal assessment and attendance marks upload",
    category: "Academic",
  },
] as const;

type ActivityId = (typeof ACTIVITY_DEFS)[number]["id"];
type Audience = "staff" | "all" | "student";

type Activity = (typeof ACTIVITY_DEFS)[number] & {
  enabled: boolean;
  startDt: string;
  endDt: string;
  audience: Audience;
  note: string;
  scopeSems: number[];
  scopePrograms: string[];
  scopeAffs: string[];
};

type MockStudent = {
  uid: string;
  name: string;
  roll: string;
  sem: number;
  dept: string;
  deptId: string;
  affId: string;
  photo: string;
  ffStatus: Record<number, string>;
  failedPapers: Record<number, number>;
  feePaid: Record<number, boolean>;
  admitCard: Record<number, boolean>;
};

function nowPlus(h: number): string {
  const d = new Date(Date.now() + h * 3600000);
  return d.toISOString().slice(0, 16);
}

function fmt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function windowStatus(act: Activity): {
  label: string;
  color: string;
  bg: string;
  bd: string;
  live?: boolean;
} {
  if (!act.enabled)
    return {
      label: "Disabled",
      color: "text-[#9AA0AE]",
      bg: "bg-[#F7F6F3]",
      bd: "border-[#E0DDD6]",
    };
  const now = Date.now();
  const s = act.startDt ? new Date(act.startDt).getTime() : 0;
  const e = act.endDt ? new Date(act.endDt).getTime() : Number.POSITIVE_INFINITY;
  if (now < s)
    return {
      label: "Scheduled",
      color: "text-[#1A6BB5]",
      bg: "bg-[#EBF3FC]",
      bd: "border-[#9EC8F0]",
    };
  if (now > e)
    return {
      label: "Closed",
      color: "text-[#9AA0AE]",
      bg: "bg-[#F7F6F3]",
      bd: "border-[#E0DDD6]",
    };
  return {
    label: "Live",
    color: "text-[#1A7A4A]",
    bg: "bg-[#E8F5EE]",
    bd: "border-[#A0D8B8]",
    live: true,
  };
}

function audienceLabel(a: Audience): { label: string; color: string; bg: string; bd: string } {
  if (a === "staff")
    return {
      label: "Staff Only",
      color: "text-[#5B3FC4]",
      bg: "bg-[#EEE9FC]",
      bd: "border-[#C4B4F4]",
    };
  if (a === "student")
    return {
      label: "Students",
      color: "text-[#C8820A]",
      bg: "bg-[#FEF6E8]",
      bd: "border-[#F0C97A]",
    };
  return {
    label: "All",
    color: "text-[#0A7F6A]",
    bg: "bg-[#E6F5F2]",
    bd: "border-[#85CFC0]",
  };
}

function isAll(arr: unknown[], master: readonly unknown[]): boolean {
  return arr.length === 0 || arr.length === master.length;
}

function scopeLabel(arr: string[], masterLen: number, unit: string): string {
  if (arr.length === 0 || arr.length === masterLen) return `All ${unit}`;
  if (arr.length === 1) return `1 ${unit.replace(/s$/, "")}`;
  return `${arr.length} ${unit}`;
}

function semScopeLabel(sems: number[]): string {
  if (isAll(sems, ALL_SEMS)) return "All Sems";
  if (sems.length === 1) {
    const s = sems[0] ?? 1;
    return `Sem ${SL[s - 1]}`;
  }
  return `${sems.length} Sems`;
}

function makeActivities(): Activity[] {
  return ACTIVITY_DEFS.map((def, i) => ({
    ...def,
    enabled: i < 4,
    startDt: i < 2 ? nowPlus(-1) : i < 4 ? nowPlus(2) : "",
    endDt: i < 2 ? nowPlus(72) : i < 4 ? nowPlus(168) : "",
    audience: (i === 0 ? "staff" : i < 3 ? "all" : "student") as Audience,
    note: "",
    scopeSems: [],
    scopePrograms: [],
    scopeAffs: [],
  }));
}

const MOCK_STUDENTS: MockStudent[] = [
  {
    uid: "CU-SC-2022-001",
    name: "Arjun Sharma",
    roll: "22-001",
    sem: 5,
    dept: "B.Sc. Computer Science",
    deptId: "bsc_cs",
    affId: "sc",
    photo: "AS",
    ffStatus: {
      1: "Form Filled",
      2: "Form Filled",
      3: "Form Filled",
      4: "Form Filled",
      5: "Pending",
    },
    failedPapers: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    feePaid: { 1: true, 2: true, 3: true, 4: true, 5: false },
    admitCard: { 5: false },
  },
  {
    uid: "CU-SC-2022-042",
    name: "Priya Banerjee",
    roll: "22-042",
    sem: 3,
    dept: "B.A. English",
    deptId: "ba_eng",
    affId: "sc",
    photo: "PB",
    ffStatus: { 1: "Form Filled", 2: "Form Filled", 3: "Form Filled" },
    failedPapers: { 1: 0, 2: 1, 3: 0 },
    feePaid: { 1: true, 2: true, 3: false },
    admitCard: { 3: false },
  },
  {
    uid: "CU-SC-2023-108",
    name: "Souvik Das",
    roll: "23-108",
    sem: 1,
    dept: "B.Sc. Physics",
    deptId: "bsc_phy",
    affId: "sc",
    photo: "SD",
    ffStatus: { 1: "Pending" },
    failedPapers: {},
    feePaid: { 1: false },
    admitCard: {},
  },
  {
    uid: "123456",
    name: "Ritam Chakraborty",
    roll: "23-201",
    sem: 4,
    dept: "B.Com. General",
    deptId: "bcom_gen",
    affId: "presi",
    photo: "RC",
    ffStatus: { 1: "Form Filled", 2: "Form Filled", 3: "Form Filled", 4: "Form Filled" },
    failedPapers: { 1: 0, 2: 0, 3: 1, 4: 0 },
    feePaid: { 1: true, 2: true, 3: true, 4: true },
    admitCard: { 4: false },
  },
  {
    uid: "456789",
    name: "Moumita Dey",
    roll: "22-087",
    sem: 6,
    dept: "B.Sc. Chemistry",
    deptId: "bsc_chem",
    affId: "lore",
    photo: "MD",
    ffStatus: {
      1: "Form Filled",
      2: "Form Filled",
      3: "Form Filled",
      4: "Form Filled",
      5: "Form Filled",
      6: "Pending",
    },
    failedPapers: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    feePaid: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: false },
    admitCard: { 6: false },
  },
  {
    uid: "123789",
    name: "Kaustav Mitra",
    roll: "24-045",
    sem: 2,
    dept: "B.Sc. Mathematics",
    deptId: "bsc_math",
    affId: "stxa",
    photo: "KM",
    ffStatus: { 1: "Form Filled", 2: "Form Filled" },
    failedPapers: { 1: 0, 2: 0 },
    feePaid: { 1: true, 2: false },
    admitCard: { 2: false },
  },
];

function studentInScope(act: Activity, student: MockStudent): boolean {
  const semOk = isAll(act.scopeSems, ALL_SEMS) || act.scopeSems.includes(student.sem);
  const progOk =
    isAll(act.scopePrograms, ALL_PROGRAMS) || act.scopePrograms.includes(student.deptId);
  const affOk = isAll(act.scopeAffs, ALL_AFFS) || act.scopeAffs.includes(student.affId);
  return semOk && progOk && affOk;
}

function getActStatus(
  act: Activity,
  s: MockStudent,
): { accessible: boolean; info: string; done: boolean } {
  const failedCount = Object.values(s.failedPapers ?? {}).reduce((a, b) => a + b, 0);
  switch (act.id) {
    case "fee_payment":
      return {
        accessible: true,
        info: s.feePaid[s.sem] ? "Paid" : "Payment pending",
        done: !!s.feePaid[s.sem],
      };
    case "failed_paper_fee":
      return {
        accessible: failedCount > 0,
        info:
          failedCount > 0
            ? `${failedCount} paper${failedCount > 1 ? "s" : ""} — fee due`
            : "No failed papers",
        done: false,
      };
    case "admit_card":
      return {
        accessible: !!s.feePaid[s.sem],
        info: s.feePaid[s.sem]
          ? s.admitCard[s.sem]
            ? "Downloaded"
            : "Ready to download"
          : "Fee payment required first",
        done: !!s.admitCard[s.sem],
      };
    case "form_fillup":
      return {
        accessible: true,
        info: s.ffStatus[s.sem] === "Form Filled" ? "Submitted" : "Not submitted",
        done: s.ffStatus[s.sem] === "Form Filled",
      };
    case "cu_registration":
      return {
        accessible: s.sem === 1,
        info: s.sem === 1 ? "Registration open" : "Only for new students",
        done: false,
      };
    case "subject_select_s1":
      return {
        accessible: s.sem === 1,
        info: s.sem === 1 ? "Selection open" : "Only for Semester I",
        done: false,
      };
    case "specialization":
      return {
        accessible: s.sem >= 3,
        info: s.sem >= 3 ? "Selection open" : "Available from Sem III",
        done: false,
      };
    case "marks_upload":
      return { accessible: true, info: "Upload open", done: false };
    default:
      return { accessible: true, info: "Available", done: false };
  }
}

function ScopeSummary({ act }: { act: Activity }) {
  const semLbl = semScopeLabel(act.scopeSems);
  const progLbl = scopeLabel(act.scopePrograms, ALL_PROGRAMS.length, "Programs");
  const affLbl = scopeLabel(act.scopeAffs, ALL_AFFS.length, "Affiliations");
  const pill = (lbl: string, isAllPill: boolean, c: string, bg: string, bd: string) => (
    <Badge
      variant="outline"
      className={cn(
        "whitespace-nowrap border px-2 py-0.5 text-[10.5px] font-semibold",
        isAllPill ? "border-[#E0DDD6] bg-[#F7F6F3] text-[#9AA0AE]" : cn(bg, c, bd),
      )}
    >
      {lbl}
    </Badge>
  );
  return (
    <div className="flex flex-wrap items-center gap-1">
      {pill(semLbl, semLbl === "All Sems", "text-[#C8820A]", "bg-[#FEF6E8]", "border-[#F0C97A]")}
      {pill(
        progLbl,
        progLbl === "All Programs",
        "text-[#5B3FC4]",
        "bg-[#EEE9FC]",
        "border-[#C4B4F4]",
      )}
      {pill(
        affLbl,
        affLbl === "All Affiliations",
        "text-[#1A6BB5]",
        "bg-[#EBF3FC]",
        "border-[#9EC8F0]",
      )}
    </div>
  );
}

const isOdd = (n: number) => n % 2 !== 0;
function semChipColors(sem: number) {
  return isOdd(sem)
    ? { c: "text-[#C8820A]", bg: "bg-[#FEF6E8]", bd: "border-[#F0C97A]" }
    : { c: "text-[#0A7F6A]", bg: "bg-[#E6F5F2]", bd: "border-[#85CFC0]" };
}

export default function AcademicActivityPage() {
  const [activities, setActivities] = React.useState<Activity[]>(() => makeActivities());
  const [session, setSession] = React.useState<string>("2024-25");
  const [filterCat, setFilterCat] = React.useState<string>("All");
  const [editOpen, setEditOpen] = React.useState(false);
  const [editDraft, setEditDraft] = React.useState<Activity | null>(null);
  const [proxyUID, setProxyUID] = React.useState("");
  const [proxyStudent, setProxyStudent] = React.useState<MockStudent | null>(null);
  const [proxyResolved, setProxyResolved] = React.useState(false);
  const [proxyAction, setProxyAction] = React.useState<{ icon: string; label: string } | null>(
    null,
  );

  const CATS = React.useMemo(
    () => ["All", ...Array.from(new Set(ACTIVITY_DEFS.map((a) => a.category)))],
    [],
  );

  const openEdit = (id: ActivityId) => {
    const act = activities.find((x) => x.id === id);
    if (!act) return;
    setEditDraft({
      ...act,
      scopeSems: [...act.scopeSems],
      scopePrograms: [...act.scopePrograms],
      scopeAffs: [...act.scopeAffs],
    });
    setEditOpen(true);
  };

  const saveEdit = () => {
    if (!editDraft) return;
    setActivities((prev) => prev.map((a) => (a.id === editDraft.id ? { ...editDraft } : a)));
    setEditOpen(false);
    setEditDraft(null);
  };

  const toggleActivityEnabled = (id: ActivityId, enabled: boolean) => {
    setActivities((prev) => prev.map((a) => (a.id === id ? { ...a, enabled } : a)));
  };

  const loadStudent = (uid: string) => {
    const t = uid.trim();
    setProxyUID(t);
    setProxyResolved(true);
    setProxyStudent(MOCK_STUDENTS.find((s) => s.uid === t) ?? null);
  };

  const filtered = activities.filter((a) => filterCat === "All" || a.category === filterCat);
  const liveCount = activities.filter((a) => windowStatus(a).live).length;
  const scheduledCount = activities.filter((a) => windowStatus(a).label === "Scheduled").length;

  const draft = editDraft;

  const toggleScopeSem = (v: number) => {
    if (!editDraft) return;
    const cur = editDraft.scopeSems;
    const wasAll = cur.length === 0 || cur.length === 8;
    if (wasAll) setEditDraft({ ...editDraft, scopeSems: [v] });
    else if (cur.includes(v)) {
      const next = cur.filter((x) => x !== v);
      setEditDraft({ ...editDraft, scopeSems: next.length === 0 ? [] : next });
    } else {
      const next = [...cur, v];
      setEditDraft({ ...editDraft, scopeSems: next.length === 8 ? [] : next });
    }
  };

  const toggleScopeProg = (v: string) => {
    if (!editDraft) return;
    const cur = editDraft.scopePrograms;
    const wasAll = cur.length === 0 || cur.length === ALL_PROGRAMS.length;
    if (wasAll) setEditDraft({ ...editDraft, scopePrograms: [v] });
    else if (cur.includes(v)) {
      const next = cur.filter((x) => x !== v);
      setEditDraft({ ...editDraft, scopePrograms: next.length === 0 ? [] : next });
    } else {
      const next = [...cur, v];
      setEditDraft({
        ...editDraft,
        scopePrograms: next.length === ALL_PROGRAMS.length ? [] : next,
      });
    }
  };

  const toggleScopeAff = (v: string) => {
    if (!editDraft) return;
    const cur = editDraft.scopeAffs;
    const wasAll = cur.length === 0 || cur.length === ALL_AFFS.length;
    if (wasAll) setEditDraft({ ...editDraft, scopeAffs: [v] });
    else if (cur.includes(v)) {
      const next = cur.filter((x) => x !== v);
      setEditDraft({ ...editDraft, scopeAffs: next.length === 0 ? [] : next });
    } else {
      const next = [...cur, v];
      setEditDraft({ ...editDraft, scopeAffs: next.length === ALL_AFFS.length ? [] : next });
    }
  };

  return (
    <div className="min-h-full w-full min-w-0 max-w-none overflow-x-hidden bg-[#F0EEE9] px-4 py-6 font-['DM_Sans',system-ui,sans-serif] md:px-6 lg:px-8">
      <div className="w-full min-w-0">
        <div className="mb-6 flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#F0C97A] bg-[#FEF6E8] px-2.5 py-1">
              <span className="font-['Sora',sans-serif] text-[10.5px] font-bold uppercase tracking-wider text-[#C8820A]">
                Calcutta University · ERP Admin
              </span>
            </div>
            <h1 className="font-['Sora',sans-serif] text-[22px] font-extrabold tracking-tight text-[#1B2B4B]">
              Academic Activity Control
            </h1>
            <p className="mt-1.5 max-w-[520px] text-[13px] leading-relaxed text-[#5A6478]">
              Schedule activity windows, control access by semester, program & affiliation, and
              preview any student&apos;s portal.
            </p>
            <Alert className="mt-2.5 max-w-[600px] border-[#9EC8F0] bg-[#EBF3FC] text-[#1A6BB5] [&>svg]:text-[#1A6BB5]">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-[11.5px] leading-snug text-[#1A6BB5] [&_strong]:font-semibold">
                Scope filters layer on top of the Audience setting. An activity set to{" "}
                <strong>Staff Only</strong> is live for internal testing regardless of
                semester/program/affiliation scope. Use <strong>Staff Proxy</strong> to verify what
                each student actually sees.
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Select value={session} onValueChange={setSession}>
              <SelectTrigger className="h-9 w-[140px] rounded-lg border-[#D0CCC3] bg-white font-semibold text-[#1B2B4B] shadow-sm">
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                {SESSIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="windows" className="w-full min-w-0">
          <TabsList className="h-auto w-full justify-start gap-0.5 rounded-none border-0 border-b-2 border-[#D0CCC3] bg-transparent p-0">
            <TabsTrigger
              value="windows"
              className="rounded-t-lg rounded-b-none border-b-2 border-transparent px-5 py-2 font-['Sora',sans-serif] text-[13px] data-[state=active]:border-b-white data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-[#1B2B4B] data-[state=inactive]:text-[#9AA0AE]"
            >
              Activity Windows
            </TabsTrigger>
            <TabsTrigger
              value="proxy"
              className="rounded-t-lg rounded-b-none border-b-2 border-transparent px-5 py-2 font-['Sora',sans-serif] text-[13px] data-[state=active]:border-b-white data-[state=active]:bg-white data-[state=active]:font-bold data-[state=active]:text-[#1B2B4B] data-[state=inactive]:text-[#9AA0AE]"
            >
              Staff Proxy Portal
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="windows"
            className="mt-0 w-full min-w-0 overflow-hidden rounded-b-[14px] rounded-tr-[14px] border border-t-0 border-[#D0CCC3] bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="mb-4 flex flex-wrap gap-2.5">
              {[
                {
                  l: "Total",
                  v: activities.length,
                  c: "text-[#1B2B4B]",
                  bg: "bg-[#F7F6F3]",
                  bd: "border-[#E0DDD6]",
                  dot: false,
                },
                {
                  l: "Currently Live",
                  v: liveCount,
                  c: "text-[#1A7A4A]",
                  bg: "bg-[#E8F5EE]",
                  bd: "border-[#A0D8B8]",
                  dot: true,
                },
                {
                  l: "Scheduled",
                  v: scheduledCount,
                  c: "text-[#1A6BB5]",
                  bg: "bg-[#EBF3FC]",
                  bd: "border-[#9EC8F0]",
                  dot: false,
                },
                {
                  l: "Disabled",
                  v: activities.filter((a) => !a.enabled).length,
                  c: "text-[#9AA0AE]",
                  bg: "bg-[#F7F6F3]",
                  bd: "border-[#E0DDD6]",
                  dot: false,
                },
              ].map((s) => (
                <div
                  key={s.l}
                  className={cn(
                    "min-w-[110px] flex-1 rounded-[10px] border-[1.5px] p-3 shadow-sm",
                    s.bg,
                    s.bd,
                  )}
                >
                  <div className="mb-1.5 font-['Sora',sans-serif] text-[10px] font-bold uppercase tracking-wider text-[#9AA0AE]">
                    {s.l}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {s.dot ? (
                      <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#1A7A4A]" />
                    ) : null}
                    <span
                      className={cn(
                        "font-['Sora',sans-serif] text-2xl font-extrabold leading-none",
                        s.c,
                      )}
                    >
                      {s.v}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-3.5 flex flex-wrap gap-1.5">
              {CATS.map((c) => {
                const a = filterCat === c;
                return (
                  <Button
                    key={c}
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 rounded-md border-[1.5px] text-xs font-semibold",
                      a
                        ? "border-[#1B2B4B] bg-[#1B2B4B] text-white hover:bg-[#1B2B4B]"
                        : "border-[#D0CCC3] bg-white text-[#5A6478] hover:bg-[#F7F6F3]",
                    )}
                    onClick={() => setFilterCat(c)}
                  >
                    {c}
                  </Button>
                );
              })}
            </div>

            <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border-[1.5px] border-[#D0CCC3] bg-white shadow-sm">
              <div className="w-full min-w-0 max-w-full overflow-x-auto [-webkit-overflow-scrolling:touch]">
                <div
                  className="grid w-full min-w-[960px] grid-cols-[220px_180px_minmax(180px,1fr)_100px_104px_120px_52px] border-b border-[#E0DDD6] bg-[#F7F6F3] px-3 sm:min-w-0 sm:px-4 sm:grid-cols-[minmax(200px,1.15fr)_minmax(168px,0.95fr)_minmax(200px,1.25fr)_minmax(92px,0.55fr)_minmax(96px,0.55fr)_minmax(120px,0.65fr)_52px]"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {["Activity", "Scope", "Window", "Audience", "Status", "Enabled", ""].map(
                    (h, i) => (
                      <div
                        key={h}
                        className={cn(
                          "py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#9AA0AE]",
                          i > 0 && "pl-2.5",
                        )}
                      >
                        {h}
                      </div>
                    ),
                  )}
                </div>
                {filtered.map((act, i) => {
                  const ws = windowStatus(act);
                  const aud = audienceLabel(act.audience);
                  const isLast = i === filtered.length - 1;
                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => openEdit(act.id)}
                      className={cn(
                        "grid w-full min-w-[960px] grid-cols-[220px_180px_minmax(180px,1fr)_100px_104px_120px_52px] items-center border-b border-[#E0DDD6] px-3 text-left transition-colors hover:bg-[#F7F6F3] sm:min-w-0 sm:px-4 sm:grid-cols-[minmax(200px,1.15fr)_minmax(168px,0.95fr)_minmax(200px,1.25fr)_minmax(92px,0.55fr)_minmax(96px,0.55fr)_minmax(120px,0.65fr)_52px]",
                        isLast && "border-b-0",
                      )}
                    >
                      <div className="flex items-center gap-2 py-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#E0DDD6] bg-[#F7F6F3] text-[15px]">
                          {act.icon}
                        </div>
                        <div>
                          <div className="font-['Sora',sans-serif] text-[12.5px] font-bold leading-tight text-[#1B2B4B]">
                            {act.label}
                          </div>
                          <div className="mt-0.5 text-[10px] text-[#9AA0AE]">{act.category}</div>
                        </div>
                      </div>
                      <div className="py-3 pl-2.5">
                        <ScopeSummary act={act} />
                      </div>
                      <div className="py-3 pl-2.5">
                        <div
                          className={cn(
                            "text-[11.5px]",
                            act.startDt ? "text-[#5A6478]" : "text-[#9AA0AE]",
                          )}
                        >
                          {act.startDt ? fmt(act.startDt) : "—"}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#9AA0AE]">
                          {act.endDt ? `→ ${fmt(act.endDt)}` : "No end"}
                        </div>
                      </div>
                      <div className="py-3 pl-2.5">
                        <span
                          className={cn(
                            "inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold",
                            aud.bg,
                            aud.color,
                            aud.bd,
                          )}
                        >
                          {aud.label}
                        </span>
                      </div>
                      <div className="py-3 pl-2.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold",
                            ws.bg,
                            ws.color,
                            ws.bd,
                          )}
                        >
                          {ws.live ? (
                            <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-[#1A7A4A]" />
                          ) : null}
                          {ws.label}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2 py-3 pl-2.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Switch
                          checked={act.enabled}
                          onCheckedChange={(v) => toggleActivityEnabled(act.id, v)}
                          className="data-[state=checked]:bg-[#1A7A4A]"
                        />
                        <span
                          className={cn(
                            "text-[11px] font-semibold",
                            act.enabled ? "text-[#1A7A4A]" : "text-[#9AA0AE]",
                          )}
                        >
                          {act.enabled ? "On" : "Off"}
                        </span>
                      </div>
                      <div className="flex justify-center py-3 text-[#9AA0AE]">
                        <Pencil className="h-3.5 w-3.5" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="proxy"
            className="mt-0 w-full min-w-0 overflow-hidden rounded-b-[14px] rounded-tr-[14px] border border-t-0 border-[#D0CCC3] bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="mb-3.5 rounded-xl border-[1.5px] border-[#D0CCC3] bg-white p-4 shadow-sm">
              <div className="mb-2 font-['Sora',sans-serif] text-[10.5px] font-bold uppercase tracking-wider text-[#9AA0AE]">
                Staff Proxy — Enter Student UID
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    className="h-10 rounded-lg border-[#D0CCC3] bg-[#F7F6F3] pl-9 pr-3 text-[13px]"
                    placeholder="e.g. CU-SC-2022-001"
                    value={proxyUID}
                    onChange={(e) => setProxyUID(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") loadStudent(proxyUID);
                    }}
                  />
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AA0AE]" />
                </div>
                <Button
                  type="button"
                  className="h-10 rounded-lg bg-[#1B2B4B] font-['Sora',sans-serif] font-bold hover:bg-[#2C3E63]"
                  onClick={() => loadStudent(proxyUID)}
                >
                  Load →
                </Button>
              </div>
              {proxyResolved && !proxyStudent ? (
                <p className="mt-2 text-xs text-[#C23B3B]">
                  ⚠ No student found with UID &quot;{proxyUID}&quot;.
                </p>
              ) : null}
              <div className="mt-2 rounded-lg border border-[#F0D888] bg-[#FDF4DC] p-2 text-[11.5px] leading-snug text-[#A07010]">
                ⚠ Staff proxy mode. Actions are logged under your staff ID. Activities blocked by
                scope filters will appear as locked.
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border-[1.5px] border-[#D0CCC3] bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E0DDD6] bg-[#F7F6F3] px-4 py-3">
                <div className="font-['Sora',sans-serif] text-[13px] font-bold text-[#1B2B4B]">
                  Student Activity Portal
                </div>
                {proxyStudent ? (
                  <div className="text-[11px] text-[#9AA0AE]">
                    Showing for <strong className="text-[#5A6478]">{proxyStudent.name}</strong> ·
                    Scope filters applied
                  </div>
                ) : null}
              </div>
              <div className={cn(proxyStudent ? "p-4" : "p-0")}>
                {!proxyStudent ? (
                  <div className="px-5 py-10 text-center">
                    <div className="mb-3 text-3xl">🔍</div>
                    <div className="font-['Sora',sans-serif] text-sm font-bold text-[#1B2B4B]">
                      No student loaded
                    </div>
                    <p className="mt-1.5 text-xs text-[#9AA0AE]">
                      Enter a student UID to preview their activity portal.
                    </p>
                    <div className="mt-3.5 flex flex-wrap justify-center gap-2">
                      {MOCK_STUDENTS.map((s) => (
                        <button
                          key={s.uid}
                          type="button"
                          className="cursor-pointer rounded-md border border-[#E0DDD6] bg-[#F7F6F3] px-2.5 py-1 font-mono text-[11.5px] text-[#2C3E63] hover:bg-[#EFEDE8]"
                          onClick={() => {
                            setProxyUID(s.uid);
                            setProxyResolved(true);
                            setProxyStudent(s);
                          }}
                        >
                          {s.uid}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center gap-3 rounded-[11px] bg-[#1B2B4B] p-3 shadow-md">
                      <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[11px] border-2 border-[#F0C97A] bg-[#FEF6E8] font-['Sora',sans-serif] text-[13px] font-extrabold text-[#C8820A]">
                        {proxyStudent.photo}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-['Sora',sans-serif] text-[15px] font-extrabold text-white">
                          {proxyStudent.name}
                        </div>
                        <div className="mt-0.5 text-[11px] text-white/55">
                          {proxyStudent.uid} · {proxyStudent.dept}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-md border border-[#F0C97A] bg-[#FEF6E8] font-['Sora',sans-serif] text-[11px] font-bold text-[#C8820A]">
                          {SL[proxyStudent.sem - 1]}
                        </div>
                        <span className="text-[11px] text-white/60">Sem {proxyStudent.sem}</span>
                      </div>
                      <Badge className="border border-white/20 bg-white/10 font-['Sora',sans-serif] text-[10px] font-bold uppercase tracking-wide text-white/90">
                        Staff view
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0 text-white/50 hover:bg-white/10 hover:text-white"
                        onClick={() => {
                          setProxyStudent(null);
                          setProxyUID("");
                          setProxyResolved(false);
                        }}
                      >
                        ✕
                      </Button>
                    </div>
                    <ProxyActivityGrid
                      activities={activities}
                      student={proxyStudent}
                      onOpen={(act) => setProxyAction({ icon: act.icon, label: act.label })}
                    />
                  </>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          if (!o) {
            setEditOpen(false);
            setEditDraft(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-[560px] overflow-y-auto rounded-[14px] border-[#E0DDD6] p-0 font-['DM_Sans',system-ui,sans-serif] [&>button]:hidden">
          {draft ? (
            <>
              <DialogHeader className="space-y-0 border-b border-[#E0DDD6] px-6 pb-4 pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#E0DDD6] bg-[#F7F6F3] text-lg">
                      {draft.icon}
                    </div>
                    <div>
                      <div className="font-['Sora',sans-serif] text-[10px] font-bold uppercase tracking-wider text-[#9AA0AE]">
                        Configure Activity
                      </div>
                      <DialogTitle className="mt-0.5 font-['Sora',sans-serif] text-left text-base font-extrabold text-[#1B2B4B]">
                        {draft.label}
                      </DialogTitle>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setEditOpen(false)}
                  >
                    ✕
                  </Button>
                </div>
              </DialogHeader>

              <div className="flex flex-col gap-4 px-6 py-5">
                {(() => {
                  const semPrev = semScopeLabel(draft.scopeSems);
                  const progPrev = scopeLabel(draft.scopePrograms, ALL_PROGRAMS.length, "Programs");
                  const affPrev = scopeLabel(draft.scopeAffs, ALL_AFFS.length, "Affiliations");
                  const isRestricted =
                    semPrev !== "All Sems" ||
                    progPrev !== "All Programs" ||
                    affPrev !== "All Affiliations";
                  if (!isRestricted) return null;
                  return (
                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#F0D888] bg-[#FDF4DC] p-2.5 text-[11.5px] text-[#A07010]">
                      <CircleAlert className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-semibold">Restricted to:</span>
                      {semPrev !== "All Sems" ? (
                        <Badge className="border border-[#F0C97A] bg-[#FEF6E8] text-[11px] font-semibold text-[#C8820A]">
                          {semPrev}
                        </Badge>
                      ) : null}
                      {progPrev !== "All Programs" ? (
                        <Badge className="border border-[#C4B4F4] bg-[#EEE9FC] text-[11px] font-semibold text-[#5B3FC4]">
                          {progPrev}
                        </Badge>
                      ) : null}
                      {affPrev !== "All Affiliations" ? (
                        <Badge className="border border-[#9EC8F0] bg-[#EBF3FC] text-[11px] font-semibold text-[#1A6BB5]">
                          {affPrev}
                        </Badge>
                      ) : null}
                    </div>
                  );
                })()}

                <div>
                  <div className="mb-2 font-['Sora',sans-serif] text-[11px] font-bold uppercase tracking-wider text-[#9AA0AE]">
                    Audience
                  </div>
                  <div className="flex gap-1.5">
                    {(
                      [
                        { v: "staff" as const, l: "Staff Only" },
                        { v: "all" as const, l: "All" },
                        { v: "student" as const, l: "Students" },
                      ] as const
                    ).map(({ v, l }) => {
                      const a = draft.audience === v;
                      return (
                        <Button
                          key={v}
                          type="button"
                          variant="outline"
                          className={cn(
                            "flex-1 rounded-md font-['Sora',sans-serif] text-xs font-bold",
                            a
                              ? "border-[#1B2B4B] bg-[#1B2B4B] text-white hover:bg-[#1B2B4B]"
                              : "border-[#D0CCC3] text-[#5A6478]",
                          )}
                          onClick={() => setEditDraft({ ...draft, audience: v })}
                        >
                          {l}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <ScopeSection
                  title="Semester Scope"
                  note="Restrict to specific semesters, or leave All open"
                >
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 rounded-md font-bold",
                        draft.scopeSems.length === 0 || draft.scopeSems.length === 8
                          ? "border-[#1B2B4B] bg-[#1B2B4B] text-white"
                          : "border-[#D0CCC3]",
                      )}
                      onClick={() => setEditDraft({ ...draft, scopeSems: [] })}
                    >
                      All
                    </Button>
                    {ALL_SEMS.map((s) => {
                      const sel =
                        !(draft.scopeSems.length === 0 || draft.scopeSems.length === 8) &&
                        draft.scopeSems.includes(s);
                      const { c, bg, bd } = semChipColors(s);
                      return (
                        <Button
                          key={s}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8 w-[38px] p-0 font-['Sora',sans-serif] text-xs font-bold",
                            sel ? cn(c, bg, bd) : "border-[#D0CCC3] text-[#5A6478]",
                          )}
                          onClick={() => toggleScopeSem(s)}
                        >
                          {SL[s - 1]}
                        </Button>
                      );
                    })}
                  </div>
                </ScopeSection>

                <ScopeSection
                  title="Program / Course Scope"
                  note="Restrict to specific programs, or leave All open"
                >
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 rounded-md text-xs font-bold",
                        draft.scopePrograms.length === 0 ||
                          draft.scopePrograms.length === ALL_PROGRAMS.length
                          ? "border-[#1B2B4B] bg-[#1B2B4B] text-white"
                          : "border-[#D0CCC3]",
                      )}
                      onClick={() => setEditDraft({ ...draft, scopePrograms: [] })}
                    >
                      All
                    </Button>
                    {ALL_PROGRAMS.map((p) => {
                      const allSel =
                        draft.scopePrograms.length === 0 ||
                        draft.scopePrograms.length === ALL_PROGRAMS.length;
                      const sel = !allSel && draft.scopePrograms.includes(p.id);
                      return (
                        <Button
                          key={p.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-auto min-h-8 whitespace-normal rounded-md px-2.5 py-1 text-xs font-semibold",
                            sel
                              ? "border-[#C4B4F4] bg-[#EEE9FC] text-[#5B3FC4]"
                              : "border-[#D0CCC3] text-[#5A6478]",
                          )}
                          onClick={() => toggleScopeProg(p.id)}
                        >
                          {p.l}
                        </Button>
                      );
                    })}
                  </div>
                </ScopeSection>

                <ScopeSection
                  title="Affiliation Scope"
                  note="Restrict to specific affiliated colleges, or leave All open"
                >
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        "h-8 rounded-md text-xs font-bold",
                        draft.scopeAffs.length === 0 || draft.scopeAffs.length === ALL_AFFS.length
                          ? "border-[#1B2B4B] bg-[#1B2B4B] text-white"
                          : "border-[#D0CCC3]",
                      )}
                      onClick={() => setEditDraft({ ...draft, scopeAffs: [] })}
                    >
                      All
                    </Button>
                    {ALL_AFFS.map((a) => {
                      const allSel =
                        draft.scopeAffs.length === 0 || draft.scopeAffs.length === ALL_AFFS.length;
                      const sel = !allSel && draft.scopeAffs.includes(a.id);
                      return (
                        <Button
                          key={a.id}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8 rounded-md px-2.5 text-xs font-semibold",
                            sel
                              ? "border-[#9EC8F0] bg-[#EBF3FC] text-[#1A6BB5]"
                              : "border-[#D0CCC3] text-[#5A6478]",
                          )}
                          onClick={() => toggleScopeAff(a.id)}
                        >
                          {a.l}
                        </Button>
                      );
                    })}
                  </div>
                </ScopeSection>

                <div>
                  <div className="mb-2 font-['Sora',sans-serif] text-[11px] font-bold uppercase tracking-wider text-[#9AA0AE]">
                    Activity Window
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <Label className="text-[11.5px] font-semibold text-[#5A6478]">Start</Label>
                      <Input
                        type="datetime-local"
                        className="mt-1.5 h-9 rounded-lg border-[#D0CCC3] bg-[#F7F6F3] text-xs"
                        value={draft.startDt}
                        onChange={(e) => setEditDraft({ ...draft, startDt: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-[11.5px] font-semibold text-[#5A6478]">End</Label>
                      <Input
                        type="datetime-local"
                        className="mt-1.5 h-9 rounded-lg border-[#D0CCC3] bg-[#F7F6F3] text-xs"
                        value={draft.endDt}
                        onChange={(e) => setEditDraft({ ...draft, endDt: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-[11.5px] font-semibold text-[#5A6478]">
                    Internal Note <span className="font-normal text-[#9AA0AE]">(optional)</span>
                  </Label>
                  <Textarea
                    rows={2}
                    placeholder="e.g. Pilot batch only — fee payment for Sem V B.Sc. CS"
                    className="mt-1.5 resize-none rounded-lg border-[#D0CCC3] bg-[#F7F6F3] text-[12.5px]"
                    value={draft.note}
                    onChange={(e) => setEditDraft({ ...draft, note: e.target.value })}
                  />
                </div>

                <div
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3",
                    draft.enabled
                      ? "border-[#A0D8B8] bg-[#E8F5EE]"
                      : "border-[#E0DDD6] bg-[#F7F6F3]",
                  )}
                >
                  <div>
                    <div
                      className={cn(
                        "font-['Sora',sans-serif] text-[12.5px] font-bold",
                        draft.enabled ? "text-[#1A7A4A]" : "text-[#5A6478]",
                      )}
                    >
                      {draft.enabled ? "Activity Enabled" : "Activity Disabled"}
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#9AA0AE]">
                      Master switch — overrides all scope settings if off
                    </p>
                  </div>
                  <Switch
                    checked={draft.enabled}
                    onCheckedChange={(v) => setEditDraft({ ...draft, enabled: v })}
                    className="data-[state=checked]:bg-[#1A7A4A]"
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2 border-t border-[#E0DDD6] bg-[#F7F6F3] px-6 py-3.5 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-[#D0CCC3]"
                  onClick={() => setEditOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-[2] bg-[#1B2B4B] font-['Sora',sans-serif] font-bold hover:bg-[#2C3E63]"
                  onClick={saveEdit}
                >
                  Save Configuration →
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={!!proxyAction} onOpenChange={(o) => !o && setProxyAction(null)}>
        <DialogContent className="max-w-[360px] rounded-[14px] text-center [&>button]:hidden">
          {proxyAction ? (
            <>
              <div className="text-4xl">{proxyAction.icon}</div>
              <DialogTitle className="mt-3 font-['Sora',sans-serif] text-base font-extrabold text-[#1B2B4B]">
                {proxyAction.label}
              </DialogTitle>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#5A6478]">
                Opens <strong>{proxyAction.label}</strong> for <strong>{proxyStudent?.name}</strong>
                .<br />
                In production this loads the student&apos;s live page.
              </p>
              <div className="my-3 rounded-lg border border-[#F0D888] bg-[#FDF4DC] p-2.5 text-[11.5px] text-[#A07010]">
                Action logged under Staff ID. Student sees the same view.
              </div>
              <Button
                type="button"
                className="w-full bg-[#1B2B4B] font-['Sora',sans-serif] font-bold"
                onClick={() => setProxyAction(null)}
              >
                Close
              </Button>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScopeSection({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border-[1.5px] border-[#E0DDD6]">
      <div className="border-b border-[#E0DDD6] bg-[#F7F6F3] px-3.5 py-2.5">
        <div className="font-['Sora',sans-serif] text-xs font-bold text-[#1B2B4B]">{title}</div>
        {note ? <div className="mt-0.5 text-[10.5px] text-[#9AA0AE]">{note}</div> : null}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

function ProxyActivityGrid({
  activities,
  student,
  onOpen,
}: {
  activities: Activity[];
  student: MockStudent;
  onOpen: (act: Activity) => void;
}) {
  const visible = activities.filter((a) => {
    if (!a.enabled) return false;
    const ws = windowStatus(a);
    if (ws.label === "Closed") return false;
    return true;
  });

  if (visible.length === 0) {
    return (
      <div className="py-6 text-center text-[13px] text-[#9AA0AE]">
        No activities are currently live or scheduled.
      </div>
    );
  }

  return (
    <div className="grid h-full  grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
      {visible.map((act) => {
        const ws = windowStatus(act);
        const inScope = studentInScope(act, student);
        const as = getActStatus(act, student);
        const audOk = act.audience === "all" || act.audience === "student";
        const isScheduled = ws.label === "Scheduled";
        const blocked = !inScope || !as.accessible;
        let scopeBlockReason = "";
        if (!inScope) {
          const semOk = isAll(act.scopeSems, ALL_SEMS) || act.scopeSems.includes(student.sem);
          const progOk =
            isAll(act.scopePrograms, ALL_PROGRAMS) || act.scopePrograms.includes(student.deptId);
          const affOk = isAll(act.scopeAffs, ALL_AFFS) || act.scopeAffs.includes(student.affId);
          if (!semOk) scopeBlockReason = `Not available for Sem ${SL[student.sem - 1]}`;
          else if (!progOk) scopeBlockReason = `Not available for ${student.dept}`;
          else if (!affOk) scopeBlockReason = "Not available for this college";
        }
        return (
          <div
            key={act.id}
            className={cn(
              "relative flex flex-col gap-2 overflow-hidden rounded-[11px] border bg-white p-3.5 shadow-sm transition-all",
              as.done ? "border-[#A0D8B8]" : "border-[#E0DDD6]",
              blocked && !isScheduled
                ? "pointer-events-none opacity-45"
                : "hover:-translate-y-px hover:shadow-md",
            )}
          >
            {!audOk ? (
              <div className="absolute right-2 top-2 rounded border border-[#C4B4F4] bg-[#EEE9FC] px-1.5 py-0.5 font-['Sora',sans-serif] text-[9px] font-bold tracking-wide text-[#5B3FC4]">
                STAFF ONLY
              </div>
            ) : null}
            <div className="flex gap-2">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base",
                  !inScope
                    ? "border-[#E0DDD6] bg-[#EFEDE8]"
                    : as.done
                      ? "border-[#A0D8B8] bg-[#E8F5EE]"
                      : "border-[#E0DDD6] bg-[#F7F6F3]",
                )}
              >
                {act.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "font-['Sora',sans-serif] text-[12.5px] font-bold leading-tight",
                    blocked ? "text-[#9AA0AE]" : "text-[#1B2B4B]",
                  )}
                >
                  {act.label}
                </div>
                <p className="mt-0.5 text-[10.5px] text-[#9AA0AE]">{act.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#E0DDD6] pt-2">
              <span
                className={cn(
                  "text-[11.5px] font-semibold",
                  as.done
                    ? "text-[#1A7A4A]"
                    : !inScope
                      ? "text-[#9AA0AE]"
                      : as.accessible
                        ? "text-[#5A6478]"
                        : "text-[#C23B3B]",
                )}
              >
                {scopeBlockReason || as.info}
              </span>
              {isScheduled ? (
                <span className="text-[10.5px] font-semibold text-[#1A6BB5]">
                  Opens {fmt(act.startDt)}
                </span>
              ) : !blocked ? (
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    "h-7 rounded-md px-3 font-['Sora',sans-serif] text-[11.5px] font-bold",
                    as.done ? "bg-[#1B2B4B]" : "bg-[#1A7A4A] hover:bg-[#145E38]",
                  )}
                  onClick={() => onOpen(act)}
                >
                  {as.done ? "View" : "Open →"}
                </Button>
              ) : (
                <span className="text-[11px] text-[#D0CCC3]">Locked</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
