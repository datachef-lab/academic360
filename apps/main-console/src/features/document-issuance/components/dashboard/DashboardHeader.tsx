import { LayoutGrid, CalendarDays, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardTabId =
  | "overview"
  | "batch-receipts"
  | "by-document-type"
  | "handovers"
  | "fee-clearance";

export const DASHBOARD_TABS: { id: DashboardTabId; label: string; count: string }[] = [
  { id: "overview", label: "Overview", count: "" },
  { id: "batch-receipts", label: "Batch receipts", count: "" },
  { id: "by-document-type", label: "By document type", count: "" },
  { id: "handovers", label: "Handovers", count: "last 30d" },
  { id: "fee-clearance", label: "Fee-clearance blocks", count: "" },
];

export function DashboardHeader({
  activeTab,
  onTabChange,
  filterCount = 2,
  tabCounts,
}: {
  activeTab: DashboardTabId;
  onTabChange: (id: DashboardTabId) => void;
  filterCount?: number;
  /** Live counts (e.g. batch count, blocked-student count) that override the
   *  static label next to a tab — undefined while its query is still loading. */
  tabCounts?: Partial<Record<DashboardTabId, string>>;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#d1d1d1] bg-[#fafafa]">
      <div className="flex flex-col gap-4 border-b border-[#d1d1d1] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d1d1d1] ">
            <LayoutGrid className="h-5 w-5 text-purple-800" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#1a1a1a] sm:text-xl">Documents Dashboard</h1>
            <p className="mt-0.5 text-xs text-[#666]">
              Batches received, materialised into the student ledger, and handed over — one glance.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e2e2] bg-white px-3 py-1.5 text-xs font-medium text-[#555]">
            <CalendarDays className="h-3.5 w-3.5" />
            Last 30 days
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full bg-[#7c3aed] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6d28d9]"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
            <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/25 px-1 text-[10px]">
              {filterCount}
            </span>
          </button>
        </div>
      </div>

      <nav className="flex items-center gap-1 overflow-x-auto px-4 pt-2">
        {DASHBOARD_TABS.map((tab) => {
          const active = tab.id === activeTab;
          const count = tabCounts?.[tab.id] ?? tab.count;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "shrink-0 border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-[#7c3aed] font-semibold text-[#7c3aed]"
                  : "border-transparent text-[#666] hover:text-[#333]",
              )}
            >
              {tab.label}
              {count && (
                <span className="ml-1.5 text-[11px] font-normal text-[#999]">· {count}</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
