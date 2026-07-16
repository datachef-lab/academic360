import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryJournalSubscriptionRow = {
  id: number;
  journalId: number;
  journalTitle: string | null;
  vendorId: number | null;
  vendorName: string | null;
  startDate: string | null;
  endDate: string | null;
  frequency: string | null;
  costPerYear: number;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LibraryJournalSubscriptionListPayload = {
  rows: LibraryJournalSubscriptionRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryJournalSubscriptionUpsertBody = {
  journalId: number;
  vendorId?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  frequency?: string | null;
  costPerYear?: number;
  isActive?: boolean;
  notes?: string | null;
};

export type LibraryJournalIssueRow = {
  id: number;
  subscriptionId: number;
  issueNumber: string | null;
  expectedDate: string | null;
  receivedDate: string | null;
  condition: string | null;
  remarks: string | null;
};

export type LibraryJournalIssueUpsertBody = {
  subscriptionId: number;
  issueNumber?: string | null;
  expectedDate?: string | null;
  receivedDate?: string | null;
  condition?: string | null;
  remarks?: string | null;
};

const BASE = "/api/library/journal-subscriptions";

export async function getJournalSubscriptions(params: {
  page: number;
  limit: number;
  search?: string;
  journalId?: number;
  vendorId?: number;
  isActive?: boolean;
}) {
  const res = await axiosInstance.get<ApiResponse<LibraryJournalSubscriptionListPayload>>(BASE, {
    params,
  });
  return res.data;
}

export async function getJournalSubscriptionById(id: number) {
  const res = await axiosInstance.get<ApiResponse<LibraryJournalSubscriptionRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createJournalSubscription(body: LibraryJournalSubscriptionUpsertBody) {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateJournalSubscription(
  id: number,
  body: LibraryJournalSubscriptionUpsertBody,
) {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteJournalSubscription(id: number) {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}

export async function getJournalIssuesForSubscription(subscriptionId: number) {
  const res = await axiosInstance.get<ApiResponse<LibraryJournalIssueRow[]>>(
    `${BASE}/${subscriptionId}/issues`,
  );
  return res.data;
}

export async function createJournalIssue(
  subscriptionId: number,
  body: Omit<LibraryJournalIssueUpsertBody, "subscriptionId">,
) {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(
    `${BASE}/${subscriptionId}/issues`,
    body,
  );
  return res.data;
}

export async function deleteJournalIssue(id: number) {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/issues/${id}`);
  return res.data;
}
