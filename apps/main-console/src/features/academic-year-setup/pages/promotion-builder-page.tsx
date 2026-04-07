import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { getPromotionBuilders } from "@/services/promotion-logic.api";
import { getAffiliations } from "@/services/course-design.api";
import type { PromotionBuilderDto } from "@repo/db";
import type { Affiliation, ClassT } from "@repo/db/schemas";
import {
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Circle,
  CircleSlash,
  Clock,
  Download,
  Info,
  Plus,
  RotateCcw,
  Star,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Visual theme — aligned to provided mockups (cream page, navy type, pastel tiles).
 * Data is loaded from GET /api/v1/batches/promotion-builders (see loadBuilders).
 */
const theme = {
  pageBg: "#FDFBF7",
  panelBg: "#F9FAFB",
  navy: "#1A2B48",
  navyBtn: "#1E293B",
  muted: "#64748B",
  orange: "#F59E0B",
  green: "#10B981",
  purple: "#7C3AED",
  pink: "#FDA4AF",
  avatarOddBg: "#FFE8DC",
  avatarOddFg: "#C2410C",
  avatarEvenBg: "#DCFCE7",
  avatarEvenFg: "#047857",
} as const;

const ROMAN_BY_INDEX = [
  "",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];

const WORD_ROMAN_TO_SEM: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
};

const DEFAULT_ERP_BADGE = "CALCUTTA UNIVERSITY • ERP ADMIN";

function semesterIndexFromName(name: string | undefined | null): number | null {
  if (!name) return null;
  const s = name.trim();

  const digit = /semester\s*(\d+)/i.exec(s);
  if (digit?.[1]) {
    const n = parseInt(digit[1], 10);
    return Number.isFinite(n) ? n : null;
  }

  const word = /semester\s+([ivxlcdm]+)/i.exec(s);
  if (word?.[1]) {
    const n = WORD_ROMAN_TO_SEM[word[1].toUpperCase()];
    return n ?? null;
  }

  return null;
}

function toRomanNumeral(n: number): string {
  return ROMAN_BY_INDEX[n] ?? String(n);
}

/** Card title: "Semester 2" */
function displaySemesterTitle(name: string | undefined | null): string {
  const n = semesterIndexFromName(name);
  if (n != null) return `Semester ${n}`;
  return name?.trim() || "—";
}

/** Chips: "Sem I" */
function semShortLabel(className: string | undefined | null): string {
  const n = semesterIndexFromName(className);
  if (n != null) return `Sem ${toRomanNumeral(n)}`;
  return className?.trim() || "—";
}

function formFilledValueLabel(className: string | undefined | null): string {
  return `${semShortLabel(className)} — Form Filled`;
}

function sortBuilders(rows: PromotionBuilderDto[]): PromotionBuilderDto[] {
  return [...rows].sort((a, b) => {
    const sa = a.targetClass?.sequence ?? semesterIndexFromName(a.targetClass?.name) ?? 9999;
    const sb = b.targetClass?.sequence ?? semesterIndexFromName(b.targetClass?.name) ?? 9999;
    return sa - sb;
  });
}

function inferTrack(tc: ClassT | undefined): "ODD" | "EVEN" | null {
  if (!tc) return null;
  if (tc.track === "ODD" || tc.track === "EVEN") return tc.track;
  const n = semesterIndexFromName(tc.name);
  if (n == null) return null;
  return n % 2 === 1 ? "ODD" : "EVEN";
}

function operatorLabel(op: string): string {
  if (op === "NONE_IN") return "none in";
  if (op === "EQUALS") return "equals";
  return op.toLowerCase();
}

function isFailedPapersClause(name: string | undefined | null): boolean {
  return (name ?? "").toLowerCase().includes("failed");
}

type AffiliationFilter = "all" | number;

const navyPrimaryBtn = "bg-[#1E293B] hover:bg-[#0f172a] text-white shadow-sm border-0";

export default function PromotionBuilderPage() {
  const [builders, setBuilders] = React.useState<PromotionBuilderDto[]>([]);
  const [affiliations, setAffiliations] = React.useState<Affiliation[]>([]);
  const [affiliationFilter, setAffiliationFilter] = React.useState<AffiliationFilter>("all");
  const [loading, setLoading] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);

  const loadAffiliations = React.useCallback(async () => {
    try {
      const data = await getAffiliations();
      setAffiliations(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load affiliations");
    }
  }, []);

  /** Loads `PromotionBuilderDto[]` from backend (affiliation filter optional). */
  const loadBuilders = React.useCallback(async (filter: AffiliationFilter) => {
    setLoading(true);
    try {
      const id = filter === "all" ? undefined : filter;
      const data = await getPromotionBuilders(id);
      setBuilders(Array.isArray(data) ? data : []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load promotion builders";
      toast.error(msg);
      setBuilders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadAffiliations();
  }, [loadAffiliations]);

  React.useEffect(() => {
    void loadBuilders(affiliationFilter);
  }, [affiliationFilter, loadBuilders]);

  const sorted = React.useMemo(() => sortBuilders(builders), [builders]);

  const viewingLabel =
    affiliationFilter === "all"
      ? "All Affiliations"
      : (affiliations.find((a) => a.id === affiliationFilter)?.name ?? "—");

  const erpBadgeLabel =
    affiliationFilter === "all" ? DEFAULT_ERP_BADGE : `${viewingLabel.toUpperCase()} • ERP ADMIN`;

  const handleReset = () => {
    setExpandedId(null);
    toast.message("Filters reset");
    if (affiliationFilter === "all") {
      void loadBuilders("all");
    } else {
      setAffiliationFilter("all");
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(sorted, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `promotion-builders-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported");
  };

  return (
    <div className="min-h-full font-sans antialiased" style={{ backgroundColor: theme.pageBg }}>
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide"
              style={{
                borderColor: `${theme.orange}44`,
                backgroundColor: "#FFF7ED",
                color: "#9A3412",
              }}
            >
              <Clock className="h-3.5 w-3.5 opacity-80" strokeWidth={2.5} />
              {erpBadgeLabel}
            </div>
            <div>
              <h1
                className="text-2xl sm:text-[1.65rem] font-bold tracking-tight"
                style={{ color: theme.navy }}
              >
                Student Promotion Logic Builder
              </h1>
              <p
                className="text-sm mt-1.5 max-w-2xl leading-relaxed"
                style={{ color: theme.muted }}
              >
                Configure semester-wise promotion rules based on{" "}
                <span className="font-semibold text-gray-800">Form Fill-up Status</span>.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-2 border-gray-300 bg-white text-gray-800 shadow-sm"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              disabled={!sorted.length}
              className="gap-2 border-gray-300 bg-white text-gray-800 shadow-sm"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </div>

        <Card className="border border-gray-200/90 shadow-[0_4px_24px_rgba(15,23,42,0.06)] overflow-hidden rounded-2xl bg-white">
          <CardContent className="p-0">
            <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-gray-100">
              <div className="flex flex-col lg:flex-row lg:items-end gap-5 lg:justify-between lg:gap-8">
                <div className="space-y-2 flex-1 min-w-0 max-w-xl">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Star
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: theme.orange, fill: `${theme.orange}33` }}
                    />
                    Affiliated College
                  </Label>
                  <Select
                    value={affiliationFilter === "all" ? "all" : String(affiliationFilter)}
                    onValueChange={(v) => {
                      setAffiliationFilter(v === "all" ? "all" : Number(v));
                      setExpandedId(null);
                    }}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl border-gray-200 bg-white">
                      <SelectValue placeholder="Select affiliation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Affiliations</SelectItem>
                      {affiliations.map((a) =>
                        a.id != null ? (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.name}
                          </SelectItem>
                        ) : null,
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
                  <span className="text-gray-400">Viewing:</span>
                  <span className="font-medium text-gray-900">{viewingLabel}</span>
                </div>
              </div>
            </div>

            <div
              className="px-5 sm:px-8 pt-4 pb-6 sm:pb-8"
              style={{ backgroundColor: theme.panelBg }}
            >
              <Tabs defaultValue="rules" className="w-full">
                <TabsList className="flex w-full max-w-md h-auto p-0 bg-transparent border-b border-gray-200/90 rounded-none gap-10">
                  <TabsTrigger
                    value="rules"
                    className="rounded-none px-0 pb-2.5 pt-0 text-sm font-semibold text-gray-500 shadow-none border-0 border-b-[3px] border-transparent bg-transparent data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=inactive]:text-gray-500 data-[state=active]:border-b-[#1A2B48] data-[state=active]:text-[#1A2B48]"
                  >
                    Promotion Rules
                  </TabsTrigger>
                  <TabsTrigger
                    value="json"
                    className="rounded-none px-0 pb-2.5 pt-0 text-sm font-semibold text-gray-500 shadow-none border-0 border-b-[3px] border-transparent bg-transparent data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=inactive]:text-gray-500 data-[state=active]:border-b-[#1A2B48] data-[state=active]:text-[#1A2B48]"
                  >
                    JSON Output
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="rules" className="mt-5 outline-none space-y-4">
                  {loading ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
                      <p className="text-sm text-gray-500">Loading promotion rules…</p>
                    </div>
                  ) : sorted.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center px-4">
                      <p className="text-sm font-medium text-gray-700">
                        No promotion builders for this filter.
                      </p>
                      <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto">
                        Try another affiliation or confirm builders are seeded in the backend.
                      </p>
                    </div>
                  ) : (
                    sorted.map((b) => (
                      <BuilderRuleCard
                        key={b.id ?? JSON.stringify(b.targetClass)}
                        builder={b}
                        open={expandedId === b.id}
                        onOpenChange={(o) => setExpandedId(o && b.id != null ? b.id : null)}
                      />
                    ))
                  )}

                  <div
                    className="rounded-xl border px-4 py-3 flex gap-3 text-sm mt-5"
                    style={{
                      borderColor: "#E9D5FF",
                      backgroundColor: "#FAF5FF",
                      color: theme.navy,
                    }}
                  >
                    <Info className="h-5 w-5 shrink-0 mt-0.5" style={{ color: theme.purple }} />
                    <p className="leading-relaxed opacity-90">
                      Rules are based on CU Form Fill-up Status = &quot;Form Filled&quot;. Semester
                      I → II is always auto-promoted. All other rules are fully configurable per
                      affiliation.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="json" className="mt-5 outline-none">
                  <pre className="text-xs bg-slate-950 text-slate-50 rounded-xl p-4 overflow-auto max-h-[min(70vh,560px)] font-mono border border-slate-800">
                    {loading ? "…" : JSON.stringify(sorted, null, 2)}
                  </pre>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BuilderRuleCard({
  builder,
  open,
  onOpenChange,
}: {
  builder: PromotionBuilderDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const tc = builder.targetClass as ClassT | undefined;
  const semIdx = semesterIndexFromName(tc?.name);
  const romanInBadge = semIdx != null ? toRomanNumeral(semIdx) : "?";
  const track = inferTrack(tc);
  const isAuto = builder.logic === "AUTO_PROMOTE";
  const title = displaySemesterTitle(tc?.name);

  const summaryBadges = React.useMemo(() => {
    const chips: {
      key: string;
      label: string;
      variant: "odd" | "even" | "fail";
      isNoFails: boolean;
    }[] = [];
    const seen = new Set<string>();
    for (const rule of builder.rules ?? []) {
      const op = rule.operator ?? "EQUALS";
      const failClause = isFailedPapersClause(rule.promotionClause?.name);
      for (const row of rule.classes ?? []) {
        const cls = row.class as ClassT | undefined;
        const idKey = cls?.id != null ? `id:${cls.id}` : `row:${row.id}`;
        if (seen.has(idKey)) continue;
        seen.add(idKey);
        chips.push({
          key: idKey,
          label: semShortLabel(cls?.name),
          variant:
            op === "NONE_IN" || failClause ? "fail" : inferTrack(cls) === "ODD" ? "odd" : "even",
          isNoFails: failClause,
        });
      }
    }
    return chips;
  }, [builder.rules]);

  /** Even = teal/mint tile, Odd = peach/orange — matches reference rows */
  const avatarStyle =
    track === "ODD"
      ? {
          backgroundColor: "#FFEDD5",
          color: "#C2410C",
          borderColor: "rgba(251, 146, 60, 0.45)",
        }
      : track === "EVEN"
        ? {
            backgroundColor: "#CCFBF1",
            color: "#0F766E",
            borderColor: "rgba(45, 212, 191, 0.45)",
          }
        : {
            backgroundColor: "#E5E7EB",
            color: "#4B5563",
            borderColor: "#D1D5DB",
          };

  const openAccent =
    track === "ODD"
      ? "border-[#FDBA74]/50 border-l-[6px] border-l-[#F59E0B] shadow-[inset_6px_0_0_0_rgba(245,158,11,0.12)]"
      : track === "EVEN"
        ? "border-[#6EE7B7]/50 border-l-[6px] border-l-[#10B981] shadow-[inset_6px_0_0_0_rgba(16,185,129,0.1)]"
        : "border-violet-200 border-l-[6px] border-l-[#7C3AED]/80";

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div
        className={cn(
          "rounded-2xl border bg-white shadow-[0_2px_12px_rgba(15,23,42,0.06)] transition-all",
          open ? openAccent : "border-gray-200 hover:border-gray-300",
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              "w-full text-left px-3 py-3 min-[420px]:px-4 min-[420px]:py-3.5",
              // Use min-[420px] (not sm:640px) so the 3-column row shows with sidebar open
              "grid grid-cols-1 gap-3 min-[420px]:grid-cols-[auto_minmax(0,1fr)_auto] min-[420px]:items-center min-[420px]:gap-4 min-[420px]:min-h-[4.25rem]",
            )}
          >
            <div className="flex items-center gap-3 min-[420px]:gap-4 min-w-0">
              <div
                className="flex h-11 w-11 min-[420px]:h-12 min-[420px]:w-12 shrink-0 items-center justify-center rounded-lg text-sm font-bold border"
                style={avatarStyle}
                aria-hidden
              >
                {romanInBadge}
              </div>
              <div className="min-w-0 flex-1 min-[420px]:w-44 min-[420px]:flex-initial min-[420px]:shrink-0">
                <div
                  className="text-sm font-bold leading-tight truncate"
                  style={{ color: theme.navy }}
                >
                  {title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {track === "ODD" ? "Odd track" : track === "EVEN" ? "Even track" : "—"}
                </div>
              </div>
            </div>

            {open ? (
              <div className="hidden min-[420px]:block min-w-0" aria-hidden />
            ) : (
              <div className="min-w-0 flex flex-col min-[420px]:flex-row min-[420px]:flex-wrap items-center justify-center gap-1.5 py-1 min-[420px]:py-0 border-t border-gray-100 min-[420px]:border-t-0 min-[420px]:px-2">
                {isAuto ? (
                  <p className="text-xs text-gray-500 italic w-full text-center min-[420px]:text-center">
                    No conditions - auto promoted
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 w-full min-[420px]:w-auto">
                      {summaryBadges
                        .filter((c) => !c.isNoFails)
                        .map((c) => (
                          <span
                            key={c.key}
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                              c.variant === "odd" &&
                                "border-amber-200 bg-amber-50/90 text-amber-900",
                              c.variant === "even" && "border-teal-200 bg-teal-50/90 text-teal-900",
                              c.variant === "fail" && "border-rose-200 bg-rose-50 text-rose-900",
                            )}
                          >
                            <span className="text-[10px] opacity-70 mr-0.5">•</span>
                            {c.label}
                          </span>
                        ))}
                    </div>
                    {summaryBadges.some((c) => c.isNoFails) && (
                      <div className="flex flex-wrap items-center justify-center gap-1.5 w-full min-[420px]:w-auto">
                        <span className="text-[11px] font-semibold text-rose-600">No Fails</span>
                        {summaryBadges
                          .filter((c) => c.isNoFails)
                          .map((c) => (
                            <span
                              key={c.key}
                              className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-900"
                            >
                              {c.label}
                            </span>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex items-center justify-between min-[420px]:justify-end gap-2 min-[420px]:gap-3 shrink-0 w-full min-[420px]:w-auto pt-1 border-t border-gray-100 min-[420px]:border-t-0 min-[420px]:pt-0">
              {isAuto ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  Auto
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold text-violet-800">
                  <Circle className="h-3.5 w-3.5 text-violet-600 fill-violet-200/50 shrink-0" />
                  Conditional
                </span>
              )}
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-gray-400 transition-transform shrink-0",
                  open && "rotate-180",
                )}
              />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t border-gray-100 bg-white px-4 sm:px-5 pb-5 pt-4 space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                Logic
              </p>
              <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                <span
                  className={cn(
                    "px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors",
                    isAuto
                      ? "bg-[#10B981] text-white shadow-sm"
                      : "border-2 border-emerald-500/70 bg-white text-emerald-800",
                  )}
                >
                  <Zap className="h-4 w-4" />
                  Auto-Promote
                </span>
                <span
                  className={cn(
                    "px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors",
                    !isAuto
                      ? "bg-[#7C3AED] text-white shadow-sm"
                      : "border-2 border-violet-500 bg-white text-violet-800",
                  )}
                >
                  <Circle className="h-4 w-4 fill-current opacity-30" />
                  Conditional
                </span>
              </div>
            </div>

            {isAuto ? (
              <div className="rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-3.5 text-sm text-emerald-950 flex gap-3">
                <Zap className="h-5 w-5 shrink-0 text-[#10B981] mt-0.5" />
                <div>
                  <span className="font-bold">Auto-Promotion Active</span>
                  <span className="text-emerald-900/90">
                    {" "}
                    — No conditions required — student always advances to{" "}
                    <span className="font-bold">{title}</span>.
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                  <div className="grid grid-cols-[52px_1fr_88px_1fr_40px] gap-0 border-b border-gray-200 bg-gray-50">
                    <div className="px-2 py-2.5 sm:px-3" />
                    <div className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 sm:pl-0">
                      COLUMN NAME
                    </div>
                    <div className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-l border-gray-200">
                      OPERATOR
                    </div>
                    <div className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-l border-gray-200">
                      VALUE
                    </div>
                    <div className="px-1 py-2.5 border-l border-gray-200" />
                  </div>
                  {(builder.rules ?? []).map((rule, idx) => {
                    const failClause = isFailedPapersClause(rule.promotionClause?.name);
                    return (
                      <div
                        key={rule.id ?? idx}
                        className="grid grid-cols-1 sm:grid-cols-[52px_1fr_88px_1fr_40px] border-b border-gray-100 last:border-b-0"
                      >
                        <div className="hidden sm:flex items-start justify-center px-2 pt-3.5 text-xs font-semibold text-gray-400">
                          {idx === 0 ? "If" : "And"}
                        </div>
                        <div className="flex gap-2 px-3 py-3 sm:pl-0 min-w-0 border-b border-gray-100 sm:border-b-0">
                          <span className="sm:hidden text-xs font-semibold text-gray-400 w-8 shrink-0 pt-1">
                            {idx === 0 ? "If" : "And"}
                          </span>
                          <div
                            className={cn(
                              "flex min-w-0 flex-1 items-start gap-2 rounded-lg px-3 py-2 shadow-sm",
                              failClause
                                ? "border border-rose-200 bg-rose-50/60"
                                : "border border-emerald-200 bg-white",
                            )}
                          >
                            {failClause ? (
                              <X
                                className="h-4 w-4 shrink-0 mt-0.5 text-rose-600"
                                strokeWidth={2.5}
                              />
                            ) : (
                              <CheckSquare
                                className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600"
                                strokeWidth={2.5}
                              />
                            )}
                            <span
                              className="text-sm font-semibold leading-snug break-words"
                              style={{ color: theme.navy }}
                            >
                              {rule.promotionClause?.name ?? "—"}
                            </span>
                          </div>
                        </div>
                        <div className="px-3 py-2.5 sm:py-3 border-t sm:border-t-0 sm:border-l border-gray-200 flex items-center">
                          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                            {operatorLabel(rule.operator ?? "EQUALS")}
                          </div>
                        </div>
                        <div className="px-3 py-2.5 sm:py-3 border-t sm:border-t-0 sm:border-l border-gray-200 flex flex-wrap gap-1.5 items-center sm:min-h-[3rem]">
                          <div className="w-full rounded-lg border border-gray-200 bg-[#FAFAF9] p-2 shadow-inner flex flex-wrap gap-1.5 items-center min-h-[2.75rem]">
                            {failClause && (
                              <span className="text-[11px] font-bold mr-1 text-[#BE123C]">
                                No Fails
                              </span>
                            )}
                            {(rule.classes ?? []).length === 0 ? (
                              <span className="text-sm text-gray-400">—</span>
                            ) : (
                              (rule.classes ?? []).map((row) => {
                                const cls = row.class as ClassT | undefined;
                                const op = rule.operator ?? "EQUALS";
                                const tr = inferTrack(cls);
                                return (
                                  <span
                                    key={row.id ?? `${rule.id}-${cls?.id}`}
                                    className={cn(
                                      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                                      op === "NONE_IN" || failClause
                                        ? "border-[#FDA4AF] bg-[#FFF1F2] text-[#9F1239]"
                                        : tr === "ODD"
                                          ? "border-[#F59E0B]/55 bg-[#FFFBEB] text-[#92400E]"
                                          : "border-[#10B981]/45 bg-[#ECFDF5] text-[#065F46]",
                                    )}
                                  >
                                    {op === "EQUALS"
                                      ? formFilledValueLabel(cls?.name)
                                      : semShortLabel(cls?.name)}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>
                        <div className="hidden sm:flex items-center justify-center border-t sm:border-t-0 sm:border-l border-gray-200 py-2">
                          <button
                            type="button"
                            className="rounded-md p-1.5 text-gray-300 hover:text-gray-500 cursor-not-allowed"
                            disabled
                            aria-label="Remove clause"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed border-gray-300 text-gray-500 hover:text-gray-700 bg-gray-50/50"
                  disabled
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Clause
                </Button>

                <div className="rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] px-4 py-2.5 text-sm text-emerald-950 flex items-start gap-2">
                  <CheckCircle2
                    className="h-5 w-5 shrink-0 mt-0.5"
                    style={{ color: theme.green }}
                  />
                  <div>
                    <span className="font-bold">Then</span>
                    <span className="text-emerald-800/90"> — </span>
                    Promote to <span className="font-bold">{title}</span>
                  </div>
                </div>
                <div className="rounded-lg bg-gray-100 border border-gray-200 px-4 py-2.5 text-sm text-gray-700 flex items-start gap-2">
                  <CircleSlash className="h-5 w-5 shrink-0 text-gray-400 mt-0.5" />
                  <div>
                    <span className="font-bold">Else</span>
                    <span className="text-gray-500"> — </span>
                    Hold — Do not promote
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm">
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className={cn("gap-1 rounded-lg font-semibold", navyPrimaryBtn)}
                    disabled
                  >
                    Save Rule
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
