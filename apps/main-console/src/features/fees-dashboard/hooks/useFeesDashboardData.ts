import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";
import type { FeeStructureDto } from "@repo/db/dtos/fees";
import type { AcademicActivityDto } from "@repo/db/dtos/academics";
import type { FeesSlab } from "@/types/fees";
import type { FeeCategoryDto, FeeGroupDto } from "@repo/db/dtos/fees";
import {
  getAllFeeCategories,
  getAllFeeGroups,
  getAllFeesSlabs,
  getAllFeesStructures,
} from "@/services/fees-api";
import { getFeesDashboard } from "@/services/fees-dashboard-api";
import { getProgramCourseDtos } from "@/services/course-design.api";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useSocket } from "@/hooks/useSocket";
import {
  deriveDefaultFiltersFromInProcessScopes,
  type DefaultDashboardFiltersResult,
} from "../utils/scope-filter-defaults";
import {
  countInProcessSemesterFeeScopes,
  isScopeInProcess,
  isSemesterFeePaymentActivity,
} from "../utils/academic-scope-utils";
import { EMPTY_METRIC_VALUES, type MetricValues } from "../data/dashboard-metrics";
import type {
  FeesDashboardFilters,
  FeesDashboardPayload,
  FeesDashboardSocketUpdate,
} from "../types/dashboard-api";
import { hasDashboardScope } from "../utils/filter-utils";

export function countOpenSemesterFeeScopes(
  activities: AcademicActivityDto[],
  academicYearIds?: number[],
): number {
  return countInProcessSemesterFeeScopes(activities, academicYearIds);
}

export type StructurePaymentWindowStatus = "open" | "scheduled" | "closed" | "no_rule";

export function getStructurePaymentWindowStatus(
  structure: FeeStructureDto,
  activities: AcademicActivityDto[],
): StructurePaymentWindowStatus {
  const ayId = structure.academicYear?.id;
  const classId = structure.class?.id;
  const streamId = structure.programCourse?.stream?.id;
  const courseLevelId = structure.programCourse?.courseLevel?.id ?? null;

  if (!ayId || !classId) return "no_rule";

  const matchingActivities = activities.filter((a) => {
    if (!isSemesterFeePaymentActivity(a)) return false;
    if (a.academicYear?.id !== ayId) return false;
    if (a.courseLevelId != null && courseLevelId != null && a.courseLevelId !== courseLevelId) {
      return false;
    }
    return true;
  });

  if (!matchingActivities.length) return "no_rule";

  let anyOpen = false;
  let anyFuture = false;

  for (const activity of matchingActivities) {
    for (const scope of activity.scopes || []) {
      if (!scope.isEnabled) continue;
      if (scope.class?.id !== classId) continue;
      if (streamId != null && scope.stream?.id != null && scope.stream.id !== streamId) continue;

      if (isScopeInProcess(scope)) {
        anyOpen = true;
      } else {
        const start = scope.startDate ? new Date(scope.startDate).getTime() : 0;
        if (Date.now() < start) anyFuture = true;
      }
    }
  }

  if (anyOpen) return "open";
  if (anyFuture) return "scheduled";
  return "closed";
}

export function isStructureOnlineWindowOpen(structure: FeeStructureDto): boolean {
  const now = Date.now();
  const start = structure.onlineStartDate
    ? new Date(structure.onlineStartDate).getTime()
    : structure.startDate
      ? new Date(structure.startDate).getTime()
      : 0;
  const end = structure.onlineEndDate
    ? new Date(structure.onlineEndDate).getTime()
    : structure.endDate
      ? new Date(structure.endDate).getTime()
      : Infinity;
  return now >= start && now <= end;
}

type UseFeesDashboardDataOptions = {
  /** When false, dashboard API is not called (e.g. filters still initializing). */
  enabled?: boolean;
  academicYearLabel?: string;
  onScopeFiltersRefresh?: (resolved: DefaultDashboardFiltersResult) => void;
};

export function useFeesDashboardData(
  rawFilters: FeesDashboardFilters = {},
  options: UseFeesDashboardDataOptions = {},
) {
  const filters = rawFilters ?? {};
  const enabled = options.enabled ?? true;
  const onScopeFiltersRefresh = options.onScopeFiltersRefresh;
  const academicYearLabel = options.academicYearLabel ?? "Current academic year";
  const canFetchDashboard = enabled && hasDashboardScope(filters);
  const { user } = useAuth();
  const userId = user?.id?.toString();

  const [loading, setLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(canFetchDashboard);
  const [error, setError] = useState<string | null>(null);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const [slabs, setSlabs] = useState<FeesSlab[]>([]);
  const [categories, setCategories] = useState<FeeCategoryDto[]>([]);
  const [groups, setGroups] = useState<FeeGroupDto[]>([]);
  const [structures, setStructures] = useState<FeeStructureDto[]>([]);
  const [semesterFeeActivities, setSemesterFeeActivities] = useState<AcademicActivityDto[]>([]);
  const [dashboard, setDashboard] = useState<FeesDashboardPayload | null>(null);
  const [lastSocketUpdate, setLastSocketUpdate] = useState<string | null>(null);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);
  const fetchSeq = useRef(0);
  const masterSeq = useRef(0);

  const fetchMasterData = useCallback(async (opts?: { silent?: boolean }) => {
    const seq = ++masterSeq.current;
    if (!opts?.silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const [slabsRes, categoriesRes, groupsRes, structuresRes, activitiesRes] = await Promise.all([
        getAllFeesSlabs(),
        getAllFeeCategories(),
        getAllFeeGroups(),
        getAllFeesStructures(1, 200),
        axiosInstance.get<ApiResponse<AcademicActivityDto[]>>("/api/academics/academic-activities"),
      ]);

      if (seq !== masterSeq.current) return null;

      setSlabs(Array.isArray(slabsRes.payload) ? slabsRes.payload : []);
      setCategories(Array.isArray(categoriesRes.payload) ? categoriesRes.payload : []);
      setGroups(Array.isArray(groupsRes.payload) ? groupsRes.payload : []);

      const structureRows =
        structuresRes.payload?.content ??
        (structuresRes.payload as { data?: FeeStructureDto[] })?.data;
      setStructures(Array.isArray(structureRows) ? structureRows : []);

      const activities = activitiesRes.data?.payload;
      const semesterActivities = Array.isArray(activities)
        ? activities.filter(isSemesterFeePaymentActivity)
        : [];
      setSemesterFeeActivities(semesterActivities);
      return semesterActivities;
    } catch (e) {
      if (seq === masterSeq.current && !opts?.silent) {
        console.error(e);
        setError("Could not load fees master data");
      }
      return null;
    } finally {
      if (seq === masterSeq.current && !opts?.silent) {
        setLoading(false);
      }
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    if (!canFetchDashboard) {
      setDashboard(null);
      setDashboardLoading(false);
      setDashboardError(null);
      return;
    }

    const seq = ++fetchSeq.current;
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const corePayload = await getFeesDashboard(filters, "core");
      if (seq !== fetchSeq.current) return;
      setDashboard(corePayload);
      setDashboardLoading(false);

      void getFeesDashboard(filters, "reports")
        .then((reportsPayload) => {
          if (seq !== fetchSeq.current) return;
          setDashboard((prev) =>
            prev
              ? {
                  ...prev,
                  challansByProgram: reportsPayload.challansByProgram,
                  enrollmentMatrix: reportsPayload.enrollmentMatrix,
                  slabBreakdown: reportsPayload.slabBreakdown,
                  promotionBreakdown: reportsPayload.promotionBreakdown,
                  updatedAt: reportsPayload.updatedAt,
                }
              : reportsPayload,
          );
        })
        .catch((e) => {
          if (seq !== fetchSeq.current) return;
          console.error("Fees dashboard reports section failed:", e);
        });
    } catch (e) {
      if (seq !== fetchSeq.current) return;
      console.error(e);
      setDashboard(null);
      setDashboardError("Could not load dashboard metrics");
      setDashboardLoading(false);
    }
  }, [filtersKey, filters, canFetchDashboard]);

  useEffect(() => {
    void fetchMasterData();
  }, [fetchMasterData]);

  useEffect(() => {
    if (!canFetchDashboard) {
      setDashboardLoading(false);
      return;
    }
    void fetchDashboard();
  }, [fetchDashboard, canFetchDashboard]);

  const { socket, isConnected, emit: emitSocket } = useSocket({ userId });

  useEffect(() => {
    if (!socket || !isConnected || !enabled) return;

    emitSocket("subscribe_fees_dashboard");

    const handleDashboardUpdate = async (data: FeesDashboardSocketUpdate) => {
      setLastSocketUpdate(data.updatedAt);

      const refreshTasks: Promise<AcademicActivityDto[] | null | void>[] = [
        fetchMasterData({ silent: true }),
      ];
      if (canFetchDashboard) {
        refreshTasks.push(fetchDashboard());
      }
      const [semesterActivities] = await Promise.all(refreshTasks);

      if (
        data.reason === "academic_activity_updated" &&
        onScopeFiltersRefresh &&
        semesterActivities?.length
      ) {
        const academicYearId = filters.academicYearIds?.[0];
        if (academicYearId != null) {
          try {
            const programCourses = await getProgramCourseDtos();
            const resolved = deriveDefaultFiltersFromInProcessScopes(
              semesterActivities,
              academicYearId,
              academicYearLabel,
              Array.isArray(programCourses) ? programCourses : [],
            );
            if (resolved) {
              onScopeFiltersRefresh(resolved);
            }
          } catch (e) {
            console.error("Failed to refresh filters from academic scopes:", e);
          }
        }
      }
    };

    socket.on("fees_dashboard_updated", handleDashboardUpdate);

    return () => {
      socket.off("fees_dashboard_updated", handleDashboardUpdate);
      emitSocket("unsubscribe_fees_dashboard");
    };
  }, [
    socket,
    isConnected,
    enabled,
    emitSocket,
    fetchDashboard,
    fetchMasterData,
    canFetchDashboard,
    onScopeFiltersRefresh,
    filters.academicYearIds,
    academicYearLabel,
  ]);

  const openScopes = countOpenSemesterFeeScopes(semesterFeeActivities, filters.academicYearIds);

  const filteredStructures = useMemo(() => {
    return structures.filter((s) => {
      if (
        filters.academicYearIds?.length &&
        s.academicYear?.id != null &&
        !filters.academicYearIds.includes(s.academicYear.id)
      ) {
        return false;
      }
      if (
        filters.programCourseIds?.length &&
        s.programCourse?.id != null &&
        !filters.programCourseIds.includes(s.programCourse.id)
      ) {
        return false;
      }
      if (
        filters.classIds?.length &&
        s.class?.id != null &&
        !filters.classIds.includes(s.class.id)
      ) {
        return false;
      }
      if (
        filters.shiftIds?.length &&
        s.shift?.id != null &&
        !filters.shiftIds.includes(s.shift.id)
      ) {
        return false;
      }
      if (
        filters.streamIds?.length &&
        s.programCourse?.stream?.id != null &&
        !filters.streamIds.includes(s.programCourse.stream.id)
      ) {
        return false;
      }
      if (
        filters.courseLevelIds?.length &&
        s.programCourse?.courseLevel?.id != null &&
        !filters.courseLevelIds.includes(s.programCourse.courseLevel.id)
      ) {
        return false;
      }
      if (
        filters.regulationTypeIds?.length &&
        s.programCourse?.regulationType?.id != null &&
        !filters.regulationTypeIds.includes(s.programCourse.regulationType.id)
      ) {
        return false;
      }
      if (
        filters.affiliationIds?.length &&
        s.programCourse?.affiliation?.id != null &&
        !filters.affiliationIds.includes(s.programCourse.affiliation.id)
      ) {
        return false;
      }
      return true;
    });
  }, [structures, filters]);

  const metrics: MetricValues = useMemo(() => {
    if (dashboard?.metrics) {
      return {
        ...dashboard.metrics,
        semester_fee_scopes_open: openScopes,
      };
    }

    if (loading || dashboardLoading) {
      return EMPTY_METRIC_VALUES;
    }

    return {
      ...EMPTY_METRIC_VALUES,
      fee_structures_total: filteredStructures.length,
      semester_fee_scopes_open: openScopes,
      fee_slabs_registered: slabs.length,
      fee_categories_count: categories.length,
      fee_groups_count: groups.length,
    };
  }, [
    dashboard,
    loading,
    dashboardLoading,
    filteredStructures.length,
    slabs,
    categories,
    groups,
    openScopes,
  ]);

  return {
    loading: dashboardLoading,
    masterLoading: loading,
    error: error ?? dashboardError,
    slabs,
    categories,
    groups,
    structures: filteredStructures,
    semesterFeeActivities,
    metrics,
    dashboard,
    dashboardLoading,
    dashboardError,
    isSocketConnected: isConnected,
    lastSocketUpdate,
    refetchDashboard: fetchDashboard,
    refetchMasterData: () => fetchMasterData({ silent: true }),
    filters,
  };
}
