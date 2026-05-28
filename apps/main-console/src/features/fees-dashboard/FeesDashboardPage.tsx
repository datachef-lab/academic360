import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronDown, Filter } from "lucide-react";
import { FeesFiltersDialog } from "./components/FeesFiltersDialog";
import { OverviewTab } from "./tabs/OverviewTab";
import { CollectionsTab } from "./tabs/CollectionsTab";
import { TransactionsTab } from "./tabs/TransactionsTab";
import { ChallansTab } from "./tabs/ChallansTab";
import { FeeStructuresTab } from "./tabs/FeeStructuresTab";
import { FeeSlabsTab } from "./tabs/FeeSlabsTab";
import { ReceiptsTab } from "./tabs/ReceiptsTab";
import { ReportsTab } from "./tabs/ReportsTab";
import { RealtimeTab } from "./tabs/RealtimeTab";
import { EnrollmentFeesTab } from "./tabs/EnrollmentFeesTab";
import { FeesDashboardProvider } from "./context/FeesDashboardContext";

const DASHBOARD_TABS = [
  { value: "overview", label: "Overview" },
  { value: "enrollment", label: "Enrollment & fees" },
  { value: "collections", label: "Collections" },
  { value: "transactions", label: "Transactions" },
  { value: "challans", label: "Challans" },
  { value: "structures", label: "Structures" },
  { value: "slabs", label: "Slabs" },
  { value: "receipts", label: "Receipts" },
  { value: "reports", label: "Reports" },
  { value: "realtime", label: "Live" },
] as const;

export default function FeesDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterSummary, setFilterSummary] = useState("AY 2025-26 · All programs · Sem I, IV, VI");

  const filterChips = filterSummary.split("·").map((s) => s.trim());

  return (
    <FeesDashboardProvider>
      <div className="min-h-full bg-[#eaeaea]">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Header */}
          <header className="border-b border-[#d1d1d1] bg-gradient-to-r from-[#f5f3ff] via-[#faf5ff] to-white">
            <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7c3aed]">
                  Fees module
                </p>
                <h1 className="text-xl font-bold text-[#1a1a1a]">Fees dashboard</h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {filterChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setFiltersOpen(true)}
                    className="inline-flex items-center rounded-md border border-[#d4d4d4] bg-white px-2.5 py-1.5 text-xs text-[#333] shadow-sm hover:border-[#7c3aed]/40"
                  >
                    {chip}
                    <ChevronDown className="ml-1 h-3.5 w-3.5 text-[#666]" />
                  </button>
                ))}
                <Button
                  size="sm"
                  className="h-8 rounded-md bg-[#7c3aed] text-xs text-white hover:bg-[#6d28d9]"
                  onClick={() => setFiltersOpen(true)}
                >
                  <Filter className="mr-1.5 h-3.5 w-3.5" />
                  Filters
                </Button>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#dcfce7] px-2.5 py-1.5 text-xs font-medium text-[#166534]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#22c55e]" />
                  Live
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border-t border-[#e5e5e5] bg-white/80 px-2">
              <TabsList className="inline-flex h-11 w-max min-w-full justify-start gap-0.5 rounded-none bg-transparent p-0">
                {DASHBOARD_TABS.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-none border-b-[3px] border-transparent px-4 text-sm font-medium text-[#666] shadow-none data-[state=active]:border-[#7c3aed] data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-[#7c3aed] data-[state=active]:shadow-none"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </header>

          <FeesFiltersDialog
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            onApply={() => setFilterSummary("AY 2025-26 · B.Com (H) · Sem IV · General")}
            onReset={() => setFilterSummary("AY 2025-26 · All programs · Sem I, IV, VI")}
          />

          <div className="p-3 lg:p-4">
            <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
              <OverviewTab />
            </TabsContent>
            <TabsContent value="enrollment" className="mt-0 focus-visible:outline-none">
              <EnrollmentFeesTab />
            </TabsContent>
            <TabsContent value="collections" className="mt-0 focus-visible:outline-none">
              <CollectionsTab />
            </TabsContent>
            <TabsContent value="transactions" className="mt-0 focus-visible:outline-none">
              <TransactionsTab />
            </TabsContent>
            <TabsContent value="challans" className="mt-0 focus-visible:outline-none">
              <ChallansTab />
            </TabsContent>
            <TabsContent value="structures" className="mt-0 focus-visible:outline-none">
              <FeeStructuresTab />
            </TabsContent>
            <TabsContent value="slabs" className="mt-0 focus-visible:outline-none">
              <FeeSlabsTab />
            </TabsContent>
            <TabsContent value="receipts" className="mt-0 focus-visible:outline-none">
              <ReceiptsTab />
            </TabsContent>
            <TabsContent value="reports" className="mt-0 focus-visible:outline-none">
              <ReportsTab />
            </TabsContent>
            <TabsContent value="realtime" className="mt-0 focus-visible:outline-none">
              <RealtimeTab />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </FeesDashboardProvider>
  );
}
