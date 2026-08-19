import axiosInstance from "@/utils/api";

const BASE = "/api/service-requests";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TicketStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "ROUTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PENDING_SLOT_BOOKING"
  | "SLOT_BOOKED"
  | "CHECKED_IN"
  | "FULFILLED"
  | "CLOSED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type GatePassStatus = "ACTIVE" | "USED" | "EXPIRED" | "REVOKED" | "BYPASS";

export type RequestorType = "STUDENT" | "ALUMNI";

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

export interface AlumniIntake {
  id: number;
  fullName: string;
  yearOfPassing: number;
  courseStream: string;
  universityRegNo: string;
  collegeRollNo: string;
  mobileWhatsapp: string;
  email: string;
  idProofType: string;
  idProofVerified: boolean;
  contactVerified: boolean;
}

export interface Ticket {
  id: number;
  referenceId: string;
  requestorType: RequestorType;
  studentUserId?: number;
  alumniIntakeId?: number;
  serviceTypeId: number;
  departmentId?: number;
  status: TicketStatus;
  slaDueAt?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactVerified: boolean;
  requiresPhysicalPresence?: boolean;
  details?: Record<string, unknown>;
  routedAt?: string;
  approvedAt?: string;
  closedAt?: string;
  approvedByUserId?: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  serviceType?: ServiceType;
  alumniIntake?: AlumniIntake;
}

export interface TicketEvent {
  id: number;
  ticketId: number;
  eventType: string;
  fromStatus?: string;
  toStatus?: string;
  actorUserId?: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SlotWindow {
  id: number;
  departmentId: number;
  weekday: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  capacityPerSlot: number;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

export interface SlotAvailability {
  slotInstanceId: number;
  slotDate: string;
  startAt: string;
  endAt: string;
  capacity: number;
  bookedCount: number;
  available: number;
}

export interface GatePass {
  id: number;
  ticketId: number;
  slotBookingId?: number;
  nonce: string;
  payload: {
    ticketId: number;
    visitorName: string;
    userType: string;
    approvedDate?: string;
    timeSlot?: string;
    destinationDept?: string;
  };
  status: GatePassStatus;
  validFrom: string;
  validUntil: string;
  checkedInAt?: string;
  isBypass: boolean;
  qrDataUrl?: string;
}

export interface ScanResult {
  result: "GREEN" | "RED";
  reason?: string;
  checkedInAt?: string;
  pass?: GatePass;
}

export interface QueueParams {
  departmentId?: number;
  status?: TicketStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedQueue {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export interface SlotWindowPayload {
  weekday: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  capacityPerSlot: number;
  isActive?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
}

// ─── Service Type ─────────────────────────────────────────────────────────────

export async function getServiceTypes(): Promise<ServiceType[]> {
  const res = await axiosInstance.get<{ payload: ServiceType[] }>(`${BASE}/service-types`);
  return res.data.payload;
}

// ─── Queue (Clerk) ────────────────────────────────────────────────────────────

export async function getQueue(params: QueueParams = {}): Promise<PaginatedQueue> {
  const res = await axiosInstance.get<{ payload: PaginatedQueue }>(`${BASE}/queue`, { params });
  return res.data.payload;
}

// ─── Ticket detail ────────────────────────────────────────────────────────────

export async function getTicketDetail(id: number): Promise<Ticket> {
  const res = await axiosInstance.get<{ payload: Ticket }>(`${BASE}/tickets/${id}/detail`);
  return res.data.payload;
}

export async function getTicketByRef(ref: string): Promise<Ticket> {
  const res = await axiosInstance.get<{ payload: Ticket }>(`${BASE}/tickets/${ref}`);
  return res.data.payload;
}

export async function getTicketEvents(id: number): Promise<TicketEvent[]> {
  const res = await axiosInstance.get<{ payload: TicketEvent[] }>(`${BASE}/tickets/${id}/events`);
  return res.data.payload;
}

// ─── Approval actions ────────────────────────────────────────────────────────

export async function startReview(id: number): Promise<void> {
  await axiosInstance.post(`${BASE}/tickets/${id}/review`);
}

export async function approveTicket(id: number): Promise<void> {
  await axiosInstance.post(`${BASE}/tickets/${id}/approve`);
}

export async function rejectTicket(id: number, reason: string): Promise<void> {
  await axiosInstance.post(`${BASE}/tickets/${id}/reject`, { reason });
}

export async function setFulfilment(
  id: number,
  payload: { requiresPhysicalPresence: boolean },
): Promise<void> {
  await axiosInstance.post(`${BASE}/tickets/${id}/fulfilment`, payload);
}

// ─── ID Proof ────────────────────────────────────────────────────────────────

export async function getIdProofUrl(intakeId: number): Promise<string> {
  const res = await axiosInstance.get<{ payload: { url: string } }>(
    `${BASE}/alumni/intake/${intakeId}/id-proof-url`,
  );
  return res.data.payload.url;
}

export async function verifyIdProof(intakeId: number): Promise<void> {
  await axiosInstance.post(`${BASE}/alumni/intake/${intakeId}/verify-id-proof`);
}

// ─── Slot Windows (Admin) ────────────────────────────────────────────────────

export async function listSlotWindows(departmentId: number): Promise<SlotWindow[]> {
  const res = await axiosInstance.get<{ payload: SlotWindow[] }>(
    `${BASE}/departments/${departmentId}/slot-windows`,
  );
  return res.data.payload;
}

export async function createSlotWindow(
  departmentId: number,
  payload: SlotWindowPayload,
): Promise<SlotWindow> {
  const res = await axiosInstance.post<{ payload: SlotWindow }>(
    `${BASE}/departments/${departmentId}/slot-windows`,
    payload,
  );
  return res.data.payload;
}

export async function updateSlotWindow(
  departmentId: number,
  windowId: number,
  payload: Partial<SlotWindowPayload>,
): Promise<SlotWindow> {
  const res = await axiosInstance.put<{ payload: SlotWindow }>(
    `${BASE}/departments/${departmentId}/slot-windows/${windowId}`,
    payload,
  );
  return res.data.payload;
}

export async function deleteSlotWindow(departmentId: number, windowId: number): Promise<void> {
  await axiosInstance.delete(`${BASE}/departments/${departmentId}/slot-windows/${windowId}`);
}

// ─── Slot Availability ────────────────────────────────────────────────────────

export async function getSlots(departmentId: number, date: string): Promise<SlotAvailability[]> {
  const res = await axiosInstance.get<{ payload: SlotAvailability[] }>(
    `${BASE}/departments/${departmentId}/slots`,
    { params: { date } },
  );
  return res.data.payload;
}

// ─── Slot Booking ────────────────────────────────────────────────────────────

export async function bookTicketSlot(
  ticketId: number,
  slotInstanceId: number,
): Promise<{ bookingId: number; gatePassId: number }> {
  const res = await axiosInstance.post<{ payload: { bookingId: number; gatePassId: number } }>(
    `${BASE}/tickets/${ticketId}/book`,
    { slotInstanceId },
  );
  return res.data.payload;
}

export async function cancelBooking(ticketId: number): Promise<void> {
  await axiosInstance.post(`${BASE}/tickets/${ticketId}/cancel-booking`);
}

export async function rescheduleBooking(
  ticketId: number,
  newSlotInstanceId: number,
): Promise<void> {
  await axiosInstance.post(`${BASE}/tickets/${ticketId}/reschedule`, { newSlotInstanceId });
}

// ─── Gate Pass ───────────────────────────────────────────────────────────────

export async function getPass(ticketId: number): Promise<GatePass> {
  const res = await axiosInstance.get<{ payload: GatePass }>(`${BASE}/gate/tickets/${ticketId}/pass`);
  return res.data.payload;
}

export async function scanGatePass(nonce: string): Promise<ScanResult> {
  const res = await axiosInstance.post<{ payload: ScanResult }>(`${BASE}/gate/scan`, { nonce });
  return res.data.payload;
}

export async function issueBypass(
  ticketId: number,
  reason: string,
): Promise<GatePass> {
  const res = await axiosInstance.post<{ payload: GatePass }>(`${BASE}/gate/bypass`, {
    ticketId,
    reason,
  });
  return res.data.payload;
}
