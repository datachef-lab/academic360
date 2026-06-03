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
    courseLevels: Array.isArray(courseLevels) ? courseLevels : [],
    regulations: Array.isArray(regulations) ? regulations : [],
    affiliations: Array.isArray(affiliations) ? affiliations : [],
    streams: Array.isArray(streams) ? streams : [],
    categories: Array.isArray(categories) ? categories : [],
    religions: Array.isArray(religions) ? religions : [],
  };
}

export function useRealtimeTrackerFilterOptions(enabled = true) {
  const { isReady, accessToken } = useAuth();
  return useQuery({
    queryKey: ["rt-filter-options"],
    queryFn: loadRealtimeTrackerFilterOptions,
    enabled: enabled && isReady && !!accessToken,
    staleTime: STALE_MS,
    gcTime: 10 * 60 * 1000,
  });
}
