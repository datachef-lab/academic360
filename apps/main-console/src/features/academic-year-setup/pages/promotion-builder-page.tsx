import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { getPromotionBuilders } from "@/services/promotion-logic.api";
import { getAffiliations } from "@/services/course-design.api";
import type { PromotionBuilderDto } from "@repo/db";
import type { Affiliation, ClassT } from "@repo/db/schemas";
import {
  ArrowRight,
  Check,
  CheckSquare,
  ChevronDown,
  CircleSlash,
  Clock,
  Info,
  Plus,
  Star,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Promotion rules UI. All builder rows come from the backend DB via
 * GET /api/v1/batches/promotion-builders (see `loadBuilders` / `getPromotionBuilders`).
 * Affiliations from `getAffiliations()`.
 */
const ui = {
  bg: "#F0EEE9",
  card: "#FFFFFF",
  card2: "#F7F6F3",
  card3: "#F2F0EB",
  navy: "#1B2B4B",
  navy2: "#2C3E63",
  border: "#E0DDD6",
  border2: "#D0CCC3",
  text: "#1B2B4B",
  text2: "#5A6478",
  text3: "#9AA0AE",
  amber: "#C8820A",
  amberBg: "#FEF6E8",
  amberMid: "#F5C164",
  amberBorder: "#F0C97A",
  teal: "#0A7F6A",
  tealBg: "#E6F5F2",
  tealMid: "#5ABFAD",
  tealBorder: "#85CFC0",
  green: "#1A7A4A",
  greenBg: "#E8F5EE",
  greenBorder: "#A0D8B8",
  violet: "#5B3FC4",
  violetBg: "#EEE9FC",
  violetBorder: "#C4B4F4",
  rose: "#A63060",
  roseBg: "#FCF0F4",
  roseBorder: "#EDB8CC",
  red: "#C23B3B",
  sky: "#1A6BB5",
  skyBg: "#EBF3FC",
  skyBorder: "#9EC8F0",
  sh: "0 1px 3px rgba(27,43,75,.06),0 4px 14px rgba(27,43,75,.04)",
} as const;

const FONT_LINK =
  "https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600&display=swap";

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

const DEFAULT_ERP_BADGE = "Calcutta University · ERP Admin";

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

function displaySemesterTitle(name: string | undefined | null): string {
  const n = semesterIndexFromName(name);
  if (n != null) return `Semester ${n}`;
  return name?.trim() || "—";
}

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

function trackPalette(sem: number | null): {
  c: string;
  bg: string;
  bd: string;
  mid: string;
} {
  if (sem == null || sem < 1) {
    return { c: ui.text3, bg: ui.card2, bd: ui.border2, mid: ui.border2 };
  }
  return sem % 2 !== 0
    ? { c: ui.amber, bg: ui.amberBg, bd: ui.amberBorder, mid: ui.amberMid }
    : { c: ui.teal, bg: ui.tealBg, bd: ui.tealBorder, mid: ui.tealMid };
}

function SemesterBox({
  sem,
  size = 36,
  className,
}: {
  sem: number | null;
  size?: number;
  className?: string;
}) {
  if (sem == null || sem < 1) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg border-[1.5px] text-sm font-bold",
          className,
        )}
        style={{
          width: size,
          height: size,
          fontFamily: "'Sora', sans-serif",
          background: ui.card2,
          borderColor: ui.border2,
          color: ui.text3,
        }}
        aria-hidden
      >
        ?
      </div>
    );
  }
  const { c, bg, bd } = trackPalette(sem);
  const label = ROMAN_BY_INDEX[sem] ?? "?";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border-[1.5px] font-bold",
        className,
      )}
      style={{
        width: size,
        height: size,
        fontFamily: "'Sora', sans-serif",
        fontSize: Math.round(size * 0.34),
        background: bg,
        borderColor: bd,
        color: c,
      }}
      aria-hidden
    >
      {label}
    </div>
  );
}

export default function PromotionBuilderPage() {
  const [builders, setBuilders] = React.useState<PromotionBuilderDto[]>([]);
  const [affiliations, setAffiliations] = React.useState<Affiliation[]>([]);
  const [affiliationFilter, setAffiliationFilter] = React.useState<AffiliationFilter>("all");
  const [loading, setLoading] = React.useState(true);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);

  React.useEffect(() => {
    const id = "promotion-builder-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = FONT_LINK;
    document.head.appendChild(link);
  }, []);

  const loadAffiliations = React.useCallback(async () => {
    try {
      const data = await getAffiliations();
      setAffiliations(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load affiliations");
    }
  }, []);

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

  return (
    <div
      className="min-h-full antialiased px-5 py-[26px] sm:px-6"
      style={{
        background: ui.bg,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        color: ui.text,
      }}
    >
      <div className="mx-auto w-full max-w-[900px] space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3.5">
          <div className="min-w-0">
            <div
              className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1"
              style={{
                background: ui.amberBg,
                borderColor: ui.amberBorder,
              }}
            >
              <Clock className="h-2.5 w-2.5 shrink-0" strokeWidth={1} style={{ color: ui.amber }} />
              <span
                className="text-[10.5px] font-bold uppercase tracking-[0.07em]"
                style={{ color: ui.amber, fontFamily: "'Sora', sans-serif" }}
              >
                {erpBadgeLabel}
              </span>
            </div>
            <h1
              className="text-[22px] font-extrabold leading-tight tracking-[-0.03em]"
              style={{ color: ui.navy, fontFamily: "'Sora', sans-serif" }}
            >
              Student Promotion Logic Builder
            </h1>
            <p
              className="mt-1.5 max-w-[500px] text-[13px] leading-[1.55]"
              style={{ color: ui.text2 }}
            >
              Configure semester-wise promotion rules based on{" "}
              <strong style={{ color: ui.navy2, fontWeight: 600 }}>Form Fill-up Status</strong>.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border-[1.5px] px-4 py-2 text-[12.5px] font-semibold shadow-sm transition-colors hover:opacity-90"
              style={{
                borderColor: ui.border2,
                background: ui.card,
                color: ui.text2,
                boxShadow: ui.sh,
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Affiliation bar */}
        <div
          className="flex flex-wrap items-center gap-3 rounded-[10px] border-[1.5px] px-4 py-2.5"
          style={{
            borderColor: ui.border2,
            background: ui.card,
            boxShadow: ui.sh,
          }}
        >
          <div className="flex shrink-0 items-center gap-1.5">
            <Star
              className="h-3.5 w-3.5 shrink-0"
              strokeWidth={1.1}
              style={{ color: ui.amber, fill: ui.amberBg }}
            />
            <span
              className="text-[11.5px] font-bold"
              style={{ color: ui.text2, fontFamily: "'Sora', sans-serif" }}
            >
              Affiliated College
            </span>
          </div>
          <div className="relative min-w-[170px] max-w-[300px] flex-1">
            <Select
              value={affiliationFilter === "all" ? "all" : String(affiliationFilter)}
              onValueChange={(v) => {
                setAffiliationFilter(v === "all" ? "all" : Number(v));
                setExpandedId(null);
              }}
            >
              <SelectTrigger
                className="h-9 w-full rounded-lg border-[1.5px] pr-9 text-[12.5px] font-semibold shadow-none"
                style={{ borderColor: ui.border2, background: ui.card2, color: ui.navy }}
              >
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
          {affiliationFilter !== "all" && (
            <div
              className="flex items-center gap-1.5 rounded-md border px-2.5 py-1"
              style={{ background: ui.amberBg, borderColor: ui.amberBorder }}
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: ui.amber }}
              />
              <span
                className="text-[11.5px] font-semibold"
                style={{ color: ui.amber, fontFamily: "'Sora', sans-serif" }}
              >
                {viewingLabel}
              </span>
              <button
                type="button"
                className="ml-0.5 p-0 text-[12px] opacity-70 hover:opacity-100"
                style={{ color: ui.amber, background: "none", border: "none" }}
                onClick={() => setAffiliationFilter("all")}
                aria-label="Clear affiliation filter"
              >
                ✕
              </button>
            </div>
          )}
          <div
            className="ml-auto rounded-md border px-3 py-1.5"
            style={{ background: ui.card2, borderColor: ui.border }}
          >
            <span className="text-[11px]" style={{ color: ui.text3 }}>
              Viewing:{" "}
            </span>
            <span
              className="text-[11px] font-bold"
              style={{ color: ui.navy, fontFamily: "'Sora', sans-serif" }}
            >
              {viewingLabel}
            </span>
          </div>
        </div>

        {/* Rules from API */}
        <div
          className="overflow-hidden rounded-xl border-[1.5px]"
          style={{ borderColor: ui.border2, boxShadow: ui.sh }}
        >
          <div style={{ background: ui.card }}>
            {loading ? (
              <div
                className="border-b px-6 py-16 text-center text-sm"
                style={{ borderColor: ui.border, color: ui.text3 }}
              >
                Loading promotion rules…
              </div>
            ) : sorted.length === 0 ? (
              <div className="border-b px-6 py-14 text-center" style={{ borderColor: ui.border }}>
                <p className="text-sm font-medium" style={{ color: ui.text }}>
                  No promotion builders for this filter.
                </p>
                <p className="mx-auto mt-2 max-w-sm text-xs" style={{ color: ui.text3 }}>
                  Try another affiliation or confirm promotion builders exist in the database.
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
          </div>
        </div>

        {/* Footnote */}
        <div
          className="flex items-start gap-2.5 rounded-lg border-[1.5px] px-4 py-3"
          style={{ borderColor: ui.border, background: ui.card, boxShadow: ui.sh }}
        >
          <Info
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            strokeWidth={1.1}
            style={{ color: "#3D7FBF" }}
          />
          <p className="m-0 text-[11.5px] leading-[1.65]" style={{ color: ui.text2 }}>
            Rules are based on{" "}
            <strong style={{ color: ui.navy, fontWeight: 600 }}>
              CU Form Fill-up Status = &quot;Form Filled&quot;
            </strong>
            . Semester I → II is always auto-promoted. All other rules are fully configurable per
            affiliation.
          </p>
        </div>
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
  const track = inferTrack(tc);
  const isAuto = builder.logic === "AUTO_PROMOTE";
  const title = displaySemesterTitle(tc?.name);
  const pal = trackPalette(semIdx);

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

  const notConfigured = !isAuto && summaryBadges.length === 0;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div
        className="border-b transition-colors last:border-b-0"
        style={{ borderColor: ui.border }}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="grid w-full cursor-pointer select-none items-center gap-3 border-0 bg-transparent px-[18px] py-3 text-left transition-colors hover:bg-[#F7F6F3] sm:grid-cols-[190px_minmax(0,1fr)_auto_40px]"
            style={{
              background: open ? `${pal.bg}22` : ui.card,
              boxShadow: open ? `inset 3px 0 0 ${pal.c}` : undefined,
            }}
          >
            <div className="flex items-center gap-2.5">
              <SemesterBox sem={semIdx} size={36} />
              <div>
                <div
                  className="text-[13px] font-bold leading-tight tracking-[-0.01em]"
                  style={{ color: ui.text, fontFamily: "'Sora', sans-serif" }}
                >
                  {title}
                </div>
                <div className="mt-px text-[10.5px]" style={{ color: ui.text3 }}>
                  {track === "ODD" ? "Odd track" : track === "EVEN" ? "Even track" : "—"}
                </div>
              </div>
            </div>

            <div className="min-w-0">
              {isAuto ? (
                <span className="text-[11.5px] italic" style={{ color: ui.text3 }}>
                  No conditions — auto-promoted
                </span>
              ) : notConfigured ? (
                <span
                  className="inline-flex items-center gap-1 text-[12px]"
                  style={{ color: ui.red }}
                >
                  ⚠ Not configured
                </span>
              ) : (
                <div className="flex flex-wrap items-center gap-1.5">
                  <div className="flex flex-wrap gap-1">
                    {summaryBadges
                      .filter((c) => !c.isNoFails)
                      .map((c) => (
                        <span
                          key={c.key}
                          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                          style={{
                            fontFamily: "'Sora', sans-serif",
                            ...(c.variant === "odd"
                              ? {
                                  background: ui.amberBg,
                                  borderColor: ui.amberBorder,
                                  color: ui.amber,
                                }
                              : c.variant === "even"
                                ? {
                                    background: ui.tealBg,
                                    borderColor: ui.tealBorder,
                                    color: ui.teal,
                                  }
                                : {
                                    background: ui.roseBg,
                                    borderColor: ui.roseBorder,
                                    color: ui.rose,
                                  }),
                          }}
                        >
                          <span
                            className="h-1 w-1 shrink-0 rounded-full"
                            style={{ background: "currentColor" }}
                          />
                          {c.label}
                        </span>
                      ))}
                  </div>
                  {summaryBadges.some((c) => c.isNoFails) && (
                    <div className="flex flex-wrap items-center gap-1">
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                        style={{
                          color: ui.rose,
                          background: ui.roseBg,
                          border: `1px solid ${ui.roseBorder}`,
                        }}
                      >
                        No Fails
                      </span>
                      {summaryBadges
                        .filter((c) => c.isNoFails)
                        .map((c) => (
                          <span
                            key={c.key}
                            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                            style={{
                              fontFamily: "'Sora', sans-serif",
                              background: ui.roseBg,
                              borderColor: ui.roseBorder,
                              color: ui.rose,
                            }}
                          >
                            <span className="h-1 w-1 shrink-0 rounded-full bg-current" />
                            {c.label}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              {isAuto ? (
                <span
                  className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
                  style={{
                    background: ui.greenBg,
                    borderColor: ui.greenBorder,
                    color: ui.green,
                  }}
                >
                  ⚡ Auto
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
                  style={{
                    background: ui.violetBg,
                    borderColor: ui.violetBorder,
                    color: ui.violet,
                  }}
                >
                  ⚙ Conditional
                </span>
              )}
            </div>

            <div className="flex justify-center opacity-45 transition-opacity hover:opacity-100">
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
                strokeWidth={1.4}
                style={{ color: ui.text2 }}
              />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="clause-row-wrap data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <div
            className="border-t bg-white"
            style={{
              borderColor: ui.border,
              borderTopWidth: 3,
              borderTopColor: pal.mid,
            }}
          >
            {/* Logic strip */}
            <div
              className="flex flex-wrap items-center gap-2 border-b px-4 py-3"
              style={{ borderColor: ui.border, background: ui.card2 }}
            >
              <span
                className="mr-1 text-[10.5px] font-bold uppercase tracking-[0.06em]"
                style={{ color: ui.text3, fontFamily: "'Sora', sans-serif" }}
              >
                Logic
              </span>
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border-[1.5px] px-3 py-1.5 text-[12px] font-bold",
                  isAuto ? "shadow-sm" : "",
                )}
                style={
                  isAuto
                    ? {
                        borderColor: ui.green,
                        background: ui.greenBg,
                        color: ui.green,
                        fontFamily: "'Sora', sans-serif",
                      }
                    : {
                        borderColor: ui.greenBorder,
                        background: "transparent",
                        color: ui.text2,
                        fontFamily: "'Sora', sans-serif",
                      }
                }
              >
                <span
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: isAuto ? ui.green : ui.greenBorder,
                    background: isAuto ? ui.green : "transparent",
                  }}
                >
                  {isAuto ? <span className="h-[5px] w-[5px] rounded-full bg-white" /> : null}
                </span>
                ⚡ Auto-Promote
              </div>
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border-[1.5px] px-3 py-1.5 text-[12px] font-bold",
                  !isAuto ? "shadow-sm" : "",
                )}
                style={
                  !isAuto
                    ? {
                        borderColor: ui.violet,
                        background: ui.violetBg,
                        color: ui.violet,
                        fontFamily: "'Sora', sans-serif",
                      }
                    : {
                        borderColor: ui.violetBorder,
                        background: "transparent",
                        color: ui.text2,
                        fontFamily: "'Sora', sans-serif",
                      }
                }
              >
                <span
                  className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: !isAuto ? ui.violet : ui.violetBorder,
                    background: !isAuto ? ui.violet : "transparent",
                  }}
                >
                  {!isAuto ? <span className="h-[5px] w-[5px] rounded-full bg-white" /> : null}
                </span>
                ⚙ Conditional
              </div>
            </div>

            {isAuto ? (
              <div
                className="space-y-0 border-b"
                style={{ borderColor: ui.border, background: ui.greenBg }}
              >
                <div className="flex items-start gap-2.5 px-[18px] py-5">
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-[1.5px]"
                    style={{ borderColor: ui.greenBorder, background: ui.greenBg }}
                  >
                    <Zap className="h-4 w-4" style={{ color: ui.green }} />
                  </div>
                  <div>
                    <div
                      className="text-[13px] font-bold"
                      style={{ color: ui.green, fontFamily: "'Sora', sans-serif" }}
                    >
                      Auto-Promotion Active
                    </div>
                    <div className="mt-0.5 text-[11.5px]" style={{ color: ui.text2 }}>
                      No conditions required — student always advances to {title}.
                    </div>
                  </div>
                </div>
                <div
                  className="flex justify-end gap-2 border-t px-4 py-3"
                  style={{ borderColor: ui.border, background: ui.card2 }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                    className="text-[12.5px] font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled
                    className="text-[12.5px] font-bold"
                    style={{ background: ui.navy, color: "#fff", fontFamily: "'Sora', sans-serif" }}
                  >
                    Save Rule →
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ background: ui.card }}>
                  {/* Table header */}
                  <div
                    className="grid grid-cols-[52px_1fr_1fr_1.4fr_34px] gap-0 border-b"
                    style={{ background: ui.card3, borderColor: ui.border }}
                  >
                    <div className="px-3 py-2" />
                    {["Column Name", "Operator", "Value"].map((h) => (
                      <div
                        key={h}
                        className="border-l px-3 py-2 text-[10px] font-bold uppercase tracking-[0.07em]"
                        style={{
                          borderColor: ui.border,
                          color: ui.text3,
                          fontFamily: "'Sora', sans-serif",
                        }}
                      >
                        {h}
                      </div>
                    ))}
                    <div className="border-l px-1 py-2" style={{ borderColor: ui.border }} />
                  </div>

                  {(builder.rules ?? []).map((rule, idx) => {
                    const failClause = isFailedPapersClause(rule.promotionClause?.name);
                    return (
                      <div
                        key={rule.id ?? idx}
                        className="grid grid-cols-1 border-b last:border-b-0 sm:grid-cols-[52px_1fr_1fr_1.4fr_34px]"
                        style={{ borderColor: ui.border }}
                      >
                        <div className="hidden items-start justify-center px-3 pt-3.5 sm:flex">
                          <span
                            className="text-xs font-semibold"
                            style={{ color: ui.text3, fontFamily: "'Sora', sans-serif" }}
                          >
                            {idx === 0 ? "If" : "And"}
                          </span>
                        </div>
                        <div className="flex min-w-0 gap-2 border-b px-3 py-3 sm:border-b-0 sm:pl-0">
                          <span
                            className="w-8 shrink-0 pt-1 text-xs font-semibold sm:hidden"
                            style={{ color: ui.text3 }}
                          >
                            {idx === 0 ? "If" : "And"}
                          </span>
                          <div
                            className={cn(
                              "flex min-w-0 flex-1 items-start gap-2 rounded-lg px-3 py-2",
                              failClause ? "border" : "border",
                            )}
                            style={
                              failClause
                                ? { borderColor: ui.roseBorder, background: `${ui.roseBg}99` }
                                : { borderColor: ui.greenBorder, background: ui.card }
                            }
                          >
                            {failClause ? (
                              <X
                                className="mt-0.5 h-4 w-4 shrink-0"
                                strokeWidth={1}
                                style={{ color: ui.rose }}
                              />
                            ) : (
                              <CheckSquare
                                className="mt-0.5 h-4 w-4 shrink-0"
                                strokeWidth={1}
                                style={{ color: ui.green }}
                              />
                            )}
                            <span
                              className="text-xs font-medium leading-snug break-words"
                              style={{ color: ui.text }}
                            >
                              {rule.promotionClause?.name ?? "—"}
                            </span>
                          </div>
                        </div>
                        <div
                          className="flex items-center border-t border-l px-3 py-2.5 sm:border-t-0"
                          style={{ borderColor: ui.border }}
                        >
                          <div
                            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11.5px]"
                            style={{
                              borderColor: ui.border2,
                              background: ui.card2,
                              color: ui.text2,
                            }}
                          >
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                              <circle cx="4" cy="4" r="3.2" stroke={ui.text3} strokeWidth="0.9" />
                              <path
                                d="M2.5 4h3M4 2.5v3"
                                stroke={ui.text3}
                                strokeWidth="0.9"
                                strokeLinecap="round"
                              />
                            </svg>
                            {operatorLabel(rule.operator ?? "EQUALS")}
                          </div>
                        </div>
                        <div
                          className="min-w-0 border-t border-l px-3 py-2.5 sm:border-t-0"
                          style={{ borderColor: ui.border }}
                        >
                          <div
                            className="flex min-h-[2.75rem] flex-wrap items-center gap-1.5 rounded-lg border p-2 shadow-inner"
                            style={{ borderColor: ui.border, background: "#FAFAF9" }}
                          >
                            {failClause && (
                              <span
                                className="mr-1 text-[11px] font-bold"
                                style={{ color: "#BE123C" }}
                              >
                                No Fails
                              </span>
                            )}
                            {(rule.classes ?? []).length === 0 ? (
                              <span className="text-sm" style={{ color: ui.text3 }}>
                                —
                              </span>
                            ) : (
                              (rule.classes ?? []).map((row) => {
                                const cls = row.class as ClassT | undefined;
                                const op = rule.operator ?? "EQUALS";
                                const tr = inferTrack(cls);
                                return (
                                  <span
                                    key={row.id ?? `${rule.id}-${cls?.id}`}
                                    className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
                                    style={
                                      op === "NONE_IN" || failClause
                                        ? {
                                            borderColor: ui.roseBorder,
                                            background: "#FFF1F2",
                                            color: "#9F1239",
                                          }
                                        : tr === "ODD"
                                          ? {
                                              borderColor: `${ui.amber}8c`,
                                              background: "#FFFBEB",
                                              color: "#92400E",
                                            }
                                          : {
                                              borderColor: `${ui.teal}73`,
                                              background: ui.tealBg,
                                              color: "#065F46",
                                            }
                                    }
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
                        <div
                          className="hidden items-center justify-center border-t border-l py-2 sm:flex"
                          style={{ borderColor: ui.border }}
                        >
                          <button
                            type="button"
                            className="rounded-md p-1.5"
                            style={{ color: ui.text3 }}
                            disabled
                            aria-label="Remove clause"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="border-b px-3.5 py-2.5" style={{ borderColor: ui.border }}>
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center gap-1.5 rounded-md border-[1.5px] border-dashed px-3.5 py-1.5 text-[12px] font-semibold"
                      style={{
                        borderColor: ui.border2,
                        color: ui.text2,
                        background: "transparent",
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      Add Clause
                    </button>
                  </div>

                  {/* Then */}
                  <div
                    className="grid grid-cols-1 border-b sm:grid-cols-[52px_1fr]"
                    style={{ borderColor: ui.border, background: ui.greenBg }}
                  >
                    <div className="flex items-center justify-center px-3 py-2.5">
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: ui.green, fontFamily: "'Sora', sans-serif" }}
                      >
                        Then
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 border-t px-3 py-2.5 sm:border-t-0 sm:border-l"
                      style={{ borderColor: ui.greenBorder }}
                    >
                      <span style={{ color: ui.text3 }}>→</span>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold"
                        style={{
                          borderColor: ui.greenBorder,
                          background: ui.greenBg,
                          color: ui.green,
                        }}
                      >
                        <Check className="h-3 w-3" strokeWidth={2} />
                        Promote to {title}
                      </span>
                    </div>
                  </div>

                  {/* Else */}
                  <div className="grid grid-cols-1 sm:grid-cols-[52px_1fr]">
                    <div className="flex items-center justify-center px-3 py-2.5">
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: ui.text3, fontFamily: "'Sora', sans-serif" }}
                      >
                        Else
                      </span>
                    </div>
                    <div
                      className="flex items-center gap-2 border-t px-3 py-2.5 sm:border-t-0 sm:border-l"
                      style={{ borderColor: ui.border }}
                    >
                      <span style={{ color: ui.text3 }}>→</span>
                      <span
                        className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold"
                        style={{ borderColor: ui.border2, background: ui.card2, color: ui.text3 }}
                      >
                        <CircleSlash className="h-3 w-3" />
                        Hold — Do not promote
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="flex justify-end gap-2 border-t px-4 py-3"
                  style={{ borderColor: ui.border, background: ui.card2 }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled
                    className="text-[12.5px] font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled
                    className="gap-1 text-[12.5px] font-bold"
                    style={{ background: ui.navy, color: "#fff", fontFamily: "'Sora', sans-serif" }}
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
