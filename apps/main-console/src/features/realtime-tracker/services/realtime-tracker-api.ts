import api from "@/utils/api";
import type {
  AffiliationRegistrationPayload,
  FeeMisPayload,
  RealtimeTrackerFilters,
} from "../types/realtime-tracker-types";

function filtersToParams(filters: RealtimeTrackerFilters): URLSearchParams {
  const params = new URLSearchParams();
  const appendIds = (key: string, ids?: number[]) => {
    if (ids?.length) params.set(key, ids.join(","));
  };
  const appendStrings = (key: string, vals?: string[]) => {
    if (vals?.length) params.set(key, vals.join(","));
  };

  appendIds("academicYearIds", filters.academicYearIds);
  appendIds("sessionIds", filters.sessionIds);
  appendIds("programCourseIds", filters.programCourseIds);
  appendIds("classIds", filters.classIds);
  appendIds("shiftIds", filters.shiftIds);
  appendIds("streamIds", filters.streamIds);
  appendIds("courseLevelIds", filters.courseLevelIds);
  appendIds("regulationTypeIds", filters.regulationTypeIds);
  appendIds("affiliationIds", filters.affiliationIds);
  appendIds("categoryIds", filters.categoryIds);
  appendIds("religionIds", filters.religionIds);
  appendStrings("genders", filters.genders);
  appendStrings("paymentStatuses", filters.paymentStatuses);
  appendStrings("paymentModes", filters.paymentModes);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  return params;
}

export async function fetchAffiliationRegistration(
  filters: RealtimeTrackerFilters,
): Promise<AffiliationRegistrationPayload> {
  const params = filtersToParams(filters);
  const res = await api.get(
    `/api/v1/realtime-tracker/affiliation-registration?${params.toString()}`,
  );
  return res.data.payload as AffiliationRegistrationPayload;
}

export async function fetchFeeMis(filters: RealtimeTrackerFilters): Promise<FeeMisPayload> {
  const params = filtersToParams(filters);
  const res = await api.get(`/api/v1/realtime-tracker/fee-mis?${params.toString()}`);
  return res.data.payload as FeeMisPayload;
}
