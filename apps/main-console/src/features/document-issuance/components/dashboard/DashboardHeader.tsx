import { CalendarDays, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  // { id: "fee-clearance", label: "Fee-clearance blocks", count: "" },
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
    <header className="border-b border-[#d1d1d1] bg-gradient-to-r from-[#f5f3ff] via-[#faf5ff] to-white">
      <div className="flex flex-col gap-3 px-4 py-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-[#1a1a1a]">Documents Dashboard</h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e2e2] bg-white px-3 py-1.5 text-xs font-medium text-[#555]">
            <CalendarDays className="h-3.5 w-3.5" />
            Last 30 days
          </span>
          <Button
            size="sm"
            className="relative h-8 shrink-0 rounded-md bg-[#7c3aed] pr-3 text-xs text-white hover:bg-[#6d28d9]"
          >
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            Filters
            {filterCount > 0 ? (
              <Badge
                variant="secondary"
                className="ml-1.5 h-5 min-w-5 justify-center rounded-full border-0 bg-white px-1.5 text-[10px] font-bold text-[#7c3aed]"
              >
                {filterCount}
              </Badge>
            ) : null}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-[#e5e5e5] bg-white/80 px-2">
        <nav className="inline-flex h-11 w-max min-w-full items-center gap-0.5">
          {DASHBOARD_TABS.map((tab) => {
            const active = tab.id === activeTab;
            const count = tabCounts?.[tab.id] ?? tab.count;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "shrink-0 border-b-[3px] border-transparent px-4 text-sm font-medium text-[#666] transition-colors",
                  active ? "border-[#7c3aed] font-semibold text-[#7c3aed]" : "hover:text-[#333]",
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
    </header>
  );
}
