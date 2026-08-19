import { axiosInstance } from "@/lib/utils";
import { ApiResponse } from "@/types/api-response";

const BASE = "/api/service-requests";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ServiceType {
  id: number;
  code: string;
  name: string;
  departmentId: number;
  slaDays: number;
  requiresPhysicalPresenceDefault: boolean;
  requiresIdProof: boolean;
  isActive: boolean;
}

export interface AlumniIntakePayload {
  fullName: string;
  yearOfPassing: string;
  courseStream: string;
  universityRegNo: string;
  collegeRollNo: string;
  mobileWhatsapp: string;
  email: string;
  idProofType: string;
  serviceTypeId: number;
  details?: Record<string, unknown>;
}

export interface AlumniIntakeResult {
  intakeId: number;
  ticketId: number;
  referenceId: string;
}

export interface OtpSendPayload {
  intakeId: number;
}

export interface OtpCheckPayload {
  intakeId: number;
  code: string;
}

export interface OtpCheckResult {
  contactVerified: boolean;
  referenceToken: string;
}

export interface SubmitRequestPayload {
  ticketId: number;
  requiresPhysicalPresence?: boolean;
  details?: Record<string, unknown>;
}

export interface TicketPublic {
  id: number;
  referenceId: string;
  status: string;
  requestorType: string;
  serviceType?: { name: string };
  department?: { name: string };
  slaDueAt?: string;
  createdAt: string;
  updatedAt: string;
  requiresPhysicalPresence?: boolean;
}

// ─── Public: service types ─────────────────────────────────────────────────

export async function fetchServiceTypes(): Promise<ServiceType[]> {
  const res = await axiosInstance.get<ApiResponse<ServiceType[]>>(`${BASE}/service-types`);
  return res.data.payload ?? [];
}

// ─── Alumni intake ─────────────────────────────────────────────────────────

export async function createAlumniIntake(
  payload: AlumniIntakePayload,
  idProofFile: File,
): Promise<ApiResponse<AlumniIntakeResult>> {
  const form = new FormData();
  Object.entries(payload).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      form.append(k, typeof v === "object" ? JSON.stringify(v) : String(v));
    }
  });
  form.append("idProof", idProofFile);

  const res = await axiosInstance.post<ApiResponse<AlumniIntakeResult>>(
    `${BASE}/alumni/intake`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function sendOtp(intakeId: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.post<ApiResponse<null>>(`${BASE}/alumni/verify-otp/send`, {
    intakeId,
  });
  return res.data;
}

export async function checkOtp(
  intakeId: number,
  code: string,
): Promise<ApiResponse<OtpCheckResult>> {
  const res = await axiosInstance.post<ApiResponse<OtpCheckResult>>(
    `${BASE}/alumni/verify-otp/check`,
    { intakeId, code },
  );
  return res.data;
}

// ─── Submit ────────────────────────────────────────────────────────────────

/**
 * For alumni: pass the referenceToken from OTP check as `authToken`.
 * For students: omit `authToken`; the session JWT is used automatically.
 */
export async function submitServiceRequest(
  payload: SubmitRequestPayload,
  authToken?: string,
): Promise<ApiResponse<{ referenceId: string; ticketId: number }>> {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  const res = await axiosInstance.post<ApiResponse<{ referenceId: string; ticketId: number }>>(
    `${BASE}/submit`,
    payload,
    { headers },
  );
  return res.data;
}

// ─── Public tracking ───────────────────────────────────────────────────────

export async function getTicketByRef(ref: string): Promise<ApiResponse<TicketPublic>> {
  const res = await axiosInstance.get<ApiResponse<TicketPublic>>(`${BASE}/tickets/${ref}`);
  return res.data;
}

// ─── Student: list my tickets ──────────────────────────────────────────────

export async function getMyTickets(): Promise<ApiResponse<TicketPublic[]>> {
  // Scoped to the authenticated student's own tickets via JWT (studentUserId)
  const res = await axiosInstance.get<ApiResponse<TicketPublic[]>>(`${BASE}/my-tickets`);
  return res.data;
}
