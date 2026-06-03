import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";
import type { FeeStructureDto } from "@academic/db/dtos/fees";
import type { AcademicActivityDto } from "@academic/db/dtos/academics";
import type { FeesSlab } from "@/types/fees";
import type { FeeCategoryDto, FeeGroupDto } from "@academic/db/dtos/fees";
import {
  getAllFeeCategories,
  getAllFeeGroups,
  getAllFeesSlabs,
  getAllFeesStructures,
} from "@/services/fees-api";
import { SEMESTER_FEE_PAYMENT_MASTER_NAME } from "../data/fees-domain";
import {
  MOCK_METRIC_VALUES,
  type MetricValues,
} from "../data/dashboard-metrics";

function isSemesterFeePaymentActivity(activity: AcademicActivityDto): boolean {
  return (
    Boolean(activity.master?.isActive) &&
    (activity.master?.name || "").trim().toLowerCase() ===
      SEMESTER_FEE_PAYMENT_MASTER_NAME
  );
}

export function countOpenSemesterFeeScopes(
  activities: AcademicActivityDto[],
): number {
  const now = Date.now();
  return activities
    .filter(isSemesterFeePaymentActivity)
    .flatMap((a) => a.scopes || [])
    .filter((scope) => {
      if (!scope.isEnabled) return false;
      const start = scope.startDate ? new Date(scope.startDate).getTime() : 0;
      const end = scope.endDate ? new Date(scope.endDate).getTime() : Infinity;
      return now >= start && now <= end;
    }).length;
}

export type StructurePaymentWindowStatus =
  | "open"
  | "scheduled"
  | "closed"
  | "no_rule";

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
    if (
      a.courseLevelId != null &&
      courseLevelId != null &&
      a.courseLevelId !== courseLevelId
    ) {
      return false;
    }
    return true;
  });

  if (!matchingActivities.length) return "no_rule";

  const now = Date.now();
  let anyOpen = false;
  let anyFuture = false;

  for (const activity of matchingActivities) {
    for (const scope of activity.scopes || []) {
      if (!scope.isEnabled) continue;
      if (scope.class?.id !== classId) continue;
      if (
        streamId != null &&
        scope.stream?.id != null &&
        scope.stream.id !== streamId
      )
        continue;

      const start = scope.startDate ? new Date(scope.startDate).getTime() : 0;
      const end = scope.endDate ? new Date(scope.endDate).getTime() : Infinity;
      if (now >= start && now <= end) anyOpen = true;
      if (now < start) anyFuture = true;
    }
  }

  if (anyOpen) return "open";
  if (anyFuture) return "scheduled";
  return "closed";
}

export function isStructureOnlineWindowOpen(
  structure: FeeStructureDto,
): boolean {
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

export function useFeesDashboardData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slabs, setSlabs] = useState<FeesSlab[]>([]);
  const [categories, setCategories] = useState<FeeCategoryDto[]>([]);
  const [groups, setGroups] = useState<FeeGroupDto[]>([]);
  const [structures, setStructures] = useState<FeeStructureDto[]>([]);
  const [semesterFeeActivities, setSemesterFeeActivities] = useState<
    AcademicActivityDto[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [
          slabsRes,
          categoriesRes,
          groupsRes,
          structuresRes,
          activitiesRes,
        ] = await Promise.all([
          getAllFeesSlabs(),
          getAllFeeCategories(),
          getAllFeeGroups(),
          getAllFeesStructures(1, 200),
          axiosInstance.get<ApiResponse<AcademicActivityDto[]>>(
            "/api/academics/academic-activities",
          ),
        ]);

        if (cancelled) return;

        setSlabs(Array.isArray(slabsRes.payload) ? slabsRes.payload : []);
        setCategories(
          Array.isArray(categoriesRes.payload) ? categoriesRes.payload : [],
        );
        setGroups(Array.isArray(groupsRes.payload) ? groupsRes.payload : []);

        const structureRows =
          structuresRes.payload?.content ??
          (structuresRes.payload as { data?: FeeStructureDto[] })?.data;
        setStructures(Array.isArray(structureRows) ? structureRows : []);

        const activities = activitiesRes.data?.payload;
        const allActivities = Array.isArray(activities) ? activities : [];
        setSemesterFeeActivities(
          allActivities.filter(isSemesterFeePaymentActivity),
        );
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError("Could not load fees master data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const metrics: MetricValues = useMemo(() => {
    if (loading || error) {
      return MOCK_METRIC_VALUES;
    }

    const openScopes = countOpenSemesterFeeScopes(semesterFeeActivities);

    return {
      ...MOCK_METRIC_VALUES,
      fee_structures_total: structures.length,
      semester_fee_scopes_open: openScopes,
      fee_slabs_registered: slabs.length,
      fee_categories_count: categories.length,
      fee_groups_count: groups.length,
    };
  }, [
    loading,
    error,
    structures,
    slabs,
    categories,
    groups,
    semesterFeeActivities,
  ]);

  return {
    loading,
    error,
    slabs,
    categories,
    groups,
    structures,
    semesterFeeActivities,
    metrics,
  };
}
