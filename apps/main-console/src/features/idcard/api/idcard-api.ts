import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";
import {
  IdCardIssue,
  IdCardIssueCreatePayload,
  IdCardIssueStatus,
  IdCardTemplate,
  IdCardTemplateField,
  IdCardTemplateFieldUpsertPayload,
  IdCardTemplateUpsertPayload,
} from "../types";

const BASE = "/api/idcard";

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
  page: number;
  limit: number;
}

const appendFormValues = (fd: FormData, payload: Partial<IdCardTemplateUpsertPayload>) => {
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value === null) fd.append(key, "");
    else fd.append(key, String(value));
  });
};

export async function listTemplates(params: {
  academicYearId?: number;
  search?: string;
  page?: number;
  limit?: number;
  includeDisabled?: boolean;
}) {
  const res = await axiosInstance.get<ApiResponse<PaginatedResult<IdCardTemplate>>>(
    `${BASE}/templates`,
    { params },
  );
  return res.data.payload;
}

// Image blobs may 404/500 when the S3 object is missing (e.g. an old card whose
// image lives under a different root folder, or a not-yet-uploaded asset). These
// are optional/previews — skip the global error toast; callers show an empty slot.
type BlobGetConfig = Parameters<typeof axiosInstance.get>[1] & {
  _skipGlobalErrorHandler?: boolean;
};

export async function fetchTemplateImageBlob(id: number): Promise<Blob> {
  const res = await axiosInstance.get(`${BASE}/templates/${id}/image`, {
    responseType: "blob",
    _skipGlobalErrorHandler: true,
  } as BlobGetConfig);
  return res.data as Blob;
}

export async function fetchTemplateBacksideBlob(id: number): Promise<Blob> {
  const res = await axiosInstance.get(`${BASE}/templates/${id}/backside`, {
    responseType: "blob",
    _skipGlobalErrorHandler: true,
  } as BlobGetConfig);
  return res.data as Blob;
}

const assertImageBlob = (blob: Blob, label: string): Blob => {
  if (!blob.size || blob.type.includes("json") || blob.type.includes("html")) {
    throw new Error(`Invalid ${label} image response.`);
  }
  return blob;
};

export async function fetchIssuePhotoBlob(issueId: number): Promise<Blob> {
  const res = await axiosInstance.get(`${BASE}/issues/${issueId}/photo`, {
    responseType: "blob",
    _skipGlobalErrorHandler: true,
  } as BlobGetConfig);
  return assertImageBlob(res.data as Blob, "photo");
}

export async function fetchIssueFrontBlob(issueId: number): Promise<Blob> {
  const res = await axiosInstance.get(`${BASE}/issues/${issueId}/front`, {
    responseType: "blob",
    _skipGlobalErrorHandler: true,
  } as BlobGetConfig);
  return assertImageBlob(res.data as Blob, "front");
}

export async function getTemplate(id: number) {
  const res = await axiosInstance.get<ApiResponse<IdCardTemplate>>(`${BASE}/templates/${id}`);
  return res.data.payload;
}

export async function createTemplate(
  payload: IdCardTemplateUpsertPayload,
  templateImage: File,
  backsideImage?: File | null,
) {
  const fd = new FormData();
  appendFormValues(fd, payload);
  fd.append("templateImage", templateImage);
  if (backsideImage) fd.append("backsideImage", backsideImage);
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(`${BASE}/templates`, fd);
  return res.data.payload;
}

export async function updateTemplate(
  id: number,
  payload: IdCardTemplateUpsertPayload,
  templateImage?: File | null,
  backsideImage?: File | null,
) {
  const fd = new FormData();
  appendFormValues(fd, payload);
  if (templateImage) fd.append("templateImage", templateImage);
  if (backsideImage) fd.append("backsideImage", backsideImage);
  const res = await axiosInstance.put<ApiResponse<{ id: number }>>(`${BASE}/templates/${id}`, fd);
  return res.data.payload;
}

export async function deleteTemplate(id: number) {
  await axiosInstance.delete(`${BASE}/templates/${id}`);
}

export async function listTemplateFields(templateId: number) {
  const res = await axiosInstance.get<ApiResponse<IdCardTemplateField[]>>(
    `${BASE}/templates/${templateId}/fields`,
  );
  return res.data.payload;
}

export async function upsertTemplateFields(
  templateId: number,
  fields: IdCardTemplateFieldUpsertPayload[],
) {
  const res = await axiosInstance.put<ApiResponse<IdCardTemplateField[]>>(
    `${BASE}/templates/${templateId}/fields`,
    { fields },
  );
  return res.data.payload;
}

export async function listIssues(params: {
  search?: string;
  studentId?: number;
  issueStatus?: IdCardIssueStatus;
  page?: number;
  limit?: number;
}) {
  const res = await axiosInstance.get<ApiResponse<PaginatedResult<IdCardIssue>>>(`${BASE}/issues`, {
    params,
  });
  return res.data.payload;
}

export async function getIssue(id: number) {
  const res = await axiosInstance.get<ApiResponse<IdCardIssue>>(`${BASE}/issues/${id}`);
  return res.data.payload;
}

export async function getMostRecentIssueForStudent(studentId: number) {
  const res = await axiosInstance.get<ApiResponse<IdCardIssue | null>>(
    `${BASE}/students/${studentId}/most-recent-issue`,
  );
  return res.data.payload;
}

export interface IdCardValidity {
  validTill: string | null; // DD-MM-YYYY
  dateOfJoining: string | null; // DD-MM-YYYY (Sem-1)
  durationYears: number | null;
  // Registration academic year id = academic year of the Sem-1 promotion's
  // session. Used to pick the ID-card template for this student.
  registrationAcademicYearId: number | null;
}

export async function getStudentIdCardValidity(studentId: number) {
  const res = await axiosInstance.get<ApiResponse<IdCardValidity>>(
    `${BASE}/students/${studentId}/validity`,
  );
  return res.data.payload;
}

export async function createIssue(
  payload: IdCardIssueCreatePayload,
  files: { frontImage?: Blob | File; photoImage?: Blob | File },
) {
  const fd = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    fd.append(key, String(value));
  });
  if (files.frontImage) {
    const f =
      files.frontImage instanceof File
        ? files.frontImage
        : new File([files.frontImage], "front.png", { type: "image/png" });
    fd.append("frontImage", f);
  }
  if (files.photoImage) {
    const f =
      files.photoImage instanceof File
        ? files.photoImage
        : new File([files.photoImage], "photo.png", { type: "image/png" });
    fd.append("photoImage", f);
  }
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(`${BASE}/issues`, fd);
  return res.data.payload;
}

export async function deleteIssue(id: number) {
  await axiosInstance.delete(`${BASE}/issues/${id}`);
}

export interface RfidConflict {
  uid: string | null;
  name: string | null;
}

/** Live RFID uniqueness check for the finalize dialog. */
export async function checkRfid(rfid: string, studentId: number) {
  const res = await axiosInstance.get<
    ApiResponse<{ available: boolean; conflict: RfidConflict | null }>
  >(`${BASE}/rfid/check`, { params: { rfid, studentId } });
  return res.data.payload;
}

export interface FinalizeIssuePayload {
  rfidNumber: string;
  issueStatus: Exclude<IdCardIssueStatus, "DRAFT">;
  remarks?: string | null;
  renewedFromIssueId?: number | null;
}

/** Finalize a DRAFT issue (set type, rfid, saved_at). */
export async function finalizeIssue(issueId: number, payload: FinalizeIssuePayload) {
  const res = await axiosInstance.patch<ApiResponse<{ id: number }>>(
    `${BASE}/issues/${issueId}/finalize`,
    payload,
  );
  return res.data.payload;
}

export async function listReportDates() {
  const res = await axiosInstance.get<ApiResponse<{ dates: string[] }>>(`${BASE}/reports/dates`);
  return res.data.payload.dates;
}

export function reportExcelUrl(date: string) {
  return `${BASE}/reports/excel?date=${encodeURIComponent(date)}`;
}

export function reportZipUrl(date: string) {
  return `${BASE}/reports/zip?date=${encodeURIComponent(date)}`;
}

function triggerBlobDownload(data: BlobPart, filename: string) {
  const url = URL.createObjectURL(new Blob([data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadReport(kind: "excel" | "zip", date: string, filename: string) {
  const res = await axiosInstance.get(`${BASE}/reports/${kind}`, {
    params: { date },
    responseType: "blob",
  });
  triggerBlobDownload(res.data, filename);
}

/** Audit report over an OPTIONAL issue-date range (omit both = all cards). */
export async function downloadAuditReport(from: string, to: string, filename: string) {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await axiosInstance.get(`${BASE}/reports/audit`, {
    params,
    responseType: "blob",
  });
  triggerBlobDownload(res.data, filename);
}

// ── Realtime dashboard ──────────────────────────────────────────────────────

export interface IdCardDashboardFilters {
  academicYearIds?: number[];
  programCourseIds?: number[];
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}

export interface IdCardNameValue {
  name: string;
  value: number;
}
export interface IdCardDayCount {
  date: string;
  count: number;
}
export interface IdCardHourCount {
  hour: number;
  count: number;
}
export interface IdCardRecentIssue {
  id: number;
  studentName: string | null;
  uid: string | null;
  course: string | null;
  rfidNumber: string | null;
  issueStatus: string;
  issuedBy: string | null;
  issuedAt: string | null;
}

export interface IdCardDashboardStats {
  kpis: {
    totalIssued: number;
    issuedToday: number;
    draftsPending: number;
    printedNotSaved: number;
    legacyCount: number;
    newCount: number;
    studentsWithCard: number;
  };
  byStatus: IdCardNameValue[];
  perDay: IdCardDayCount[];
  byHour: IdCardHourCount[];
  byProgramCourse: IdCardNameValue[];
  byAcademicYear: IdCardNameValue[];
  byTemplate: IdCardNameValue[];
  topOperators: IdCardNameValue[];
  recent: IdCardRecentIssue[];
  templates: { total: number; active: number; disabled: number };
}

export async function getIdCardDashboardStats(filters: IdCardDashboardFilters) {
  const params = new URLSearchParams();
  filters.academicYearIds?.forEach((id) => params.append("academicYearIds", String(id)));
  filters.programCourseIds?.forEach((id) => params.append("programCourseIds", String(id)));
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const qs = params.toString();
  const res = await axiosInstance.get<ApiResponse<IdCardDashboardStats>>(
    `${BASE}/dashboard/stats${qs ? `?${qs}` : ""}`,
  );
  return res.data.payload;
}

/** ZIP of each card's front image named <rfid>.png, over the OPTIONAL range. */
export async function downloadAuditZip(from: string, to: string, filename: string) {
  const params: Record<string, string> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await axiosInstance.get(`${BASE}/reports/audit-zip`, {
    params,
    responseType: "blob",
  });
  triggerBlobDownload(res.data, filename);
}
