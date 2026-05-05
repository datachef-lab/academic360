import * as React from "react";
import { Pencil, Plus, Search, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import axiosInstance from "@/utils/api";
import { findAllClasses } from "@/services/class.service";
import { getAffiliations, getRegulationTypes, getStreams } from "@/services/course-design.api";
import { getAllAcademicYears } from "@/services/academic-year-api";
import { getPromotionStatuses } from "@/services/promotion-status.api";

const SL = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"] as const;

const ACTIVITY_TYPE_OPTIONS = [
  { value: "FINANCE", label: "Finance" },
  { value: "EXAMINATION", label: "Examination" },
  { value: "ADMISSION", label: "Admission" },
  { value: "ACADEMIC", label: "Academic" },
] as const;

const DEFAULT_AUDIENCE: Audience = "STUDENT";

type ActivityType = "FINANCE" | "EXAMINATION" | "ADMISSION" | "ACADEMIC";
type Audience = "ALL" | "STUDENT" | "STAFF";

type ScopeDto = {
  id?: number;
  streamId: number;
  classId: number;
  startDate: string | null;
  endDate: string | null;
  isEnabled: boolean;
  stream?: { id: number; name: string; code?: string };
  class?: { id: number; name: string; sequence?: number | null };
};

type ActivityMasterDto = {
  id: number;
  type: ActivityType;
  name: string;
  description: string | null;
  remarks: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type AcademicActivityApiDto = {
  id: number;
  audience: Audience;
  master: ActivityMasterDto;
  academicYear: { id: number; year: string };
  affiliation: { id: number; name: string; shortName?: string | null };
  regulationType: { id: number; name: string; shortName?: string | null };
  appearType: { id: number; name: string };
  scopes: ScopeDto[];
};

type ApiResponse<T> = { payload: T };

type ClassOption = {
  id: number;
  name: string;
  sequence?: number | null;
  isActive?: boolean | null;
};
type StreamOption = { id: number; name: string; code?: string };
type AcademicYearOption = { id: number; year: string; isCurrentYear?: boolean };
type AffiliationOption = { id: number; name: string; shortName?: string | null };
type RegulationOption = { id: number; name: string; shortName?: string | null };
type PromotionStatusOption = { id: number; name: string };

type ScopeDraft = {
  id?: number;
  streamId: number;
  classId: number;
  startDate: string;
  endDate: string;
  isEnabled: boolean;
};

type RuleDraft = {
  id?: number;
  academicYearId: number;
  affiliationId: number;
  regulationTypeId: number;
  appearTypeId: number;
  audience: Audience;
  scopes: ScopeDraft[];
};

type MasterDraft = {
  id?: number;
  name: string;
  description: string;
  remarks: string;
  type: ActivityType;
  isActive: boolean;
};

type ProxyStudent = {
  uid: string;
  name: string;
  sem: number;
  dept: string;
  deptId: number;
  affId: number;
  photo: string;
};

function toDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function ruleStatus(rule: RuleDraft): string {
  const enabled = rule.scopes.filter((s) => s.isEnabled);
  if (!enabled.length) return "No scopes";
  const now = Date.now();
  const live = enabled.some((s) => {
    const start = s.startDate ? new Date(s.startDate).getTime() : 0;
    const end = s.endDate ? new Date(s.endDate).getTime() : Number.POSITIVE_INFINITY;
    return now >= start && now <= end;
  });
  if (live) return "Live";
  const scheduled = enabled.some((s) => {
    const start = s.startDate ? new Date(s.startDate).getTime() : 0;
    return now < start;
  });
  if (scheduled) return "Scheduled";
  return "Closed";
}

function scopeStatus(scope: ScopeDraft): { label: string; cls: string } {
  if (!scope.isEnabled)
    return { label: "Off", cls: "border-[#E0DDD6] bg-[#F7F6F3] text-[#9AA0AE]" };
  if (!scope.startDate && !scope.endDate)
    return { label: "No Dates", cls: "border-[#F0D888] bg-[#FDF4DC] text-[#A07010]" };
  const now = Date.now();
  const start = scope.startDate ? new Date(scope.startDate).getTime() : 0;
  const end = scope.endDate ? new Date(scope.endDate).getTime() : Number.POSITIVE_INFINITY;
  if (now < start)
    return { label: "Scheduled", cls: "border-[#9EC8F0] bg-[#EBF3FC] text-[#1A6BB5]" };
  if (now > end) return { label: "Closed", cls: "border-[#E0DDD6] bg-[#F7F6F3] text-[#9AA0AE]" };
  return { label: "Live", cls: "border-[#A0D8B8] bg-[#E8F5EE] text-[#1A7A4A]" };
}

function activityStatus(act: AcademicActivityApiDto): {
  label: string;
  color: string;
  bg: string;
  bd: string;
  live?: boolean;
} {
  if (!act.master.isActive)
    return {
      label: "Disabled",
      color: "text-[#9AA0AE]",
      bg: "bg-[#F7F6F3]",
      bd: "border-[#E0DDD6]",
    };
  if (!act.scopes.length)
    return {
      label: "No Scopes",
      color: "text-[#A07010]",
      bg: "bg-[#FDF4DC]",
      bd: "border-[#F0D888]",
    };
  const enabledScopes = act.scopes.filter((s) => s.isEnabled);
  if (!enabledScopes.length)
    return {
      label: "All Off",
      color: "text-[#9AA0AE]",
      bg: "bg-[#F7F6F3]",
      bd: "border-[#E0DDD6]",
    };
  const now = Date.now();
  const live = enabledScopes.filter((s) => {
    const start = s.startDate ? new Date(s.startDate).getTime() : 0;
    const end = s.endDate ? new Date(s.endDate).getTime() : Number.POSITIVE_INFINITY;
    return now >= start && now <= end;
  });
  if (live.length > 0)
    return {
      label: `${live.length} Live`,
      color: "text-[#1A7A4A]",
      bg: "bg-[#E8F5EE]",
      bd: "border-[#A0D8B8]",
      live: true,
    };
  const scheduled = enabledScopes.filter((s) => {
    const start = s.startDate ? new Date(s.startDate).getTime() : 0;
    return now < start;
  });
  if (scheduled.length > 0)
    return {
      label: "Scheduled",
      color: "text-[#1A6BB5]",
      bg: "bg-[#EBF3FC]",
      bd: "border-[#9EC8F0]",
    };
  return { label: "Closed", color: "text-[#9AA0AE]", bg: "bg-[#F7F6F3]", bd: "border-[#E0DDD6]" };
}

function typeIcon(type: ActivityType): string {
  switch (type) {
    case "FINANCE":
      return "\u{1F4B3}";
    case "EXAMINATION":
      return "\u{1F4CB}";
    case "ADMISSION":
      return "\u{270D}\u{FE0F}";
    case "ACADEMIC":
      return "\u{1F4DA}";
    default:
      return "\u{1F4CC}";
  }
}

export default function AcademicActivityPage() {
  const [masters, setMasters] = React.useState<ActivityMasterDto[]>([]);
  const [activities, setActivities] = React.useState<AcademicActivityApiDto[]>([]);
  const [classOptions, setClassOptions] = React.useState<ClassOption[]>([]);
  const [streams, setStreams] = React.useState<StreamOption[]>([]);
  const [academicYears, setAcademicYears] = React.useState<AcademicYearOption[]>([]);
  const [affiliations, setAffiliations] = React.useState<AffiliationOption[]>([]);
  const [regulations, setRegulations] = React.useState<RegulationOption[]>([]);
  const [promotionStatuses, setPromotionStatuses] = React.useState<PromotionStatusOption[]>([]);

  const [isSaving, setIsSaving] = React.useState(false);
  const [filterCat, setFilterCat] = React.useState<string>("All");

  const [masterOpen, setMasterOpen] = React.useState(false);
  const [masterDraft, setMasterDraft] = React.useState<MasterDraft | null>(null);
  const [rules, setRules] = React.useState<RuleDraft[]>([]);

  const [scopeOpen, setScopeOpen] = React.useState(false);
  const [scopeRuleIdx, setScopeRuleIdx] = React.useState<number>(-1);

  const [proxyUID, setProxyUID] = React.useState("");
  const [proxyStudent, setProxyStudent] = React.useState<ProxyStudent | null>(null);
  const [proxyResolved, setProxyResolved] = React.useState(false);

  const CATS = React.useMemo(() => ["All", ...ACTIVITY_TYPE_OPTIONS.map((t) => t.label)], []);

  const activeClassOptions = React.useMemo(
    () =>
      classOptions
        .filter((c) => c.isActive !== false)
        .sort((a, b) => {
          const sa = a.sequence ?? Number.MAX_SAFE_INTEGER;
          const sb = b.sequence ?? Number.MAX_SAFE_INTEGER;
          if (sa !== sb) return sa - sb;
          return (a.name || "").localeCompare(b.name || "");
        }),
    [classOptions],
  );

  const loadData = React.useCallback(async () => {
    const [classesRes, streamsRes, ayRes, affRes, regRes, psRes, mastersRes, activitiesRes] =
      await Promise.all([
        findAllClasses(),
        getStreams(),
        getAllAcademicYears(),
        getAffiliations(),
        getRegulationTypes(),
        getPromotionStatuses({ isActive: true }),
        axiosInstance.get<ApiResponse<ActivityMasterDto[]>>(
          "/api/academics/academic-activity-masters",
        ),
        axiosInstance.get<ApiResponse<AcademicActivityApiDto[]>>(
          "/api/academics/academic-activities",
        ),
      ]);

    setClassOptions(
      (classesRes?.payload ?? []).map((c: any) => ({
        id: c.id,
        name: c.name,
        sequence: c.sequence,
        isActive: c.isActive,
      })),
    );
    setStreams((streamsRes ?? []).map((s: any) => ({ id: s.id, name: s.name, code: s.code })));
    setAcademicYears(
      (ayRes?.payload ?? []).map((a: any) => ({
        id: a.id,
        year: a.year,
        isCurrentYear: a.isCurrentYear,
      })),
    );
    setAffiliations(
      (affRes ?? [])
        .filter((a: any) => a?.isActive !== false)
        .map((a: any) => ({ id: a.id, name: a.name, shortName: a.shortName })),
    );
    setRegulations(
      (regRes ?? [])
        .filter((r: any) => r?.isActive !== false)
        .map((r: any) => ({ id: r.id, name: r.name, shortName: r.shortName })),
    );
    setPromotionStatuses((psRes ?? []).map((p: any) => ({ id: p.id, name: p.name })));
    setMasters(mastersRes.data?.payload ?? []);
    setActivities(activitiesRes.data?.payload ?? []);
  }, []);

  React.useEffect(() => {
    loadData().catch(console.error);
  }, [loadData]);

  const openCreateMaster = () => {
    setMasterDraft({ name: "", description: "", remarks: "", type: "ACADEMIC", isActive: true });
    setRules([]);
    setMasterOpen(true);
  };

  const openEditMaster = (m: ActivityMasterDto) => {
    setMasterDraft({
      id: m.id,
      name: m.name,
      description: m.description ?? "",
      remarks: m.remarks ?? "",
      type: m.type,
      isActive: m.isActive,
    });
    const linked = activities.filter((a) => a.master.id === m.id);
    setRules(
      linked.map((a) => ({
        id: a.id,
        academicYearId: a.academicYear.id,
        affiliationId: a.affiliation.id,
        regulationTypeId: a.regulationType.id,
        appearTypeId: a.appearType.id,
        audience: a.audience,
        scopes: a.scopes.map((s) => ({
          id: s.id,
          streamId: s.streamId ?? s.stream?.id ?? 0,
          classId: s.classId ?? s.class?.id ?? 0,
          startDate: toDateTimeLocal(s.startDate),
          endDate: toDateTimeLocal(s.endDate),
          isEnabled: s.isEnabled,
        })),
      })),
    );
    setMasterOpen(true);
  };

  const saveMasterAndRules = async () => {
    if (!masterDraft) return;
    try {
      setIsSaving(true);

      let savedMaster: ActivityMasterDto;
      if (masterDraft.id) {
        const res = await axiosInstance.put<ApiResponse<ActivityMasterDto>>(
          `/api/academics/academic-activity-masters/${masterDraft.id}`,
          { remarks: masterDraft.remarks || null, isActive: masterDraft.isActive },
        );
        savedMaster = res.data.payload;
        setMasters((prev) => prev.map((m) => (m.id === savedMaster.id ? savedMaster : m)));
      } else {
        const res = await axiosInstance.post<ApiResponse<ActivityMasterDto>>(
          "/api/academics/academic-activity-masters",
          {
            name: masterDraft.name.trim(),
            description: masterDraft.description || null,
            remarks: masterDraft.remarks || null,
            type: masterDraft.type,
            isActive: masterDraft.isActive,
          },
        );
        savedMaster = res.data.payload;
        setMasters((prev) => [...prev, savedMaster]);
      }

      const newRules = rules.filter((r) => !r.id);
      for (const rule of newRules) {
        await axiosInstance.post("/api/academics/academic-activities", {
          academicActivityMasterId: savedMaster.id,
          academicYearId: rule.academicYearId,
          affiliationId: rule.affiliationId,
          regulationTypeId: rule.regulationTypeId,
          appearTypeId: rule.appearTypeId,
          audience: rule.audience,
          scopes: rule.scopes.map((s) => ({
            streamId: s.streamId,
            classId: s.classId,
            startDate: s.startDate ? new Date(s.startDate).toISOString() : null,
            endDate: s.endDate ? new Date(s.endDate).toISOString() : null,
            isEnabled: s.isEnabled,
          })),
        });
      }

      await loadData();
      setMasterOpen(false);
      setMasterDraft(null);
      setRules([]);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMaster = async (id: number) => {
    if (!confirm("Are you sure you want to delete this activity?")) return;
    try {
      const linked = activities.filter((a) => a.master.id === id);
      for (const a of linked) {
        await axiosInstance.delete(`/api/academics/academic-activities/${a.id}`);
      }
      await axiosInstance.delete(`/api/academics/academic-activity-masters/${id}`);
      setMasters((prev) => prev.filter((m) => m.id !== id));
      setActivities((prev) => prev.filter((a) => a.master.id !== id));
      setMasterOpen(false);
      setMasterDraft(null);
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const toggleMasterActive = async (m: ActivityMasterDto, isActive: boolean) => {
    setMasters((prev) => prev.map((x) => (x.id === m.id ? { ...x, isActive } : x)));
    try {
      await axiosInstance.put(`/api/academics/academic-activity-masters/${m.id}`, { isActive });
    } catch {
      setMasters((prev) => prev.map((x) => (x.id === m.id ? { ...x, isActive: !isActive } : x)));
    }
  };

  const addRule = () => {
    const currentAy = academicYears.find((a) => a.isCurrentYear) ?? academicYears[0];
    setRules((prev) => [
      ...prev,
      {
        academicYearId: currentAy?.id ?? 0,
        affiliationId: affiliations[0]?.id ?? 0,
        regulationTypeId: regulations[0]?.id ?? 0,
        appearTypeId: promotionStatuses[0]?.id ?? 0,
        audience: DEFAULT_AUDIENCE,
        scopes: [],
      },
    ]);
  };

  const removeRule = (idx: number) => {
    setRules((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateRule = (idx: number, patch: Partial<RuleDraft>) => {
    setRules((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const openScopeDialog = (ruleIdx: number) => {
    setScopeRuleIdx(ruleIdx);
    setScopeOpen(true);
  };

  const loadStudent = async (uid: string) => {
    const t = uid.trim();
    setProxyUID(t);
    setProxyResolved(true);
    if (!t) {
      setProxyStudent(null);
      return;
    }
    try {
      const res = await axiosInstance.get<ApiResponse<any>>(
        `/api/students/uid/${encodeURIComponent(t)}`,
      );
      const p = res.data?.payload;
      if (!p?.uid) {
        setProxyStudent(null);
        return;
      }
      setProxyStudent({
        uid: String(p.uid),
        name: p?.personalDetails?.firstName || p?.name || "Student",
        sem: Number(p?.currentSemester || 1),
        dept: p?.programCourse?.name || p?.programCourse?.shortName || "Program",
        deptId: p?.programCourse?.id ?? 0,
        affId: p?.programCourse?.affiliationId ?? 0,
        photo: (p?.personalDetails?.firstName || p?.name || "S").slice(0, 2).toUpperCase(),
      });
    } catch {
      setProxyStudent(null);
    }
  };

  const filteredMasters = masters.filter((m) => {
    if (filterCat === "All") return true;
    const typeLabel = ACTIVITY_TYPE_OPTIONS.find((t) => t.value === m.type)?.label;
    return typeLabel === filterCat;
  });

  const activeMasters = masters.filter((m) => m.isActive).length;

  return (
    <div className="min-h-full w-full min-w-0 max-w-none overflow-x-hidden bg-[#F0EEE9] px-4 py-6 font-['DM_Sans',system-ui,sans-serif] md:px-6 lg:px-8">
      <div className="w-full min-w-0">
        <div className="mb-6 flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-['Sora',sans-serif] text-[22px] font-extrabold tracking-tight text-[#1B2B4B]">
              Academic Activity Control
            </h1>
            <p className="mt-1.5 max-w-[520px] text-[13px] leading-relaxed text-[#5A6478]">
              Configure rule-based access windows per activity. Each activity targets a specific
              academic year, affiliation, regulation, and per-scope (stream + class) timings.
            </p>
          </div>
          <Button
            type="button"
            className="bg-[#1B2B4B] font-['Sora',sans-serif] font-bold hover:bg-[#2C3E63]"
            onClick={openCreateMaster}
          >
            <Plus className="mr-1.5 h-4 w-4" /> New Activity
          </Button>
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
                  v: masters.length,
                  c: "text-[#1B2B4B]",
                  bg: "bg-[#F7F6F3]",
                  bd: "border-[#E0DDD6]",
                  dot: false,
                },
                {
                  l: "Active",
                  v: activeMasters,
                  c: "text-[#1A7A4A]",
                  bg: "bg-[#E8F5EE]",
                  bd: "border-[#A0D8B8]",
                  dot: true,
                },
                {
                  l: "Instances",
                  v: activities.length,
                  c: "text-[#1A6BB5]",
                  bg: "bg-[#EBF3FC]",
                  bd: "border-[#9EC8F0]",
                  dot: false,
                },
                {
                  l: "Inactive",
                  v: masters.filter((m) => !m.isActive).length,
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
              {CATS.map((c) => (
                <Button
                  key={c}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 rounded-md border-[1.5px] text-xs font-semibold",
                    filterCat === c
                      ? "border-[#1B2B4B] bg-[#1B2B4B] text-white hover:bg-[#1B2B4B]"
                      : "border-[#D0CCC3] bg-white text-[#5A6478] hover:bg-[#F7F6F3]",
                  )}
                  onClick={() => setFilterCat(c)}
                >
                  {c}
                </Button>
              ))}
            </div>

            <div className="w-full min-w-0 overflow-hidden rounded-xl border-[1.5px] border-[#D0CCC3] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <div
                  className="grid min-w-[600px] grid-cols-[48px_1fr_180px_120px_110px_44px] border-b border-[#E0DDD6] bg-[#F7F6F3] px-4"
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {["", "Activity", "Rules", "Status", "Enabled", ""].map((h, i) => (
                    <div
                      key={i}
                      className={cn(
                        "py-2.5 text-[10px] font-bold uppercase tracking-wider text-[#9AA0AE]",
                        i > 0 && "pl-3",
                      )}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {filteredMasters.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-[#9AA0AE]">
                    No activities found. Click <strong>+ New Activity</strong> to create one.
                  </div>
                ) : null}
                {filteredMasters.map((m, i) => {
                  const linkedRules = activities.filter((a) => a.master.id === m.id);
                  const totalItems = linkedRules.reduce((sum, r) => sum + r.scopes.length, 0);
                  const liveItems = linkedRules.reduce(
                    (sum, r) =>
                      sum +
                      r.scopes.filter((s) => {
                        if (!s.isEnabled) return false;
                        const start = s.startDate ? new Date(s.startDate).getTime() : 0;
                        const end = s.endDate
                          ? new Date(s.endDate).getTime()
                          : Number.POSITIVE_INFINITY;
                        return Date.now() >= start && Date.now() <= end;
                      }).length,
                    0,
                  );
                  const masterStatus = (() => {
                    if (!m.isActive)
                      return {
                        label: "Disabled",
                        cls: "border-[#E0DDD6] bg-[#F7F6F3] text-[#9AA0AE]",
                      };
                    if (!linkedRules.length)
                      return {
                        label: "No Rules",
                        cls: "border-[#F0D888] bg-[#FDF4DC] text-[#A07010]",
                      };
                    if (liveItems > 0)
                      return {
                        label: `${liveItems} Live`,
                        cls: "border-[#A0D8B8] bg-[#E8F5EE] text-[#1A7A4A]",
                      };
                    const allScopes = linkedRules.flatMap((r) =>
                      r.scopes.filter((s) => s.isEnabled),
                    );
                    const scheduled = allScopes.some((s) => {
                      const st = s.startDate ? new Date(s.startDate).getTime() : 0;
                      return Date.now() < st;
                    });
                    if (scheduled)
                      return {
                        label: "Scheduled",
                        cls: "border-[#9EC8F0] bg-[#EBF3FC] text-[#1A6BB5]",
                      };
                    return { label: "Closed", cls: "border-[#E0DDD6] bg-[#F7F6F3] text-[#9AA0AE]" };
                  })();
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => openEditMaster(m)}
                      className={cn(
                        "grid w-full min-w-[600px] grid-cols-[48px_1fr_180px_120px_110px_44px] items-center border-b border-[#E0DDD6] px-4 text-left transition-colors hover:bg-[#F7F6F3]",
                        i === filteredMasters.length - 1 && "border-b-0",
                      )}
                    >
                      <div className="py-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E0DDD6] bg-[#F7F6F3] text-[15px]">
                          {typeIcon(m.type)}
                        </div>
                      </div>
                      <div className="py-3 pl-3">
                        <div className="font-['Sora',sans-serif] text-[12.5px] font-bold leading-tight text-[#1B2B4B]">
                          {m.name}
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#9AA0AE]">
                          {ACTIVITY_TYPE_OPTIONS.find((t) => t.value === m.type)?.label}
                        </div>
                      </div>
                      <div className="py-3 pl-3">
                        {linkedRules.length > 0 ? (
                          <>
                            <div className="text-[12px] font-bold text-[#1B2B4B]">
                              {linkedRules.length} rule{linkedRules.length > 1 ? "s" : ""} &middot;{" "}
                              {totalItems} item{totalItems !== 1 ? "s" : ""}
                            </div>
                            <div
                              className={cn(
                                "mt-0.5 text-[10.5px]",
                                liveItems > 0 ? "text-[#1A7A4A]" : "text-[#9AA0AE]",
                              )}
                            >
                              {liveItems > 0 ? `${liveItems} live` : "None live"}
                            </div>
                          </>
                        ) : (
                          <span className="text-[11.5px] text-[#9AA0AE]">No rules yet</span>
                        )}
                      </div>
                      <div className="py-3 pl-3">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-bold", masterStatus.cls)}
                        >
                          {masterStatus.label}
                        </Badge>
                      </div>
                      <div
                        className="flex items-center gap-2 py-3 pl-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Switch
                          checked={m.isActive}
                          onCheckedChange={(v) => toggleMasterActive(m, v)}
                          className="data-[state=checked]:bg-[#1A7A4A]"
                        />
                        <span
                          className={cn(
                            "text-[11px] font-semibold",
                            m.isActive ? "text-[#1A7A4A]" : "text-[#9AA0AE]",
                          )}
                        >
                          {m.isActive ? "On" : "Off"}
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
                  Load &rarr;
                </Button>
              </div>
              {proxyResolved && !proxyStudent ? (
                <p className="mt-2 text-xs text-[#C23B3B]">
                  &lsaquo; No student found with UID &quot;{proxyUID}&quot;.
                </p>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-xl border-[1.5px] border-[#D0CCC3] bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-[#E0DDD6] bg-[#F7F6F3] px-4 py-3">
                <div className="font-['Sora',sans-serif] text-[13px] font-bold text-[#1B2B4B]">
                  Student Activity Portal
                </div>
                {proxyStudent ? (
                  <div className="flex items-center gap-2">
                    <Badge className="border border-[#F0C97A] bg-[#FEF6E8] text-[11px] text-[#C8820A]">
                      {proxyStudent.name}
                    </Badge>
                    <Badge className="border border-[#9EC8F0] bg-[#EBF3FC] text-[11px] text-[#1A6BB5]">
                      {proxyStudent.dept} &middot; Sem {SL[proxyStudent.sem - 1]}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px] text-[#9AA0AE]"
                      onClick={() => {
                        setProxyStudent(null);
                        setProxyUID("");
                        setProxyResolved(false);
                      }}
                    >
                      Clear &times;
                    </Button>
                  </div>
                ) : null}
              </div>
              <div className={proxyStudent ? "p-4" : ""}>
                {!proxyStudent ? (
                  <div className="px-5 py-10 text-center">
                    <div className="mb-3 text-3xl">{"\u{1F50D}"}</div>
                    <div className="font-['Sora',sans-serif] text-sm font-bold text-[#1B2B4B]">
                      No student loaded
                    </div>
                    <p className="mt-1.5 text-xs text-[#9AA0AE]">
                      Enter a student UID to preview their activity portal.
                    </p>
                  </div>
                ) : (
                  <ProxyActivityGrid
                    activities={activities}
                    classOptions={activeClassOptions}
                    student={proxyStudent}
                  />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Master Dialog with Access Rules */}
      <Dialog
        open={masterOpen}
        onOpenChange={(o) => {
          if (!o) {
            setMasterOpen(false);
            setMasterDraft(null);
            setRules([]);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] w-[96vw] max-w-[1100px] overflow-y-auto rounded-[14px] border-[#E0DDD6] p-0 font-['DM_Sans',system-ui,sans-serif] shadow-[0_2px_8px_rgba(27,43,75,.09),0_8px_32px_rgba(27,43,75,.09)] [&>button]:hidden">
          {masterDraft ? (
            <>
              {/* Sticky header */}
              <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-[14px] border-b border-[#E0DDD6] bg-white px-6 pb-3.5 pt-[18px]">
                <div className="flex items-center gap-3">
                  <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[9px] border-[1.5px] border-[#E0DDD6] bg-[#F7F6F3] text-lg">
                    {typeIcon(masterDraft.type)}
                  </div>
                  <div>
                    <div className="font-['Sora',sans-serif] text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA0AE]">
                      {masterDraft.id ? "Configure Activity" : "Create Activity"}
                    </div>
                    <DialogTitle className="mt-0.5 font-['Sora',sans-serif] text-left text-[15px] font-extrabold text-[#1B2B4B]">
                      {masterDraft.name || "New Activity"}
                    </DialogTitle>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {masterDraft.id ? (
                    <button
                      type="button"
                      onClick={() => deleteMaster(masterDraft.id!)}
                      className="flex h-7 w-7 items-center justify-center rounded-[6px] border-[1.5px] border-[#F5BFBF] bg-[#FEF0F0] text-sm text-[#C23B3B] transition-colors hover:bg-[#FDDDDD]"
                    >
                      &times;
                    </button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 border-[#E0DDD6] text-[#9AA0AE]"
                    onClick={() => setMasterOpen(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col gap-4 px-6 pb-4 pt-3">
                {/* ACCESS RULES */}
                <div>
                  <div className="mb-2.5 flex items-center justify-between">
                    <div className="font-['Sora',sans-serif] text-[11px] font-bold uppercase tracking-[.07em] text-[#9AA0AE]">
                      Access Rules
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 rounded-[7px] bg-[#1B2B4B] px-3.5 font-['Sora',sans-serif] text-[12px] font-bold"
                      onClick={addRule}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Add Rule
                    </Button>
                  </div>

                  <div className="overflow-hidden rounded-[10px] border-[1.5px] border-[#D0CCC3] shadow-[0_1px_3px_rgba(27,43,75,.06)]">
                    <div className="h-[280px] overflow-auto">
                      <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-[1]">
                          <tr className="bg-[#F7F6F3]">
                            {[
                              "#",
                              "Academic Year",
                              "Affiliation",
                              "Regulation",
                              "Appear Type",
                              "Applicable To",
                              "Status",
                              "",
                            ].map((h, i) => (
                              <th
                                key={i}
                                className="whitespace-nowrap border-b-[1.5px] border-[#E0DDD6] px-2.5 py-2 text-left font-['Sora',sans-serif] text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA0AE] first:w-8 first:text-center last:w-8"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rules.length === 0 ? (
                            <tr>
                              <td
                                colSpan={8}
                                className="px-4 py-8 text-center text-[13px] text-[#9AA0AE]"
                              >
                                No rules yet. Click <strong>+ Add Rule</strong> to get started.
                              </td>
                            </tr>
                          ) : null}
                          {rules.map((rule, idx) => {
                            const st = ruleStatus(rule);
                            const enabledScopes = rule.scopes.filter((s) => s.isEnabled).length;
                            const totalScopes = rule.scopes.length;
                            const scopeClasses = [
                              ...new Set(
                                rule.scopes
                                  .filter((s) => s.isEnabled)
                                  .map((s) => {
                                    const cls = activeClassOptions.find((c) => c.id === s.classId);
                                    return cls?.sequence ? SL[cls.sequence - 1] : null;
                                  })
                                  .filter(Boolean),
                              ),
                            ];
                            return (
                              <tr key={idx} className="border-b border-[#E0DDD6] last:border-b-0">
                                <td className="px-2.5 py-2.5 text-center font-['Sora',sans-serif] text-[11px] font-bold text-[#9AA0AE]">
                                  {idx + 1}
                                </td>
                                <td className="px-2.5 py-2.5">
                                  <Select
                                    value={String(rule.academicYearId)}
                                    onValueChange={(v) =>
                                      updateRule(idx, { academicYearId: Number(v) })
                                    }
                                  >
                                    <SelectTrigger className="h-8 rounded-[7px] border-[1.5px] border-[#D0CCC3] bg-white text-[12px] font-semibold">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {academicYears.map((a) => (
                                        <SelectItem key={a.id} value={String(a.id)}>
                                          {a.year}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="px-2.5 py-2.5">
                                  <Select
                                    value={String(rule.affiliationId)}
                                    onValueChange={(v) =>
                                      updateRule(idx, { affiliationId: Number(v) })
                                    }
                                  >
                                    <SelectTrigger className="h-8 rounded-[7px] border-[1.5px] border-[#D0CCC3] bg-white text-[12px] font-semibold">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {affiliations.map((a) => (
                                        <SelectItem key={a.id} value={String(a.id)}>
                                          {a.shortName || a.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="px-2.5 py-2.5">
                                  <Select
                                    value={String(rule.regulationTypeId)}
                                    onValueChange={(v) =>
                                      updateRule(idx, { regulationTypeId: Number(v) })
                                    }
                                  >
                                    <SelectTrigger className="h-8 rounded-[7px] border-[1.5px] border-[#D0CCC3] bg-white text-[12px] font-semibold">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {regulations.map((r) => (
                                        <SelectItem key={r.id} value={String(r.id)}>
                                          {r.shortName || r.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="px-2.5 py-2.5">
                                  <Select
                                    value={String(rule.appearTypeId)}
                                    onValueChange={(v) =>
                                      updateRule(idx, { appearTypeId: Number(v) })
                                    }
                                  >
                                    <SelectTrigger className="h-8 rounded-[7px] border-[1.5px] border-[#D0CCC3] bg-white text-[12px] font-semibold">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {promotionStatuses.map((p) => (
                                        <SelectItem key={p.id} value={String(p.id)}>
                                          {p.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="px-2.5 py-2.5">
                                  <button
                                    type="button"
                                    onClick={() => openScopeDialog(idx)}
                                    className="w-full min-w-[120px] rounded-[7px] border-[1.5px] border-[#D0CCC3] bg-[#F7F6F3] px-2.5 py-1.5 text-left transition-colors hover:border-[#1B2B4B]"
                                  >
                                    {totalScopes > 0 ? (
                                      <>
                                        <span className="block text-[11px] font-bold text-[#1B2B4B]">
                                          {enabledScopes}/{totalScopes} items enabled
                                          {scopeClasses.length > 0
                                            ? ` \u00B7 ${scopeClasses.join(", ")}`
                                            : ""}
                                        </span>
                                        <span className="block text-[10.5px] font-semibold text-[#1A6BB5]">
                                          Edit &rarr;
                                        </span>
                                      </>
                                    ) : (
                                      <span className="block text-[11px] italic text-[#9AA0AE]">
                                        None
                                        <br />
                                        <span className="not-italic font-semibold text-[#1A6BB5]">
                                          Edit &rarr;
                                        </span>
                                      </span>
                                    )}
                                  </button>
                                </td>
                                <td className="px-2.5 py-2.5">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "whitespace-nowrap text-[10px] font-bold",
                                      st === "Live" &&
                                        "border-[#A0D8B8] bg-[#E8F5EE] text-[#1A7A4A]",
                                      st === "Scheduled" &&
                                        "border-[#9EC8F0] bg-[#EBF3FC] text-[#1A6BB5]",
                                      st === "Closed" &&
                                        "border-[#E0DDD6] bg-[#F7F6F3] text-[#9AA0AE]",
                                      st === "Disabled" &&
                                        "border-[#E0DDD6] bg-[#F7F6F3] text-[#9AA0AE]",
                                      st === "No scopes" &&
                                        "border-[#F0D888] bg-[#FDF4DC] text-[#A07010]",
                                    )}
                                  >
                                    {st}
                                  </Badge>
                                </td>
                                <td className="px-2.5 py-2.5 text-center">
                                  {!rule.id ? (
                                    <button
                                      type="button"
                                      onClick={() => removeRule(idx)}
                                      className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] border-[1.5px] border-[#F5BFBF] bg-[#FEF0F0] text-sm text-[#C23B3B] transition-colors hover:bg-[#FDDDDD]"
                                    >
                                      &times;
                                    </button>
                                  ) : null}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Internal Note */}
                <div>
                  <Label className="mb-1.5 block text-[11.5px] font-semibold text-[#5A6478]">
                    Internal Note <span className="font-normal text-[#9AA0AE]">(optional)</span>
                  </Label>
                  <Textarea
                    rows={2}
                    className="resize-none rounded-[8px] border-[1.5px] border-[#D0CCC3] bg-[#F7F6F3] text-[12.5px] leading-relaxed"
                    value={masterDraft.remarks}
                    onChange={(e) => setMasterDraft({ ...masterDraft, remarks: e.target.value })}
                  />
                </div>

                {/* Master enabled toggle */}
                <div
                  className={cn(
                    "flex items-center justify-between rounded-[9px] border-[1.5px] px-3.5 py-2.5",
                    masterDraft.isActive
                      ? "border-[#A0D8B8] bg-[#E8F5EE]"
                      : "border-[#E0DDD6] bg-[#F7F6F3]",
                  )}
                >
                  <div>
                    <div
                      className={cn(
                        "font-['Sora',sans-serif] text-[12.5px] font-bold",
                        masterDraft.isActive ? "text-[#1A7A4A]" : "text-[#5A6478]",
                      )}
                    >
                      {masterDraft.isActive ? "Activity Enabled" : "Activity Disabled"}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#9AA0AE]">
                      Master switch &mdash; disabling hides this activity for everyone
                    </div>
                  </div>
                  <Switch
                    checked={masterDraft.isActive}
                    onCheckedChange={(v) => setMasterDraft({ ...masterDraft, isActive: v })}
                    className="data-[state=checked]:bg-[#1A7A4A]"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 z-10 flex gap-2 rounded-b-[14px] border-t border-[#E0DDD6] bg-[#F7F6F3] px-6 py-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-[8px] border-[1.5px] border-[#D0CCC3] text-[13px] font-semibold text-[#5A6478]"
                  onClick={() => setMasterOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-[3] rounded-[8px] bg-[#1B2B4B] font-['Sora',sans-serif] text-[13px] font-bold hover:bg-[#2C3E63]"
                  onClick={saveMasterAndRules}
                  disabled={isSaving || !masterDraft.name.trim()}
                >
                  {isSaving ? "Saving..." : "Save Configuration \u2192"}
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Nested Scope Dialog */}
      <Dialog
        open={scopeOpen}
        onOpenChange={(o) => {
          if (!o) setScopeOpen(false);
        }}
      >
        <DialogContent className="max-h-[92vh] w-[96vw] max-w-[960px] overflow-y-auto rounded-[14px] border-[#E0DDD6] p-0 font-['DM_Sans',system-ui,sans-serif] shadow-[0_2px_8px_rgba(27,43,75,.09),0_8px_32px_rgba(27,43,75,.09)] [&>button]:hidden">
          {scopeRuleIdx >= 0 && rules[scopeRuleIdx] ? (
            <ScopeEditor
              scopes={rules[scopeRuleIdx].scopes}
              classOptions={activeClassOptions}
              streams={streams}
              ruleIdx={scopeRuleIdx}
              onDone={async (updatedScopes) => {
                const currentRuleId = rules[scopeRuleIdx]?.id;
                updateRule(scopeRuleIdx, { scopes: updatedScopes });
                if (currentRuleId) {
                  try {
                    await axiosInstance.put(`/api/academics/academic-activities/${currentRuleId}`, {
                      scopes: updatedScopes.map((s) => ({
                        streamId: s.streamId,
                        classId: s.classId,
                        startDate: s.startDate ? new Date(s.startDate).toISOString() : null,
                        endDate: s.endDate ? new Date(s.endDate).toISOString() : null,
                        isEnabled: s.isEnabled,
                      })),
                    });
                    await loadData();
                  } catch (err) {
                    console.error("Failed to save scopes:", err);
                  }
                }
                setScopeOpen(false);
              }}
              onCancel={() => setScopeOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Scope Editor (nested dialog content) ─── */
function ScopeEditor({
  scopes: initialScopes,
  classOptions,
  streams,
  ruleIdx,
  onDone,
  onCancel,
}: {
  scopes: ScopeDraft[];
  classOptions: ClassOption[];
  streams: StreamOption[];
  ruleIdx: number;
  onDone: (scopes: ScopeDraft[]) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [draftScopes, setDraftScopes] = React.useState<ScopeDraft[]>(initialScopes);
  const [saving, setSaving] = React.useState(false);

  const addScope = () => {
    setDraftScopes((prev) => [
      ...prev,
      {
        streamId: streams[0]?.id ?? 0,
        classId: classOptions[0]?.id ?? 0,
        startDate: "",
        endDate: "",
        isEnabled: true,
      },
    ]);
  };

  const updateScopeDraft = (idx: number, patch: Partial<ScopeDraft>) => {
    setDraftScopes((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const removeScopeDraft = (idx: number) => {
    setDraftScopes((prev) => prev.filter((_, i) => i !== idx));
  };

  const enabledCount = draftScopes.filter((s) => s.isEnabled).length;

  const handleDone = async () => {
    setSaving(true);
    try {
      await onDone(draftScopes);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-[14px] border-b border-[#E0DDD6] bg-white px-6 pb-3 pt-4">
        <div>
          <div className="font-['Sora',sans-serif] text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA0AE]">
            Applicable To &mdash; Rule #{ruleIdx + 1}
          </div>
          <DialogTitle className="mt-0.5 font-['Sora',sans-serif] text-[14px] font-extrabold text-[#1B2B4B]">
            Configure Scopes
          </DialogTitle>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 border-[#E0DDD6] text-[#9AA0AE]"
          onClick={onCancel}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] text-[#9AA0AE]">
            {draftScopes.length} row{draftScopes.length !== 1 ? "s" : ""} &middot; {enabledCount}{" "}
            enabled
          </div>
          <Button
            type="button"
            size="sm"
            className="h-7 rounded-[7px] bg-[#1B2B4B] px-3.5 font-['Sora',sans-serif] text-[12px] font-bold"
            onClick={addScope}
          >
            <Plus className="mr-1 h-3 w-3" /> Add Scope
          </Button>
        </div>

        <div className="overflow-hidden rounded-[10px] border-[1.5px] border-[#D0CCC3] shadow-[0_1px_3px_rgba(27,43,75,.06)]">
          <div className="h-[320px] overflow-y-auto">
            <table className="w-full border-collapse">
              <colgroup>
                <col className="w-[48px]" />
                <col />
                <col />
                <col />
                <col />
                <col className="w-[72px]" />
                <col className="w-[36px]" />
              </colgroup>
              <thead className="sticky top-0 z-[1]">
                <tr className="bg-[#F7F6F3]">
                  <th className="border-b-[1.5px] border-[#E0DDD6] px-2.5 py-2 text-left font-['Sora',sans-serif] text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA0AE]">
                    On
                  </th>
                  <th className="border-b-[1.5px] border-[#E0DDD6] px-2.5 py-2 text-left font-['Sora',sans-serif] text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA0AE]">
                    Stream
                  </th>
                  <th className="border-b-[1.5px] border-[#E0DDD6] px-2.5 py-2 text-left font-['Sora',sans-serif] text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA0AE]">
                    Course Level
                  </th>
                  <th className="border-b-[1.5px] border-[#E0DDD6] px-2.5 py-2 text-left font-['Sora',sans-serif] text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA0AE]">
                    Start Date
                  </th>
                  <th className="border-b-[1.5px] border-[#E0DDD6] px-2.5 py-2 text-left font-['Sora',sans-serif] text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA0AE]">
                    End Date
                  </th>
                  <th className="border-b-[1.5px] border-[#E0DDD6] px-2.5 py-2 text-center font-['Sora',sans-serif] text-[10px] font-bold uppercase tracking-[.07em] text-[#9AA0AE]">
                    Status
                  </th>
                  <th className="border-b-[1.5px] border-[#E0DDD6] px-2.5 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {draftScopes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[12px] text-[#9AA0AE]">
                      No scopes yet. Click <strong>+ Add Scope</strong> to add one.
                    </td>
                  </tr>
                ) : null}
                {draftScopes.map((scope, idx) => {
                  const st = scopeStatus(scope);
                  return (
                    <tr
                      key={idx}
                      className={cn(
                        "border-b border-[#E0DDD6] last:border-b-0",
                        !scope.isEnabled && "bg-[#F7F6F3]",
                      )}
                    >
                      <td className="px-2.5 py-2.5">
                        <Switch
                          checked={scope.isEnabled}
                          onCheckedChange={(v) => updateScopeDraft(idx, { isEnabled: v })}
                          className="scale-[0.8] data-[state=checked]:bg-[#1A7A4A]"
                        />
                      </td>
                      <td className="px-2.5 py-2.5">
                        <Select
                          value={String(scope.streamId)}
                          onValueChange={(v) => updateScopeDraft(idx, { streamId: Number(v) })}
                        >
                          <SelectTrigger
                            className={cn(
                              "h-8 w-full rounded-[7px] border-[1.5px] border-[#D0CCC3] bg-white text-[12px] font-medium",
                              !scope.isEnabled && "opacity-50",
                            )}
                          >
                            <SelectValue placeholder="Stream" />
                          </SelectTrigger>
                          <SelectContent>
                            {streams.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2.5 py-2.5">
                        <Select
                          value={String(scope.classId)}
                          onValueChange={(v) => updateScopeDraft(idx, { classId: Number(v) })}
                        >
                          <SelectTrigger
                            className={cn(
                              "h-8 w-full rounded-[7px] border-[1.5px] border-[#D0CCC3] bg-white text-[12px] font-medium",
                              !scope.isEnabled && "opacity-50",
                            )}
                          >
                            <SelectValue placeholder="Level" />
                          </SelectTrigger>
                          <SelectContent>
                            {classOptions.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-2.5 py-2.5">
                        <input
                          type="datetime-local"
                          className={cn(
                            "h-8 w-full rounded-[6px] border-[1.5px] border-[#D0CCC3] bg-white px-2 text-[11px] font-medium text-[#1B2B4B] outline-none",
                            !scope.isEnabled &&
                              "cursor-not-allowed bg-[#F7F6F3] text-[#9AA0AE] opacity-50",
                          )}
                          value={scope.startDate}
                          onChange={(e) => updateScopeDraft(idx, { startDate: e.target.value })}
                          disabled={!scope.isEnabled}
                        />
                      </td>
                      <td className="px-2.5 py-2.5">
                        <input
                          type="datetime-local"
                          className={cn(
                            "h-8 w-full rounded-[6px] border-[1.5px] border-[#D0CCC3] bg-white px-2 text-[11px] font-medium text-[#1B2B4B] outline-none",
                            !scope.isEnabled &&
                              "cursor-not-allowed bg-[#F7F6F3] text-[#9AA0AE] opacity-50",
                          )}
                          value={scope.endDate}
                          onChange={(e) => updateScopeDraft(idx, { endDate: e.target.value })}
                          disabled={!scope.isEnabled}
                        />
                      </td>
                      <td className="px-2.5 py-2.5 text-center">
                        <Badge
                          variant="outline"
                          className={cn("whitespace-nowrap text-[9px] font-bold", st.cls)}
                        >
                          {st.label}
                        </Badge>
                      </td>
                      <td className="px-1 py-2.5 text-center">
                        {!scope.id ? (
                          <button
                            type="button"
                            onClick={() => removeScopeDraft(idx)}
                            className="flex h-6 w-6 items-center justify-center rounded-[5px] border-[1.5px] border-[#F5BFBF] bg-[#FEF0F0] text-sm text-[#C23B3B] transition-colors hover:bg-[#FDDDDD]"
                          >
                            &times;
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between rounded-b-[14px] border-t border-[#E0DDD6] bg-[#F7F6F3] px-6 py-3">
        <div className="text-[11px] text-[#9AA0AE]">
          {draftScopes.length} row{draftScopes.length !== 1 ? "s" : ""} &middot; {enabledCount}{" "}
          enabled
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-[8px] border-[1.5px] border-[#D0CCC3] px-4 text-[13px] font-semibold text-[#5A6478]"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-[8px] bg-[#1B2B4B] px-5 font-['Sora',sans-serif] text-[13px] font-bold hover:bg-[#2C3E63]"
            onClick={handleDone}
            disabled={saving}
          >
            {saving ? "Saving..." : "Done \u2192"}
          </Button>
        </div>
      </div>
    </>
  );
}

/* ─── Proxy Activity Grid ─── */
function ProxyActivityGrid({
  activities,
  classOptions,
  student,
}: {
  activities: AcademicActivityApiDto[];
  classOptions: ClassOption[];
  student: ProxyStudent;
}) {
  const visible = activities.filter((a) => a.master.isActive);
  if (visible.length === 0) {
    return (
      <div className="py-6 text-center text-[13px] text-[#9AA0AE]">
        No activities are currently enabled.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
      {visible.map((act) => {
        const st = activityStatus(act);
        const hasMatchingScope = act.scopes.some((s) => {
          if (!s.isEnabled) return false;
          const cls = classOptions.find((c) => c.id === (s.classId ?? s.class?.id));
          if (!cls) return false;
          return (cls.sequence ?? null) === student.sem;
        });
        const blocked = !hasMatchingScope;
        return (
          <div
            key={act.id}
            className={cn(
              "flex flex-col gap-2 rounded-[11px] border bg-white p-3.5 shadow-sm transition-all",
              blocked
                ? "border-[#E0DDD6] opacity-45"
                : "border-[#E0DDD6] hover:-translate-y-px hover:shadow-md",
            )}
          >
            <div className="flex gap-2">
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base",
                  blocked ? "border-[#E0DDD6] bg-[#EFEDE8]" : "border-[#E0DDD6] bg-[#F7F6F3]",
                )}
              >
                {typeIcon(act.master.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={cn(
                    "font-['Sora',sans-serif] text-[12.5px] font-bold leading-tight",
                    blocked ? "text-[#9AA0AE]" : "text-[#1B2B4B]",
                  )}
                >
                  {act.master.name}
                </div>
                <p className="mt-0.5 text-[10.5px] text-[#9AA0AE]">
                  {act.master.description || act.master.type}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#E0DDD6] pt-2">
              <span
                className={cn(
                  "text-[11.5px] font-semibold",
                  blocked ? "text-[#9AA0AE]" : st.live ? "text-[#1A7A4A]" : "text-[#5A6478]",
                )}
              >
                {blocked ? `Not available for Sem ${SL[student.sem - 1]}` : st.label}
              </span>
              {!blocked ? (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold",
                    st.bg,
                    st.color,
                    st.bd,
                  )}
                >
                  {st.live ? (
                    <span className="h-1 w-1 shrink-0 animate-pulse rounded-full bg-[#1A7A4A]" />
                  ) : null}
                  {st.label}
                </span>
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
