import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Loader2 } from "lucide-react";
import { DashboardPanel, Chip, ProportionBar, type Tone } from "../ui";
import { useDocumentTypes } from "@/features/document-issuance/hooks/use-document-types";
import { useDashboardSummary } from "@/features/document-issuance/hooks/use-documents-dashboard";

const CATEGORY_TONE: Record<string, Tone> = {
  EXAM_LINKED: "violet",
  SYSTEM_GENERATED: "slate",
  ADMINISTRATIVE: "violet",
  UPLOAD: "violet",
};

const CATEGORY_LABEL: Record<string, string> = {
  EXAM_LINKED: "Exam-linked",
  SYSTEM_GENERATED: "System-generated",
  ADMINISTRATIVE: "Administrative",
  UPLOAD: "Admission upload",
};

const STATUS_COLOR: Record<string, string> = {
  COLLECTED: "#10b981",
  PENDING: "#f59e0b",
  UPLOADED: "#06b6d4",
  ON_HOLD: "#ef4444",
  WAIVED: "#8b5cf6",
  EXPECTED: "#94a3b8",
  NO_CHANGE: "#94a3b8",
};

const STATUS_LABEL: Record<string, string> = {
  COLLECTED: "Collected",
  PENDING: "Pending",
  UPLOADED: "Uploaded",
  ON_HOLD: "On hold",
  WAIVED: "Waived",
  EXPECTED: "Expected",
  NO_CHANGE: "No change",
};

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { pct: number } }[];
}) {
  if (!active) return null;
  const p = payload?.[0];
  if (!p) return null;
  return (
    <div className="rounded-md border border-[#d4d4d4] bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-[#1a1a1a]">{p.name}</p>
      <p className="text-[#666]">
        {p.value.toLocaleString()} · {p.payload.pct}%
      </p>
    </div>
  );
}

export function ByDocumentTypeTab() {
  const { data: types = [], isLoading: typesLoading, isError: typesError } = useDocumentTypes();
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useDashboardSummary();

  const isLoading = typesLoading || summaryLoading;
  const isError = typesError || summaryError;

  const derived = useMemo(() => {
    if (!summary) return null;

    const totalLedgerRows = summary.statusCounts.reduce((a, s) => a + s.count, 0);
    const ledgerStatus = summary.statusCounts
      .filter((s) => s.count > 0)
      .map((s) => ({
        label: STATUS_LABEL[s.status] ?? s.status,
        value: s.count,
        pct: totalLedgerRows > 0 ? Math.round((s.count / totalLedgerRows) * 100) : 0,
        color: STATUS_COLOR[s.status] ?? "#94a3b8",
      }))
      .sort((a, b) => b.value - a.value);
    const collectedPct = ledgerStatus.find((s) => s.label === "Collected")?.pct ?? 0;

    const countsByType = new Map(summary.documentTypeCounts.map((c) => [c.documentTypeId, c]));

    const allDocumentTypes = types
      .map((t) => {
        const c = countsByType.get(t.id);
        return {
          id: t.id,
          type: t.name,
          category: t.category ?? "ADMINISTRATIVE",
          authority: t.issuingAuthority ?? "—",
          total: c?.total ?? 0,
          pending: c?.pending ?? 0,
          collected: c?.collected ?? 0,
          onHold: c?.onHold ?? 0,
          requiresFeeClearance: t.requiresFeeClearance ?? false,
        };
      })
      .sort((a, b) => b.total - a.total);

    const pendingByDocType = allDocumentTypes
      .filter((t) => t.pending > 0)
      .sort((a, b) => b.pending - a.pending)
      .slice(0, 10)
      .map((t) => ({
        name: t.type,
        value: t.pending,
        tone: (t.onHold > 0 ? "red" : "amber") as Tone,
      }));

    return { ledgerStatus, collectedPct, totalLedgerRows, allDocumentTypes, pendingByDocType };
  }, [summary, types]);

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-2 rounded-lg border border-[#d4d4d4] bg-white text-[#666]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading document types…
      </div>
    );
  }
  if (isError || !derived) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-[#d4d4d4] bg-white text-sm text-red-600">
        Failed to load document type data.
      </div>
    );
  }

  const maxPending = Math.max(1, ...derived.pendingByDocType.map((d) => d.value));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <DashboardPanel
          title="Ledger status"
          subtitle={`${derived.totalLedgerRows.toLocaleString()} rows total · hover an arc`}
        >
          {derived.ledgerStatus.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center text-sm text-[#888]">
              No ledger rows yet.
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative h-[180px] w-[180px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={derived.ledgerStatus}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {derived.ledgerStatus.map((s) => (
                        <Cell key={s.label} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[#1a1a1a]">{derived.collectedPct}%</span>
                  <span className="text-[10px] uppercase tracking-wider text-[#999]">
                    Collected
                  </span>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {derived.ledgerStatus.map((s) => (
                  <div key={s.label} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[#555]">{s.label}</span>
                    <span className="shrink-0 tabular-nums text-[#1a1a1a]">
                      {s.value.toLocaleString()}
                    </span>
                    <span className="w-8 shrink-0 text-right tabular-nums text-[#999]">
                      {s.pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DashboardPanel>

        <DashboardPanel
          title="Pending by document type"
          subtitle="Where the outstanding work sits · top 10"
          headerRight={
            <span className="inline-flex items-center rounded-full border border-[#e2e2e2] bg-[#f5f5f5] px-2 py-0.5 text-[11px] font-medium text-[#666]">
              Sorted by pending
            </span>
          }
        >
          {derived.pendingByDocType.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center text-sm text-[#888]">
              Nothing pending.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2.5">
                {derived.pendingByDocType.map((d) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-xs text-[#555]">{d.name}</span>
                    <ProportionBar value={d.value} max={maxPending} tone={d.tone} />
                    <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-[#1a1a1a]">
                      {d.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-4 text-[11px] text-[#888]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Pending
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> On hold (fee-gated)
                </span>
              </div>
            </>
          )}
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="All document types"
        subtitle={`${derived.allDocumentTypes.length} seeded types · click a row to drill in`}
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#ebebeb] text-[10px] uppercase tracking-wider text-[#999]">
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Issuing authority</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
                <th className="px-4 py-2 text-right font-medium">Pending</th>
                <th className="px-4 py-2 text-right font-medium">Collected</th>
                <th className="px-4 py-2 text-right font-medium">On hold</th>
              </tr>
            </thead>
            <tbody>
              {derived.allDocumentTypes.map((d) => (
                <tr
                  key={d.id}
                  className="cursor-pointer border-b border-[#ebebeb] last:border-0 hover:bg-[#fafafa]"
                >
                  <td className="px-4 py-2.5 font-medium text-violet-700">{d.type}</td>
                  <td className="px-4 py-2.5">
                    <Chip
                      tone={d.requiresFeeClearance ? "red" : (CATEGORY_TONE[d.category] ?? "slate")}
                    >
                      {d.requiresFeeClearance
                        ? "Fee-gated"
                        : (CATEGORY_LABEL[d.category] ?? d.category)}
                    </Chip>
                  </td>
                  <td className="px-4 py-2.5 text-[#666]">{d.authority}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#444]">
                    {d.total.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#444]">
                    {d.pending.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#444]">
                    {d.collected.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-[#444]">
                    {d.onHold.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardPanel>
    </div>
  );
}
