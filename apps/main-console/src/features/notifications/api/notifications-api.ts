import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

const BASE = "/api/notifications-console";

export interface NotificationRow {
  id: number;
  variant: string;
  type: string;
  status: "PENDING" | "SENT" | "FAILED";
  sentAt: string | null;
  failedAt: string | null;
  failedReason: string | null;
  createdAt: string;
  masterId: number | null;
  masterName: string | null;
  masterTemplate: string | null;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  userPhone: string | null;
  userWhatsapp: string | null;
  studentUid: string | null;
}

export interface NotificationContentRow {
  field: string | null;
  value: string;
}

export async function getNotificationContents(id: number) {
  const res = await axiosInstance.get<ApiResponse<NotificationContentRow[]>>(
    `${BASE}/${id}/contents`,
  );
  return res.data.payload;
}

export interface NotificationPreview {
  subject: string;
  html: string;
  templateKey: string | null;
  rendered: boolean;
}

export async function getNotificationPreview(id: number) {
  const res = await axiosInstance.get<ApiResponse<NotificationPreview>>(`${BASE}/${id}/preview`);
  return res.data.payload;
}

// ---------------------------------------------------------------------------
// Resend flow
// ---------------------------------------------------------------------------

export type ResendMode = "development" | "staging" | "production";

export interface ResendVerifier {
  userId: number | null;
  name: string;
  type: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
}

export interface ResendRecipient extends ResendVerifier {
  studentUid?: string | null;
  selectable: boolean;
}

export async function getResendVerifiers(id: number) {
  const res = await axiosInstance.get<
    ApiResponse<{ mode: ResendMode; verifiers: ResendVerifier[] }>
  >(`${BASE}/${id}/resend/verifiers`);
  return res.data.payload;
}

export async function startResendOtp(id: number) {
  const res = await axiosInstance.post<
    ApiResponse<{ mode: ResendMode; verifiers: ResendVerifier[]; expiresMinutes: number }>
  >(`${BASE}/${id}/resend/otp`);
  return res.data.payload;
}

export async function verifyResendOtp(id: number, otp: string) {
  const res = await axiosInstance.post<
    ApiResponse<{ token: string; mode: ResendMode; recipients: ResendRecipient[] }>
  >(`${BASE}/${id}/resend/verify`, { otp });
  return res.data.payload;
}

export async function confirmResend(id: number, token: string, selectedUserIds?: number[]) {
  const res = await axiosInstance.post<ApiResponse<{ newNotificationId: number }>>(
    `${BASE}/${id}/resend/confirm`,
    { token, selectedUserIds },
  );
  return res.data.payload;
}

export async function getResendStatus(id: number, newId: number) {
  const res = await axiosInstance.get<
    ApiResponse<{
      status: "PENDING" | "SENT" | "FAILED";
      sentAt: string | null;
      failedReason: string | null;
    }>
  >(`${BASE}/${id}/resend/status`, { params: { newId } });
  return res.data.payload;
}

export interface NotificationListResult {
  rows: NotificationRow[];
  total: number;
  page: number;
  limit: number;
}

export interface NotificationMasterRow {
  id: number;
  name: string;
  variant: string;
  template: string | null;
  previewImage: string | null;
  isActive: boolean;
  isSystemTriggered: boolean;
  createdAt: string | null;
  fieldsCount: number;
  /** Derived: has this master ever sent a notification carrying a file attachment. */
  hasAttachments?: boolean;
}

export interface NotificationMasterField {
  id: number;
  name: string;
  metaId: number | null;
  sequence: number | null;
  flag: boolean | null;
  /** "db" = stored field rows; "template" = derived from the EJS source (read-only). */
  source: "db" | "template";
}

export async function getMasterFields(masterId: number) {
  const res = await axiosInstance.get<ApiResponse<NotificationMasterField[]>>(
    `${BASE}/masters/${masterId}/fields`,
  );
  return res.data.payload;
}

export interface NotificationStats {
  totals: { total: number; sent: number; pending: number; failed: number; today: number };
  byVariant: { variant: string; count: number }[];
  recent: NotificationRow[];
}

export async function listNotifications(params: {
  page?: number;
  limit?: number;
  status?: string;
  variant?: string;
  masterId?: number;
  search?: string;
}) {
  const res = await axiosInstance.get<ApiResponse<NotificationListResult>>(BASE, { params });
  return res.data.payload;
}

export async function listNotificationMasters() {
  const res = await axiosInstance.get<ApiResponse<NotificationMasterRow[]>>(`${BASE}/masters`);
  return res.data.payload;
}

export type MasterPreview =
  | { kind: "IMAGE"; url: string; templateKey: string | null }
  | { kind: "EMAIL"; html: string; templateKey: string | null }
  | { kind: "NONE"; templateKey: string | null };

export async function getMasterPreview(masterId: number) {
  const res = await axiosInstance.get<ApiResponse<MasterPreview>>(
    `${BASE}/masters/${masterId}/preview`,
  );
  return res.data.payload;
}

export async function createNotificationMaster(input: {
  name: string;
  variant: string;
  template?: string | null;
  isActive?: boolean;
  fields?: string[];
}) {
  const res = await axiosInstance.post<ApiResponse<Omit<NotificationMasterRow, "fieldsCount">>>(
    `${BASE}/masters`,
    input,
  );
  return res.data.payload;
}

export async function uploadMasterPreviewImage(masterId: number, file: File) {
  const form = new FormData();
  form.append("image", file);
  const res = await axiosInstance.post<ApiResponse<Omit<NotificationMasterRow, "fieldsCount">>>(
    `${BASE}/masters/${masterId}/preview-image`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.payload;
}

export async function updateNotificationMaster(
  id: number,
  patch: {
    name?: string;
    template?: string | null;
    isActive?: boolean;
    newFields?: string[];
    meta?: Array<{ fieldId: number; sequence: number; flag: boolean }>;
  },
) {
  const res = await axiosInstance.patch<ApiResponse<Omit<NotificationMasterRow, "fieldsCount">>>(
    `${BASE}/masters/${id}`,
    patch,
  );
  return res.data.payload;
}

export async function getNotificationStats() {
  const res = await axiosInstance.get<ApiResponse<NotificationStats>>(`${BASE}/stats`);
  return res.data.payload;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export type DimBucket = { key: string; label: string; count: number };

export interface DashboardFilters {
  academicYearIds?: number[];
  variants?: string[];
  statuses?: string[];
  userTypes?: string[];
  programCourseIds?: number[];
  streamIds?: number[];
  affiliationIds?: number[];
  regulationTypeIds?: number[];
  classIds?: number[];
  shiftIds?: number[];
  days?: number;
}

export interface NotificationDashboard {
  totals: {
    total: number;
    sent: number;
    pending: number;
    failed: number;
    today: number;
    successRate: number;
  };
  byTrigger: { automated: number; eventTriggered: number };
  trend: { date: string; sent: number; failed: number; pending: number }[];
  byVariant: {
    variant: string;
    total: number;
    sent: number;
    failed: number;
    pending: number;
  }[];
  byUserType: DimBucket[];
  byProgramCourse: DimBucket[];
  byClass: DimBucket[];
  byShift: DimBucket[];
  byAcademicYear: DimBucket[];
  byStream: DimBucket[];
  byCourse: DimBucket[];
  byAffiliation: DimBucket[];
  byRegulationType: DimBucket[];
  topMasters: {
    masterId: number | null;
    masterName: string;
    template: string | null;
    variant: string | null;
    total: number;
    sent: number;
    failed: number;
  }[];
  recentFailures: {
    id: number;
    createdAt: string;
    failedAt: string | null;
    failedReason: string | null;
    masterId: number | null;
    masterName: string | null;
    variant: string;
    userName: string | null;
    userEmail: string | null;
    userPhone: string | null;
    userWhatsapp: string | null;
    studentUid: string | null;
  }[];
}

export async function getNotificationDashboard(filters: DashboardFilters) {
  const csv = (a?: (string | number)[]) => (a?.length ? a.join(",") : undefined);
  const res = await axiosInstance.get<ApiResponse<NotificationDashboard>>(`${BASE}/dashboard`, {
    params: {
      academicYearIds: csv(filters.academicYearIds),
      variants: csv(filters.variants),
      statuses: csv(filters.statuses),
      userTypes: csv(filters.userTypes),
      programCourseIds: csv(filters.programCourseIds),
      streamIds: csv(filters.streamIds),
      affiliationIds: csv(filters.affiliationIds),
      regulationTypeIds: csv(filters.regulationTypeIds),
      classIds: csv(filters.classIds),
      shiftIds: csv(filters.shiftIds),
      days: filters.days,
    },
  });
  return res.data.payload;
}

// ---------------------------------------------------------------------------
// Excel downloads (server-generated with ExcelJS)
// ---------------------------------------------------------------------------

async function downloadBlob(url: string, params: Record<string, unknown>, filename: string) {
  const res = await axiosInstance.get(url, { params, responseType: "blob" });
  const blob = new Blob([res.data]);
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadNotificationsExcel(params: {
  status?: string;
  variant?: string;
  masterId?: number;
  search?: string;
}) {
  const stamp = new Date().toISOString().slice(0, 10);
  await downloadBlob(`${BASE}/export`, params, `automated-notifications-${stamp}.xlsx`);
}

export async function downloadMastersExcel() {
  const stamp = new Date().toISOString().slice(0, 10);
  await downloadBlob(`${BASE}/masters/export`, {}, `notification-masters-${stamp}.xlsx`);
}

/**
 * The notification timestamps are PG `timestamp without time zone` holding IST
 * wall-clock; drizzle serializes them with a misleading trailing 'Z'. Display
 * the literal wall-clock by formatting in UTC (same fix as the ID-card page).
 */
export function formatNotificationTime(s: string | null): string {
  if (!s) return "—";
  const d = new Date(s.endsWith("Z") || s.includes("+") ? s : s.replace(" ", "T") + "Z");
  return d.toLocaleString("en-IN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
