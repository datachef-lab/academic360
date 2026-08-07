import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Loader2, OctagonAlert, Upload } from "lucide-react";
import { DashboardPanel, GradientKpi } from "../ui";
import { useDashboardSummary } from "@/features/document-issuance/hooks/use-documents-dashboard";
import type { DashboardTabId } from "../DashboardHeader";

const ATTENTION_TONES = ["amber", "red", "blue"] as const;
type AttentionTone = (typeof ATTENTION_TONES)[number];

const ATTENTION_STYLE: Record<
  AttentionTone,
  { border: string; bg: string; icon: JSX.Element; link: string }
> = {
  amber: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    link: "text-amber-700",
  },
  red: {
    border: "border-red-200",
    bg: "bg-red-50",
    icon: <OctagonAlert className="h-4 w-4 text-red-500" />,
    link: "text-red-700",
  },
  blue: {
    border: "border-sky-200",
    bg: "bg-sky-50",
    icon: <Upload className="h-4 w-4 text-sky-500" />,
    link: "text-sky-700",
  },
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-[#d4d4d4] bg-white px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-[#333]">{formatDateLabel(label ?? "")}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-1.5 text-[#555]">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="capitalize">{p.dataKey}</span>
          <span className="ml-auto font-semibold tabular-nums text-[#1a1a1a]">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/** "2026-07-08" -> "Jul 08" — matches the mock's original x-axis label style. */
function formatDateLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" });
}

export function OverviewTab({
  onNavigate,
}: {
  /** Jump to another tab from an Attention link — optional so the tab still
   *  renders standalone (e.g. in isolation/tests). */
  onNavigate?: (tab: DashboardTabId) => void;
}) {
  const { data: summary, isLoading, isError } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center gap-2 rounded-lg border border-[#d4d4d4] bg-white text-[#666]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading dashboard…
      </div>
    );
  }
  if (isError || !summary) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-[#d4d4d4] bg-white text-sm text-red-600">
        Failed to load the dashboard summary.
      </div>
    );
  }

  const { totals, dailyActivity, attention } = summary;

  const kpis = [
    {
      label: "Total ledger rows",
      value: totals.totalLedgerRows.toLocaleString(),
      hint: `${totals.pendingTotal.toLocaleString()} pending`,
      gradient: "from-[#5b21b6] via-[#7c3aed] to-[#8b5cf6]",
      icon: "file" as const,
    },
    {
      label: "Pending",
      value: totals.pendingTotal.toLocaleString(),
      hint: `across ${totals.pendingBatchCount.toLocaleString()} batches`,
      gradient: "from-[#b45309] via-[#d97706] to-[#f59e0b]",
      icon: "clock" as const,
    },
    {
      label: "Collected · 7 days",
      value: totals.collected7d.toLocaleString(),
      hint: `${totals.collectedToday.toLocaleString()} today`,
      gradient: "from-[#047857] via-[#059669] to-[#10b981]",
      icon: "circleCheckBig" as const,
    },
    {
      label: "Uploaded · 7 days",
      value: totals.uploaded7d.toLocaleString(),
      hint: "self-sourced",
      gradient: "from-[#0e7490] via-[#0891b2] to-[#06b6d4]",
      icon: "upload" as const,
    },
    {
      label: "On-hold (fee-blocked)",
      value: totals.onHold.toLocaleString(),
      hint: "fee clearance pending",
      gradient: "from-[#b91c1c] via-[#dc2626] to-[#ef4444]",
      icon: "lock" as const,
    },
    {
      label: "Top-up backlog",
      value: totals.topUpBacklogRows.toLocaleString(),
      hint: `${totals.topUpBacklogBatches.toLocaleString()} batches drifted`,
      gradient: "from-[#334155] via-[#475569] to-[#64748b]",
      icon: "refresh" as const,
    },
  ];

  type AttentionItem = {
    tone: AttentionTone;
    title: string;
    body: string;
    linkText: string;
    navigateTo?: DashboardTabId;
  };
  const allAttentionItems: AttentionItem[] = [
    {
      tone: "amber",
      title: `${attention.batchesNotOpened.count} batch${attention.batchesNotOpened.count === 1 ? "" : "es"} — distribution not opened`,
      body: "Recorded as arrived, staff haven't started handing out.",
      linkText: "Open list →",
      navigateTo: "batch-receipts",
    },
    {
      tone: "red",
      title: `${attention.staleRows.count} row${attention.staleRows.count === 1 ? "" : "s"} — stale`,
      body: "Pending rows tied to promotions no longer in scope.",
      linkText: "Reconcile →",
    },
    {
      tone: "blue",
      title: `${attention.missingUploads.count} missing uploads`,
      body: "Students asked but haven't uploaded — projected as PENDING.",
      linkText: "View →",
      navigateTo: "by-document-type",
    },
  ];
  const attentionItems = allAttentionItems.filter((i) => !i.title.startsWith("0 "));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <GradientKpi key={kpi.label} {...kpi} />
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DashboardPanel
          title="30-day activity — collects vs uploads"
          subtitle="Daily count of new COLLECTED and UPLOADED ledger rows"
          bodyClassName="p-4 pt-2"
        >
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyActivity} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="collectedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="uploadedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e5e5e5" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  tick={{ fontSize: 10, fill: "#888" }}
                  tickLine={false}
                  axisLine={{ stroke: "#d4d4d4" }}
                  interval={6}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#888" }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#collectedFill)"
                />
                <Area
                  type="monotone"
                  dataKey="uploaded"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  fill="url(#uploadedFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex items-center gap-4 text-xs text-[#666]">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Collected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Uploaded (self-sourced)
            </span>
          </div>
        </DashboardPanel>

        <DashboardPanel title="Attention" subtitle="Things worth acting on now">
          {attentionItems.length === 0 ? (
            <div className="flex min-h-[120px] items-center justify-center text-sm text-[#888]">
              Nothing needs attention right now.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {attentionItems.map((item) => {
                const style = ATTENTION_STYLE[item.tone];
                return (
                  <div
                    key={item.title}
                    className={`flex items-start gap-2.5 rounded-md border ${style.border} ${style.bg} px-3 py-2.5`}
                  >
                    <span className="mt-0.5">{style.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1a1a1a]">{item.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-[#666]">
                        {item.body}{" "}
                        {item.navigateTo ? (
                          <button
                            type="button"
                            className={`font-medium ${style.link} hover:underline`}
                            onClick={() => onNavigate?.(item.navigateTo!)}
                          >
                            {item.linkText}
                          </button>
                        ) : (
                          <span className={`font-medium ${style.link}`}>{item.linkText}</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}
