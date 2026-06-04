import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { getAllShifts } from "@/services/academic";
import { getAllClasses } from "@/services/classes.service";
import {
  getAffiliations,
  getCourseLevels,
  getProgramCourseDtos,
  getRegulationTypes,
  getStreams,
} from "@/services/course-design.api";
import { getAllCategories } from "@/services/categories.service";
import { getAllReligions } from "@/services/religion.service";
import type { Class } from "@/types/academics/class";
import type { Shift } from "@/types/academics/shift";
import type { ProgramCourseDto } from "@repo/db/dtos/course-design";
import type { AffiliationForTabLabel } from "../utils/affiliation-tab-label";

const STALE_MS = 5 * 60 * 1000;

function toIdNameList<T extends { id?: number; name: string }>(
  items: T[] | null | undefined,
): { id: number; name: string }[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is T & { id: number } => item.id != null)
    .map(({ id, name }) => ({ id, name }));
}

function toRegulationList<T extends { id?: number; name: string; shortName?: string | null }>(
  items: T[] | null | undefined,
): { id: number; name: string; shortName?: string | null }[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is T & { id: number } => item.id != null)
    .map(({ id, name, shortName }) => ({ id, name, shortName }));
}

function toAffiliationList(items: unknown): AffiliationForTabLabel[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter(
      (item): item is { id: number; name: string; shortName?: string | null } =>
        item != null &&
        typeof item === "object" &&
        "id" in item &&
        typeof (item as { id?: unknown }).id === "number" &&
        "name" in item &&
        typeof (item as { name?: unknown }).name === "string",
    )
    .map(({ id, name, shortName }) => ({ id, name, shortName }));
}

export type RealtimeTrackerFilterOptions = {
  classes: Class[];
  shifts: Shift[];
  programCourses: ProgramCourseDto[];
  courseLevels: { id: number; name: string }[];
  regulations: { id: number; name: string; shortName?: string | null }[];
  affiliations: AffiliationForTabLabel[];
  streams: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  religions: { id: number; name: string }[];
};

async function loadRealtimeTrackerFilterOptions(): Promise<RealtimeTrackerFilterOptions> {
  const [
    classes,
    shifts,
    programCourses,
    courseLevels,
    regulations,
    affiliations,
    streams,
    categories,
    religions,
  ] = await Promise.all([
    getAllClasses(),
    getAllShifts(),
    getProgramCourseDtos(),
    getCourseLevels(),
    getRegulationTypes(),
    getAffiliations(),
    getStreams(),
    getAllCategories(),
    getAllReligions(),
  ]);

  return {
    classes: Array.isArray(classes) ? classes : [],
    shifts: Array.isArray(shifts) ? shifts : [],
    programCourses: Array.isArray(programCourses) ? programCourses : [],
    courseLevels: toIdNameList(courseLevels),
    regulations: toRegulationList(regulations),
    affiliations: toAffiliationList(affiliations),
    streams: toIdNameList(streams),
    categories: toIdNameList(categories),
    religions: toIdNameList(religions),
  };
}

export function useRealtimeTrackerFilterOptions(enabled = true) {
  const { isReady, accessToken } = useAuth();
  return useQuery({
    queryKey: ["rt-filter-options"],
    queryFn: loadRealtimeTrackerFilterOptions,
    enabled: enabled && isReady && !!accessToken,
    staleTime: STALE_MS,
    cacheTime: 10 * 60 * 1000,
  });
}
