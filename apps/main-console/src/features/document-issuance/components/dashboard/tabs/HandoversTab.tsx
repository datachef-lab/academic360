import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { DashboardPanel, GradientKpi, ProportionBar, Chip } from "../ui";
import { useDashboardHandovers } from "@/features/document-issuance/hooks/use-documents-dashboard";
import { StudentAvatar } from "@/components/student/StudentAvatar";

/** "2026-08-07T10:12:00Z" -> "2 min ago" / "3h ago" / "5d ago". */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function peakDayLabel(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return WEEKDAY[d.getUTCDay()] ?? date;
}

export function HandoversTab() {
  const { data, isLoading, isError } = useDashboardHandovers();

  const recent = data?.recent ?? [];
  const pagedRecent = useMemo(() => recent.slice(0, 10), [recent]);

  if (isLoading) {
    return (
      <div className="flex min-h-[280px] items-center justify-center gap-2 rounded-lg border border-[#d4d4d4] bg-white text-[#666]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading handovers…
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-[#d4d4d4] bg-white text-sm text-red-600">
        Failed to load handovers.
      </div>
    );
  }

  const { kpis, topProviders } = data;
  const maxProvider = Math.max(1, ...topProviders.map((p) => p.count));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <GradientKpi
          label="Collected today"
          value={kpis.collectedToday.toLocaleString()}
          hint="handed over today"
          gradient="from-[#047857] via-[#059669] to-[#10b981]"
          icon="circleCheckBig"
        />
        <GradientKpi
          label="Collected · 7 days"
          value={kpis.collected7d.toLocaleString()}
          hint={
            kpis.peakDay
              ? `peak ${peakDayLabel(kpis.peakDay.date)} · ${kpis.peakDay.count}`
              : "last 7 days"
          }
          gradient="from-[#5b21b6] via-[#7c3aed] to-[#8b5cf6]"
          icon="circleCheckBig"
        />
        <GradientKpi
          label="Uploaded · 7 days"
          value={kpis.uploaded7d.toLocaleString()}
          hint={`${kpis.selfSourcedUploadPct}% self-sourced`}
          gradient="from-[#0e7490] via-[#0891b2] to-[#06b6d4]"
          icon="upload"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DashboardPanel
          title="Recent handovers"
          subtitle="Realtime feed of COLLECTED and UPLOADED events"
          headerRight={
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
            </span>
          }
          bodyClassName="flex flex-col gap-3 p-4"
        >
          {recent.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center text-sm text-[#888]">
              No handovers recorded yet.
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[#ebebeb]">
              {pagedRecent.map((h) => (
                <div
                  key={h.ledgerId}
                  className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <StudentAvatar uid={h.studentUid} name={h.studentName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[#1a1a1a]">
                      <span className="font-medium">{h.studentName}</span>
                      <span className="text-[#999]">
                        {" "}
                        · {h.documentTypeName}
                        {h.status === "UPLOADED" ? " upload" : ""}
                      </span>
                    </p>
                    <p className="truncate text-xs text-[#999]">
                      {h.status === "COLLECTED"
                        ? `Handed by ${h.providedByName ?? "staff"}`
                        : "Uploaded by student"}
                      {h.className ? ` · ${h.className}` : ""} · {relativeTime(h.at)}
                    </p>
                  </div>
                  <Chip tone={h.status === "COLLECTED" ? "green" : "violet"}>
                    {h.status === "COLLECTED" ? "Collected" : "Uploaded"}
                  </Chip>
                </div>
              ))}
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel title="Top providers · 7 days" subtitle="Staff by COLLECTED count">
          {topProviders.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center text-sm text-[#888]">
              No handovers in the last 7 days.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {topProviders.map((p, i) => (
                <div key={p.userId} className="flex items-center gap-3">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${
                      i < 3 ? "bg-amber-500" : "bg-violet-400"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span className="w-28 shrink-0 truncate text-xs text-[#555]">{p.name}</span>
                  <ProportionBar value={p.count} max={maxProvider} tone="violet" />
                  <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-[#1a1a1a]">
                    {p.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashboardPanel>
      </div>
    </div>
  );
}
