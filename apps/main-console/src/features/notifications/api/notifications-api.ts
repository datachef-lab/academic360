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
// Notification Events (scoped bulk campaigns)
// ---------------------------------------------------------------------------

export interface EventScope {
  academicYearId?: number | null;
  programCourseId?: number | null;
  classId?: number | null;
  shiftIds?: number[];
  sectionIds?: number[];
  genders?: string[];
  religionIds?: number[];
  categoryIds?: number[];
  quotaTypeIds?: number[];
}

export interface NotificationEventRow {
  id: number;
  name: string;
  description: string | null;
  remarks: string | null;
  variant: string | null;
  status: "DRAFT" | "READY" | "TRIGGERED";
  dataSourceMode: string | null;
  masterId: number | null;
  masterName: string | null;
  uploadSummary: { matched: number; unmatched: string[] } | null;
  createdAt: string | null;
  total: number;
  sent: number;
  failed: number;
}

export interface EventRecipientRow {
  uid: string | null;
  name: string | null;
  whatsapp: string | null;
  email: string | null;
  status: string | null;
  values: Record<string, string>;
}

export async function getEventRecipientsList(id: number) {
  const res = await axiosInstance.get<
    ApiResponse<{ fields: string[]; recipients: EventRecipientRow[]; triggered: boolean }>
  >(`${BASE}/events/${id}/recipients`);
  return res.data.payload;
}

export interface NotificationEventDetail extends NotificationEventRow {
  notificationMasterId: number | null;
  recipientsFileKey: string | null;
  scope: EventScope;
}

export async function listNotificationEvents(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const res = await axiosInstance.get<
    ApiResponse<{ rows: NotificationEventRow[]; total: number; page: number; limit: number }>
  >(`${BASE}/events`, { params });
  return res.data.payload;
}

export async function getNotificationEvent(id: number) {
  const res = await axiosInstance.get<ApiResponse<NotificationEventDetail>>(`${BASE}/events/${id}`);
  return res.data.payload;
}

export async function createNotificationEvent(input: {
  name: string;
  description?: string | null;
  remarks?: string | null;
  notificationMasterId: number;
  variant: string;
  dataSourceMode?: string;
  scope: EventScope;
  /** S3 key from parseEventRecipients — creates the event as READY. */
  recipientsFileKey?: string | null;
}) {
  const res = await axiosInstance.post<ApiResponse<NotificationEventRow & { id: number }>>(
    `${BASE}/events`,
    input,
  );
  return res.data.payload;
}

export async function updateNotificationEvent(
  id: number,
  input: Partial<{
    name: string;
    description: string | null;
    remarks: string | null;
    variant: string;
    dataSourceMode: string;
    scope: EventScope;
  }>,
) {
  const res = await axiosInstance.patch<ApiResponse<NotificationEventRow>>(
    `${BASE}/events/${id}`,
    input,
  );
  return res.data.payload;
}

export async function deleteNotificationEvent(id: number) {
  await axiosInstance.delete(`${BASE}/events/${id}`);
}

export async function resolveEventScope(id: number) {
  const res = await axiosInstance.get<
    ApiResponse<{ count: number; sample: { uid: string; name: string | null }[] }>
  >(`${BASE}/events/${id}/recipients/resolve`);
  return res.data.payload;
}

export async function downloadEventTemplate(id: number) {
  await downloadBlob(`${BASE}/events/${id}/recipients/template`, {}, `event-${id}-recipients.xlsx`);
}

export interface EventParseResult {
  fileKey: string;
  matched: number;
  /** uids with no student record. */
  unknownUids: string[];
  /** uids whose student has no active promotion (not currently enrolled). */
  notEnrolled: string[];
  fields: string[];
  sample: {
    uid: string;
    userId: number | null;
    name: string | null;
    whatsapp: string | null;
    values: Record<string, string>;
  }[];
}

/** Parse + stage a recipient sheet WITHOUT an event (wizard pre-confirmation). */
export async function parseEventRecipients(masterId: number, file: File) {
  const form = new FormData();
  form.append("file", file);
  form.append("masterId", String(masterId));
  const res = await axiosInstance.post<ApiResponse<EventParseResult>>(
    `${BASE}/events/parse`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.payload;
}

export async function uploadEventRecipients(id: number, file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await axiosInstance.post<ApiResponse<EventParseResult>>(
    `${BASE}/events/${id}/recipients/upload`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.payload;
}

/** Headers-only template for a master (no event needed). */
export async function downloadMasterTemplate(masterId: number) {
  await downloadBlob(`${BASE}/events/template`, { masterId }, `event-recipients-template.xlsx`);
}

/** Resolve a scope preview without an event row. */
export async function resolveScopePreview(scope: EventScope) {
  const res = await axiosInstance.post<
    ApiResponse<{ count: number; sample: { uid: string; name: string | null }[] }>
  >(`${BASE}/events/resolve`, { scope });
  return res.data.payload;
}

export interface EventSendPreview {
  mode: "development" | "staging" | "production";
  cap: number | null;
  targets: {
    userId: number | null;
    name: string;
    type: string | null;
    email: string | null;
    phone: string | null;
    whatsapp: string | null;
  }[];
}

/** Where a send actually goes in this environment + the test cap. */
export async function getEventSendPreview() {
  const res = await axiosInstance.get<ApiResponse<EventSendPreview>>(`${BASE}/events/send/preview`);
  return res.data.payload;
}

export async function triggerNotificationEvent(id: number, token: string, staffUserIds?: number[]) {
  const res = await axiosInstance.post<
    ApiResponse<{ enqueued: number; failed: number; capped: boolean; totalRecipients: number }>
  >(`${BASE}/events/${id}/trigger`, { token, staffUserIds });
  return res.data.payload;
}

/** Re-enqueue the failed recipients of a triggered event (send-OTP token). */
export async function resendEventFailed(id: number, token: string, staffUserIds?: number[]) {
  const res = await axiosInstance.post<
    ApiResponse<{ enqueued: number; failed: number; capped: boolean; totalRecipients: number }>
  >(`${BASE}/events/${id}/resend`, { token, staffUserIds });
  return res.data.payload;
}

/** Download the failed recipients as Excel. */
export async function downloadEventFailed(id: number) {
  await downloadBlob(`${BASE}/events/${id}/failed.xlsx`, {}, `event-${id}-failed.xlsx`);
}

export async function getEventStatus(id: number) {
  const res = await axiosInstance.get<
    ApiResponse<{ total: number; sent: number; pending: number; failed: number }>
  >(`${BASE}/events/${id}/status`);
  return res.data.payload;
}

// Verifier-OTP gate — only sending is verification-gated (per-user action key,
// so the wizard can verify before the event exists).
export async function startEventSendOtp() {
  const res = await axiosInstance.post<
    ApiResponse<{ mode: ResendMode; verifiers: ResendVerifier[]; expiresMinutes: number }>
  >(`${BASE}/events/send/otp`);
  return res.data.payload;
}
export async function verifyEventSendOtp(otp: string) {
  const res = await axiosInstance.post<ApiResponse<{ token: string }>>(
    `${BASE}/events/send/verify`,
    { otp },
  );
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
