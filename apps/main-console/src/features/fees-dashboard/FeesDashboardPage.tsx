import { useEffect, useState } from "react";
import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";
import type { AcademicActivityDto } from "@repo/db/dtos/academics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { FeesFiltersDialog } from "./components/FeesFiltersDialog";
import { OverviewTab } from "./tabs/OverviewTab";
import { CollectionsTab } from "./tabs/CollectionsTab";
import { TransactionsTab } from "./tabs/TransactionsTab";
import { ChallansTab } from "./tabs/ChallansTab";
import { FeeStructuresTab } from "./tabs/FeeStructuresTab";
import { FeeSlabsTab } from "./tabs/FeeSlabsTab";
import { EnrollmentFeesTab } from "./tabs/EnrollmentFeesTab";
import { FeesDashboardProvider, useFeesDashboard } from "./context/FeesDashboardContext";
import { LiveUpdatesBadge } from "./components/LiveUpdatesBadge";
import type { FeesDashboardFilters } from "./types/dashboard-api";
import {
  countActiveDashboardFilters,
  DEFAULT_FILTER_LABELS,
  type FeesDashboardFilterLabels,
} from "./utils/filter-utils";
import { getProgramCourseDtos } from "@/services/course-design.api";
import {
  deriveDefaultFiltersFromInProcessScopes,
  type DefaultDashboardFiltersResult,
} from "./utils/scope-filter-defaults";

const DASHBOARD_TABS = [
  { value: "overview", label: "Overview" },
  { value: "enrollment", label: "Enrolment & fees" },
  { value: "collections", label: "Collections" },
  { value: "transactions", label: "Transactions" },
  { value: "challans", label: "Receipts" },
  { value: "structures", label: "Structures" },
  { value: "slabs", label: "Slabs" },
] as const;

function DashboardBootScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 bg-[#eaeaea] p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#7c3aed] border-t-transparent" />
      <p className="text-sm text-[#555]">{message}</p>
    </div>
  );
}

type FeesDashboardContentProps = {
  filters: FeesDashboardFilters;
  filterLabels: FeesDashboardFilterLabels;
  onFiltersChange: (filters: FeesDashboardFilters, labels: FeesDashboardFilterLabels) => void;
  onFiltersReset: () => void;
};

function FeesDashboardContent({
  filters,
  filterLabels,
  onFiltersChange,
  onFiltersReset,
}: FeesDashboardContentProps) {
  const { isSocketConnected, dashboardLoading, masterLoading } = useFeesDashboard();
  const [activeTab, setActiveTab] = useState("overview");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = countActiveDashboardFilters(filterLabels);

  return (
    <div className="min-h-full bg-[#eaeaea]">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <header className="border-b border-[#d1d1d1] bg-gradient-to-r from-[#f5f3ff] via-[#faf5ff] to-white">
          <div className="flex flex-col gap-3 px-4 py-3 pb-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#1a1a1a]">Fees dashboard</h1>
            </div>

            <Button
              size="sm"
              className="relative h-8 shrink-0 rounded-md bg-[#7c3aed] pr-3 text-xs text-white hover:bg-[#6d28d9]"
              onClick={() => setFiltersOpen(true)}
            >
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 ? (
                <Badge
                  variant="secondary"
                  className="ml-1.5 h-5 min-w-5 justify-center rounded-full border-0 bg-white px-1.5 text-[10px] font-bold text-[#7c3aed]"
                >
                  {activeFilterCount}
                </Badge>
              ) : null}
            </Button>
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
          value={filters}
          onApply={onFiltersChange}
          onReset={onFiltersReset}
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
        </div>
      </Tabs>
      <LiveUpdatesBadge connected={isSocketConnected} loading={dashboardLoading || masterLoading} />
    </div>
  );
}

export default function FeesDashboardPage() {
  const { currentAcademicYear, availableAcademicYears, loadAcademicYears } = useAcademicYear();
  const [filters, setFilters] = useState<FeesDashboardFilters>({});
  const [filterLabels, setFilterLabels] =
    useState<FeesDashboardFilterLabels>(DEFAULT_FILTER_LABELS);
  const [filtersReady, setFiltersReady] = useState(false);
  const [filtersInitError, setFiltersInitError] = useState<string | null>(null);

  useEffect(() => {
    if (availableAcademicYears.length === 0) {
      void loadAcademicYears();
    }
  }, [availableAcademicYears.length, loadAcademicYears]);

  const resolveSmartDefaults = async (
    academicYearId: number,
    academicYearLabel: string,
  ): Promise<DefaultDashboardFiltersResult> => {
    const fallback: DefaultDashboardFiltersResult = {
      filters: { academicYearIds: [academicYearId] },
      labels: {
        ...DEFAULT_FILTER_LABELS,
        academicYear: academicYearLabel,
      },
    };

    try {
      const [activitiesRes, programCoursesRes] = await Promise.all([
        axiosInstance.get<ApiResponse<AcademicActivityDto[]>>("/api/academics/academic-activities"),
        getProgramCourseDtos(),
      ]);

      const activities = activitiesRes.data?.payload;
      const programCourses = Array.isArray(programCoursesRes) ? programCoursesRes : [];

      if (Array.isArray(activities)) {
        const fromLiveScopes = deriveDefaultFiltersFromInProcessScopes(
          activities,
          academicYearId,
          academicYearLabel,
          programCourses,
        );
        if (fromLiveScopes) return fromLiveScopes;
      }
    } catch {
      // fall through to academic year only
    }

    return fallback;
  };

  useEffect(() => {
    if (filtersReady) return;

    const defaultYear = currentAcademicYear ?? availableAcademicYears.find((y) => y.isCurrentYear);
    if (!defaultYear?.id) return;

    const academicYearId = defaultYear.id;
    const yearLabel = defaultYear.year ?? "Current academic year";
    let cancelled = false;

    void (async () => {
      setFiltersInitError(null);
      try {
        const resolved = await resolveSmartDefaults(academicYearId, yearLabel);
        if (cancelled) return;
        setFilters(resolved.filters);
        setFilterLabels(resolved.labels);
        setFiltersReady(true);
      } catch {
        if (cancelled) return;
        setFiltersInitError("Could not load semester fee scopes from academic activities.");
        setFilters({ academicYearIds: [academicYearId] });
        setFilterLabels({
          ...DEFAULT_FILTER_LABELS,
          academicYear: yearLabel,
        });
        setFiltersReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentAcademicYear, availableAcademicYears, filtersReady]);

  const applySmartDefaults = async () => {
    const defaultYear = currentAcademicYear ?? availableAcademicYears.find((y) => y.isCurrentYear);
    if (!defaultYear?.id) {
      setFilters({});
      setFilterLabels(DEFAULT_FILTER_LABELS);
      setFiltersReady(false);
      return;
    }

    const academicYearId = defaultYear.id;
    const yearLabel = defaultYear.year ?? "Current academic year";
    const resolved = await resolveSmartDefaults(academicYearId, yearLabel);
    setFilters(resolved.filters);
    setFilterLabels(resolved.labels);
    setFiltersReady(true);
  };

  const handleFiltersChange = (
    nextFilters: FeesDashboardFilters,
    labels: FeesDashboardFilterLabels,
  ) => {
    setFilters(nextFilters);
    setFilterLabels(labels);
  };

  const handleFiltersReset = () => {
    void applySmartDefaults();
  };

  if (!filtersReady) {
    return (
      <DashboardBootScreen
        message={
          filtersInitError ??
          (availableAcademicYears.length === 0
            ? "Loading academic year…"
            : "Loading filters from academic activity scopes…")
        }
      />
    );
  }

  return (
    <FeesDashboardProvider
      filters={filters}
      enabled={filtersReady}
      academicYearLabel={filterLabels.academicYear}
      onScopeFiltersRefresh={(resolved) => {
        setFilters(resolved.filters);
        setFilterLabels(resolved.labels);
      }}
    >
      <FeesDashboardContent
        filters={filters}
        filterLabels={filterLabels}
        onFiltersChange={handleFiltersChange}
        onFiltersReset={handleFiltersReset}
      />
    </FeesDashboardProvider>
  );
}
