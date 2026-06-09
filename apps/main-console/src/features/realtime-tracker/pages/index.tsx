import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MasterLayout from "@/components/layouts/MasterLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Shield, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";
import type { AcademicActivityDto } from "@repo/db/dtos/academics";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useAcademicYear } from "@/hooks/useAcademicYear";
import { useRestrictTempUsers } from "@/hooks/use-restrict-temp-users";
import { getProgramCourseDtos } from "@/services/course-design.api";
import { deriveDefaultFiltersFromInProcessScopes } from "@/features/fees-dashboard/utils/scope-filter-defaults";
import { hasDashboardScope } from "@/features/fees-dashboard/utils/filter-utils";
import { MisTable } from "../components/MisTable";
import { RealtimeTrackerFiltersSidebar } from "../components/RealtimeTrackerFiltersSidebar";
import { FeeMisTab } from "../components/FeeMisTab";
import { useRealtimeTrackerSocket } from "../hooks/useRealtimeTrackerSocket";
import { useRealtimeTrackerFilterOptions } from "../hooks/useRealtimeTrackerFilterOptions";
import { fetchAffiliationRegistration, fetchFeeMis } from "../services/realtime-tracker-api";
import { resolveAffiliationTabLabel } from "../utils/affiliation-tab-label";
import {
  canonicalRealtimeTrackerFilters,
  realtimeTrackerFiltersKey,
  realtimeTrackerFiltersMatch,
} from "../utils/filters-key";
import type {
  AffiliationRegistrationPayload,
  FeeMisPayload,
  RealtimeTrackerFilters,
  RealtimeTrackerTab,
} from "../types/realtime-tracker-types";

function buildFallbackFilters(academicYearId: number): RealtimeTrackerFilters {
  return { academicYearIds: [academicYearId] };
}

type TrackerMainProps = {
  filters: RealtimeTrackerFilters;
  filtersKey: string;
  filtersReady: boolean;
  activeTab: RealtimeTrackerTab;
  onTabChange: (tab: RealtimeTrackerTab) => void;
  affiliationTabLabel: string;
};

function TrackerMain({
  filters,
  filtersKey,
  filtersReady,
  activeTab,
  onTabChange,
  affiliationTabLabel,
}: TrackerMainProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const apiFilters = useMemo(() => canonicalRealtimeTrackerFilters(filters), [filters]);

  const affiliationQuery = useQuery({
    queryKey: ["rt-affiliation", filtersKey],
    queryFn: () => fetchAffiliationRegistration(apiFilters),
    enabled: filtersReady && activeTab === "affiliation",
    staleTime: 30_000,
  });

  const feeMisQuery = useQuery({
    queryKey: ["rt-fee-mis", filtersKey],
    queryFn: () => fetchFeeMis(apiFilters),
    enabled: filtersReady && activeTab === "fee_mis" && hasDashboardScope(apiFilters),
    staleTime: 30_000,
  });

  const handleSocketError = useCallback((msg: string) => {
    toast.error("Realtime connection error", { description: msg });
  }, []);

  const onAffiliationUpdate = useCallback(
    (payload: AffiliationRegistrationPayload) => {
      if (!realtimeTrackerFiltersMatch(payload.filters, apiFilters)) return;
      queryClient.setQueryData(["rt-affiliation", filtersKey], payload);
      setLastUpdate(payload.updatedAt);
    },
    [queryClient, filtersKey, apiFilters],
  );

  const onFeeMisUpdate = useCallback(
    (payload: FeeMisPayload) => {
      if (!realtimeTrackerFiltersMatch(payload.filters, apiFilters)) return;
      queryClient.setQueryData(["rt-fee-mis", filtersKey], payload);
      setLastUpdate(payload.updatedAt);
    },
    [queryClient, filtersKey, apiFilters],
  );

  const onFeeMisRefresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["rt-fee-mis", filtersKey] });
  }, [queryClient, filtersKey]);

  const { isConnected } = useRealtimeTrackerSocket({
    userId: user?.id?.toString(),
    tab: activeTab,
    filters: apiFilters,
    onAffiliationUpdate,
    onFeeMisUpdate,
    onFeeMisRefresh,
    onError: handleSocketError,
  });

  const affiliationData = affiliationQuery.data;
  const feeMisData = feeMisQuery.data;

  useEffect(() => {
    if (affiliationData?.updatedAt) setLastUpdate(affiliationData.updatedAt);
  }, [affiliationData?.updatedAt]);

  useEffect(() => {
    if (feeMisData?.updatedAt) setLastUpdate(feeMisData.updatedAt);
  }, [feeMisData?.updatedAt]);

  const misTableData = useMemo(() => {
    if (!affiliationData) return null;
    return { updatedAt: affiliationData.updatedAt, data: affiliationData.data };
  }, [affiliationData]);

  const affiliationLoading =
    filtersReady && activeTab === "affiliation" && affiliationQuery.isLoading && !affiliationData;
  const feeMisLoading =
    filtersReady && activeTab === "fee_mis" && feeMisQuery.isLoading && !feeMisData;

  const affiliationError =
    activeTab === "affiliation" && affiliationQuery.isError
      ? ((affiliationQuery.error as Error)?.message ?? "Failed to load data")
      : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#eaeaea]">
      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as RealtimeTrackerTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="shrink-0 border-b bg-white px-2 pb-[8px]">
          <TabsList className="h-10 bg-transparent">
            <TabsTrigger value="affiliation" className="text-sm">
              {affiliationTabLabel}
            </TabsTrigger>
            <TabsTrigger value="fee_mis" className="text-sm">
              Fee MIS
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="affiliation"
          className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <div className="flex min-h-0 flex-1 flex-col bg-white">
            {!filtersReady ? (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Preparing filters…
              </div>
            ) : affiliationError ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 px-4 text-center text-sm text-red-600">
                <p>{affiliationError}</p>
                <button
                  type="button"
                  className="text-xs underline"
                  onClick={() => affiliationQuery.refetch()}
                >
                  Retry
                </button>
              </div>
            ) : misTableData && !affiliationQuery.isFetching ? (
              <MisTable data={misTableData} />
            ) : affiliationQuery.isFetching ? (
              <MisTable data={misTableData ?? { updatedAt: "", data: [] }} isLoading />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                {affiliationLoading ? "Loading…" : "No data"}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="fee_mis"
          className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <div className="min-h-0 flex-1 overflow-auto bg-white">
            {!hasDashboardScope(apiFilters) ? (
              <div className="flex min-h-[400px] items-center justify-center px-4 text-center text-sm text-muted-foreground">
                Select at least one filter (e.g. academic year or semester) to load Fee MIS.
              </div>
            ) : (
              <FeeMisTab
                data={feeMisData ?? null}
                isLoading={feeMisLoading || feeMisQuery.isFetching}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="shrink-0 border-t bg-white px-4 py-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Staff online: {isConnected && (user?.type === "ADMIN" || user?.type === "STAFF") ? 1 : 0}
        </span>
        <span className="flex items-center gap-1">
          <GraduationCap className="h-3 w-3" />
          Students online: {isConnected && user?.type === "STUDENT" ? 1 : 0}
        </span>
        {lastUpdate ? (
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Updated {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        ) : null}
      </div>

      {isConnected ? (
        <div className="fixed bottom-3 right-3 z-50 sm:bottom-4 sm:right-4">
          <div className="flex items-center gap-2 rounded-lg bg-red-600 px-2 py-1.5 text-white shadow-lg sm:px-3 sm:py-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white sm:h-2 sm:w-2" />
            <span className="text-xs font-medium sm:text-sm">Live Updates</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function RealTimeTrackerPage() {
  useRestrictTempUsers();
  const { user } = useAuth();
  const { currentAcademicYear, availableAcademicYears, loadAcademicYears } = useAcademicYear();
  const [activeTab, setActiveTab] = useState<RealtimeTrackerTab>("affiliation");
  const [filters, setFilters] = useState<RealtimeTrackerFilters>({});
  const [filtersReady, setFiltersReady] = useState(false);

  const filtersKey = useMemo(() => realtimeTrackerFiltersKey(filters), [filters]);

  const filterOptionsQuery = useRealtimeTrackerFilterOptions(!!user);

  useEffect(() => {
    if (availableAcademicYears.length === 0) void loadAcademicYears();
  }, [availableAcademicYears.length, loadAcademicYears]);

  const resolveSmartDefaults = useCallback(
    async (academicYearId: number, academicYearLabel: string) => {
      try {
        const [activitiesRes, programCourses] = await Promise.all([
          axiosInstance.get<ApiResponse<AcademicActivityDto[]>>(
            "/api/academics/academic-activities",
          ),
          getProgramCourseDtos(),
        ]);
        const activities = activitiesRes.data?.payload;
        if (Array.isArray(activities)) {
          const fromScopes = deriveDefaultFiltersFromInProcessScopes(
            activities,
            academicYearId,
            academicYearLabel,
            Array.isArray(programCourses) ? programCourses : [],
          );
          if (fromScopes) return fromScopes.filters;
        }
      } catch {
        // fall through
      }
      return buildFallbackFilters(academicYearId);
    },
    [],
  );

  useEffect(() => {
    if (filtersReady) return;
    const defaultYear = currentAcademicYear ?? availableAcademicYears.find((y) => y.isCurrentYear);
    const yearId = defaultYear?.id;
    if (yearId == null) return;

    let cancelled = false;
    void (async () => {
      const resolved = await resolveSmartDefaults(
        yearId,
        defaultYear?.year ?? "Current academic year",
      );
      if (cancelled) return;
      setFilters(resolved);
      setFiltersReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [currentAcademicYear, availableAcademicYears, filtersReady, resolveSmartDefaults]);

  const affiliationTabLabel = useMemo(
    () =>
      resolveAffiliationTabLabel(
        filters.affiliationIds,
        filterOptionsQuery.data?.affiliations ?? [],
      ),
    [filters.affiliationIds, filterOptionsQuery.data?.affiliations],
  );

  const handleResetFilters = useCallback(() => {
    const defaultYear = currentAcademicYear ?? availableAcademicYears.find((y) => y.isCurrentYear);
    if (!defaultYear?.id) {
      setFilters({});
      return;
    }
    void resolveSmartDefaults(defaultYear.id, defaultYear?.year ?? "Current academic year").then(
      setFilters,
    );
  }, [currentAcademicYear, availableAcademicYears, resolveSmartDefaults]);

  if (!user) {
    return (
      <MasterLayout hideRightBar>
        <div className="flex min-h-[50vh] items-center justify-center p-8 text-center text-muted-foreground">
          Please log in to use the realtime tracker.
        </div>
      </MasterLayout>
    );
  }

  return (
    <MasterLayout
      rightBarContent={
        <RealtimeTrackerFiltersSidebar
          value={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
          showPaymentFilters={activeTab === "fee_mis"}
        />
      }
      rightBarHeader="Filters"
    >
      <TrackerMain
        filters={filters}
        filtersKey={filtersKey}
        filtersReady={filtersReady}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        affiliationTabLabel={affiliationTabLabel}
      />
    </MasterLayout>
  );
}
