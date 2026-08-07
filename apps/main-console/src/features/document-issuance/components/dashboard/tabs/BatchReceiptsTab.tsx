import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { DashboardPanel, GradientKpi, ProportionBar } from "../ui";
import {
  getAllBatchReceipts,
  type BatchReceipt,
  type BatchReceiptMode,
} from "@/features/document-issuance/services/document-batch-receipt.service";

const BATCH_RECEIPTS_QUERY_KEY = ["document-batch-receipts"] as const;

const modeEnabled = (row: BatchReceipt, mode: BatchReceiptMode): boolean =>
  row.modes.find((m) => m.mode === mode)?.isEnabled ?? false;

/** "Semester IV" -> "IV" — matches the trimSemester helper in document-batch-receipt-page.tsx. */
const semesterLabel = (className: string): string =>
  className
    .replace(/^\s*semester\s+/i, "")
    .trim()
    .toUpperCase() || className;

const ROMAN_ORDER: Record<string, number> = {
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

const scopeLabel = (courses: string[]): string => {
  if (courses.length === 0) return "No programme course";
  if (courses.length <= 2) return courses.join(", ");
  return `${courses.length} programme courses`;
};

const heatCellColor = (value: number) => {
  if (value === 0) return "bg-[#f2f2f2] text-[#ccc]";
  if (value >= 6) return "bg-[#7c3aed] text-white";
  if (value >= 4) return "bg-[#7c3aed]/70 text-white";
  if (value >= 2) return "bg-[#7c3aed]/35 text-[#4c1d95]";
  return "bg-[#7c3aed]/15 text-[#6d28d9]";
};

export function BatchReceiptsTab() {
  const {
    data: rows = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: BATCH_RECEIPTS_QUERY_KEY,
    queryFn: () => getAllBatchReceipts(),
  });

  const derived = useMemo(() => {
    const liveBatches = rows.filter((r) => !r.isArchived);
    const archivedCount = rows.length - liveBatches.length;
    const distributionOpen = liveBatches.filter((r) => modeEnabled(r, "ADMINISTRATIVE")).length;
    const arrivedNotOpened = liveBatches.filter(
      (r) => modeEnabled(r, "EXAM_LINKED") && !modeEnabled(r, "ADMINISTRATIVE"),
    ).length;

    const drifted = rows
      .map((r) => ({ row: r, drift: r.ledger.eligible - r.ledger.total }))
      .filter((r) => r.drift > 0)
      .sort((a, b) => b.drift - a.drift);
    const topUpBacklogRows = drifted.reduce((a, r) => a + r.drift, 0);
    const topUpBacklogBatches = drifted.length;

    let examAdminOn = 0;
    let examOnAdminOff = 0;
    let bothOff = 0;
    for (const r of liveBatches) {
      const exam = modeEnabled(r, "EXAM_LINKED");
      const admin = modeEnabled(r, "ADMINISTRATIVE");
      if (exam && admin) examAdminOn += 1;
      else if (exam && !admin) examOnAdminOff += 1;
      else bothOff += 1;
    }

    const cellMap = new Map<string, number>();
    const years = new Set<string>();
    const sems = new Set<string>();
    for (const r of rows) {
      const sem = semesterLabel(r.className);
      years.add(r.academicYear);
      sems.add(sem);
      const key = `${r.academicYear}|${sem}`;
      cellMap.set(key, (cellMap.get(key) ?? 0) + 1);
    }
    const sortedSems = [...sems].sort((a, b) => (ROMAN_ORDER[a] ?? 99) - (ROMAN_ORDER[b] ?? 99));
    const sortedYears = [...years].sort().reverse();

    return {
      totalBatches: rows.length,
      archivedCount,
      liveCount: liveBatches.length,
      distributionOpen,
      arrivedNotOpened,
      drifted,
      topUpBacklogRows,
      topUpBacklogBatches,
      modeMix: [
        { label: "Exam + Admin ON", value: examAdminOn, tone: "green" as const },
        { label: "Exam ON · Admin OFF", value: examOnAdminOff, tone: "amber" as const },
        { label: "Both OFF (draft)", value: bothOff, tone: "slate" as const },
        { label: "Archived", value: archivedCount, tone: "slate" as const },
      ],
      sortedSems,
      sortedYears,
      cellMap,
    };
  }, [rows]);

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center gap-2 rounded-lg border border-[#d4d4d4] bg-white text-[#666]">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading batch receipts…
      </div>
    );
  }
  if (isError) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-[#d4d4d4] bg-white text-sm text-red-600">
        Failed to load batch receipts.
      </div>
    );
  }

  const maxDrift = Math.max(1, ...derived.drifted.map((r) => r.drift));
  const maxMode = Math.max(1, ...derived.modeMix.map((m) => m.value));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <GradientKpi
          label="Total batches"
          value={derived.totalBatches.toLocaleString()}
          hint={`${derived.archivedCount} archived · ${derived.liveCount} live`}
          gradient="from-[#5b21b6] via-[#7c3aed] to-[#8b5cf6]"
          icon="package"
        />
        <GradientKpi
          label="Distribution open"
          value={derived.distributionOpen.toLocaleString()}
          hint="Administrative mode ON"
          gradient="from-[#047857] via-[#059669] to-[#10b981]"
          icon="unlock"
        />
        <GradientKpi
          label="Arrived, not opened"
          value={derived.arrivedNotOpened.toLocaleString()}
          hint="Exam-linked but not Admin"
          gradient="from-[#b45309] via-[#d97706] to-[#f59e0b]"
          icon="inbox"
        />
        <GradientKpi
          label="Top-up backlog"
          value={derived.topUpBacklogRows.toLocaleString()}
          hint={`${derived.topUpBacklogBatches} batches drifted`}
          gradient="from-[#334155] via-[#475569] to-[#64748b]"
          icon="refresh"
        />
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <DashboardPanel
          title="Batches needing top-up"
          subtitle="Live scope has grown beyond materialised rows · click a row to open the batch"
          headerRight={
            <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
              {derived.topUpBacklogBatches} batches
            </span>
          }
          bodyClassName="p-0"
        >
          {derived.drifted.length === 0 ? (
            <div className="flex min-h-[160px] items-center justify-center px-4 text-sm text-[#888]">
              Every batch is fully topped up.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#ebebeb] text-[10px] uppercase tracking-wider text-[#999]">
                    <th className="px-4 py-2 font-medium">Batch</th>
                    <th className="px-4 py-2 text-right font-medium">Scope</th>
                    <th className="px-4 py-2 text-right font-medium">Ledger</th>
                    <th className="px-4 py-2 text-right font-medium">Collected</th>
                    <th className="px-4 py-2 text-right font-medium">Drift</th>
                  </tr>
                </thead>
                <tbody>
                  {derived.drifted.map(({ row: b, drift }) => (
                    <tr
                      key={b.id}
                      className="cursor-pointer border-b border-[#ebebeb] last:border-0 hover:bg-[#fafafa]"
                    >
                      <td className="px-4 py-2.5">
                        <p className="text-sm font-medium text-[#1a1a1a]">{b.name}</p>
                        <p className="text-xs text-[#999]">{scopeLabel(b.programCourses)}</p>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-[#444]">
                        {b.ledger.eligible.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-[#444]">
                        {b.ledger.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-[#444]">
                        {b.ledger.collected.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span
                          className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-violet-700"
                          title={`Drift vs. max (${maxDrift})`}
                        >
                          +{drift}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardPanel>

        <div className="flex flex-col gap-3">
          <DashboardPanel title="Mode mix" subtitle="EXAM_LINKED × ADMINISTRATIVE">
            <div className="flex flex-col gap-3">
              {derived.modeMix.map((m) => (
                <div key={m.label} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-xs text-[#555]">{m.label}</span>
                  <ProportionBar value={m.value} max={maxMode} tone={m.tone} />
                  <span className="w-6 shrink-0 text-right text-xs font-semibold tabular-nums text-[#1a1a1a]">
                    {m.value}
                  </span>
                </div>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel
            title="Coverage · AY × class"
            subtitle="Batch count by (academic year, semester)"
          >
            {derived.sortedYears.length === 0 ? (
              <div className="flex min-h-[120px] items-center justify-center text-sm text-[#888]">
                No batches yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-1 text-center text-xs">
                  <thead>
                    <tr>
                      <th className="text-left text-[10px] font-medium uppercase tracking-wider text-[#999]" />
                      {derived.sortedSems.map((s) => (
                        <th
                          key={s}
                          className="px-1 pb-1 text-[10px] font-medium uppercase tracking-wider text-[#999]"
                        >
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {derived.sortedYears.map((year) => (
                      <tr key={year}>
                        <td className="whitespace-nowrap pr-2 text-left text-[11px] text-[#666]">
                          {year}
                        </td>
                        {derived.sortedSems.map((sem) => {
                          const value = derived.cellMap.get(`${year}|${sem}`) ?? 0;
                          return (
                            <td key={sem}>
                              <div
                                className={`flex h-9 w-9 items-center justify-center rounded-md text-xs font-semibold ${heatCellColor(value)}`}
                              >
                                {value || "–"}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardPanel>
        </div>
      </div>
    </div>
  );
}
