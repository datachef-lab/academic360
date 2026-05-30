import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";
import type {
  FeesDashboardFilters,
  FeesDashboardPayload,
  FeesDashboardSection,
} from "@/features/fees-dashboard/types/dashboard-api";

const BASE_PATH = "/api/v1/fees/dashboard";

function appendIdList(params: URLSearchParams, key: string, ids?: number[]) {
  if (!ids?.length) return;
  for (const id of ids) {
    params.append(key, String(id));
  }
}

function appendStringList(params: URLSearchParams, key: string, values?: string[]) {
  if (!values?.length) return;
  for (const value of values) {
    params.append(key, value);
  }
}

export async function getFeesDashboard(
  rawFilters: FeesDashboardFilters = {},
  section: FeesDashboardSection = "all",
): Promise<FeesDashboardPayload> {
  const filters = rawFilters ?? {};
  const params = new URLSearchParams();
  appendIdList(params, "academicYearIds", filters.academicYearIds);
  appendIdList(params, "courseLevelIds", filters.courseLevelIds);
  appendIdList(params, "programCourseIds", filters.programCourseIds);
  appendIdList(params, "classIds", filters.classIds);
  appendIdList(params, "shiftIds", filters.shiftIds);
  appendIdList(params, "regulationTypeIds", filters.regulationTypeIds);
  appendIdList(params, "affiliationIds", filters.affiliationIds);
  appendIdList(params, "streamIds", filters.streamIds);
  appendIdList(params, "categoryIds", filters.categoryIds);
  appendIdList(params, "religionIds", filters.religionIds);
  appendStringList(params, "genders", filters.genders);
  appendStringList(params, "paymentStatuses", filters.paymentStatuses);
  appendStringList(params, "paymentModes", filters.paymentModes);
  appendStringList(params, "transactionStatuses", filters.transactionStatuses);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.studentSearch) params.set("studentSearch", filters.studentSearch);
  if (section !== "all") params.set("section", section);

  const qs = params.toString();
  const url = qs ? `${BASE_PATH}?${qs}` : BASE_PATH;
  const response = await axiosInstance.get<ApiResponse<FeesDashboardPayload>>(url);
  const payload = response.data?.payload;
  if (!payload) {
    throw new Error("Fees dashboard response missing payload");
  }
  return payload;
}
