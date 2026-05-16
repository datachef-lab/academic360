import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type JournalListRow = {
  id: number;
  title: string;
  issnNumber: string | null;
  sizeInCM: string | null;
  journalTypeName: string | null;
  publisherName: string | null;
  entryModeName: string | null;
  languageName: string | null;
  bindingName: string | null;
  periodName: string | null;
  subjectGroupName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JournalListPayload = {
  rows: JournalListRow[];
  total: number;
  page: number;
  limit: number;
};

export type JournalDetail = {
  id: number;
  legacyJournalId: number | null;
  type: number | null;
  subjectGroupId: number | null;
  title: string;
  entryModeId: number | null;
  publisherId: number | null;
  languageId: number | null;
  bindingId: number | null;
  periodId: number | null;
  issnNumber: string | null;
  sizeInCM: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JournalMetaPayload = {
  journalTypes: Array<{ id: number; name: string | null }>;
  entryModes: Array<{ id: number; name: string | null }>;
  publishers: Array<{ id: number; name: string | null }>;
  languages: Array<{ id: number; name: string | null }>;
  bindings: Array<{ id: number; name: string | null }>;
  periods: Array<{ id: number; name: string | null }>;
  subjectGroups: Array<{ id: number; name: string }>;
};

export type JournalUpsertBody = {
  title: string;
  type?: number | null;
  subjectGroupId?: number | null;
  entryModeId?: number | null;
  publisherId?: number | null;
  languageId?: number | null;
  bindingId?: number | null;
  periodId?: number | null;
  issnNumber?: string | null;
  sizeInCM?: string | null;
};

const BASE = "/api/library/journals";

export type JournalListQueryParams = {
  page: number;
  limit: number;
  search?: string;
  subjectGroupId?: number;
  entryModeId?: number;
  languageId?: number;
  bindingId?: number;
  periodId?: number;
  publisherId?: number;
};

export type JournalExportQueryParams = Omit<JournalListQueryParams, "page" | "limit">;

export type JournalLinkedBook = { id: number; title: string };

export async function getJournalLinkedBooks(
  id: number,
): Promise<ApiResponse<{ books: JournalLinkedBook[] }>> {
  const res = await axiosInstance.get<ApiResponse<{ books: JournalLinkedBook[] }>>(
    `${BASE}/${id}/linked-books`,
  );
  return res.data;
}

export async function getJournalList(
  params: JournalListQueryParams,
): Promise<ApiResponse<JournalListPayload>> {
  const res = await axiosInstance.get<ApiResponse<JournalListPayload>>(BASE, { params });
  return res.data;
}

export async function downloadJournalExcel(params: JournalExportQueryParams): Promise<Blob> {
  const res = await axiosInstance.get(`${BASE}/download`, {
    params,
    responseType: "blob",
  });
  return res.data as Blob;
}

export async function getJournalMeta(): Promise<ApiResponse<JournalMetaPayload>> {
  const res = await axiosInstance.get<ApiResponse<JournalMetaPayload>>(`${BASE}/meta`);
  return res.data;
}

export async function getJournalById(id: number): Promise<ApiResponse<JournalDetail>> {
  const res = await axiosInstance.get<ApiResponse<JournalDetail>>(`${BASE}/${id}`);
  return res.data;
}

export async function createJournal(body: JournalUpsertBody): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateJournal(
  id: number,
  body: JournalUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteJournal(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
