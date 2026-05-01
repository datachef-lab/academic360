import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type BookListRow = {
  id: number;
  title: string;
  subTitle: string | null;
  frontCover: string | null;
  isbn: string | null;
  edition: string | null;
  publishedYear: string | null;
  publisherName: string | null;
  languageName: string | null;
  subjectGroupName: string | null;
  seriesName: string | null;
  documentTypeName: string | null;
  libraryArticleName: string | null;
  journalTitle: string | null;
  periodName: string | null;
  enclosureName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookListPayload = {
  rows: BookListRow[];
  total: number;
  page: number;
  limit: number;
};

export type BookDetail = {
  id: number;
  libraryDocumentTypeId: number | null;
  title: string;
  subTitle: string | null;
  alternateTitle: string | null;
  subjectGroupId: number | null;
  languageId: number | null;
  isbn: string | null;
  issueDate: string | null;
  edition: string | null;
  editionYear: string | null;
  bookVolume: string | null;
  bookPart: string | null;
  seriesId: number | null;
  publisherId: number | null;
  publishedYear: string | null;
  keywords: string | null;
  remarks: string | null;
  callNumber: string | null;
  journalId: number | null;
  issueNumber: string | null;
  isUniqueAccess: boolean;
  enclosureId: number | null;
  notes: string | null;
  frequency: number | null;
  referenceNumber: string | null;
  frontCover: string | null;
  backCover: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookMetaPayload = {
  libraryDocumentTypes: Array<{ id: number; name: string; libraryArticleName: string | null }>;
  publishers: Array<{ id: number; name: string | null }>;
  languages: Array<{ id: number; name: string | null }>;
  subjectGroups: Array<{ id: number; name: string }>;
  series: Array<{ id: number; name: string }>;
  journals: Array<{ id: number; title: string }>;
  enclosures: Array<{ id: number; name: string }>;
  periods: Array<{ id: number; name: string | null }>;
};

export type BookUpsertBody = {
  title: string;
  libraryDocumentTypeId?: number | null;
  subTitle?: string | null;
  alternateTitle?: string | null;
  subjectGroupId?: number | null;
  languageId?: number | null;
  isbn?: string | null;
  issueDate?: string | null;
  edition?: string | null;
  editionYear?: string | null;
  bookVolume?: string | null;
  bookPart?: string | null;
  seriesId?: number | null;
  publisherId?: number | null;
  publishedYear?: string | null;
  keywords?: string | null;
  remarks?: string | null;
  callNumber?: string | null;
  journalId?: number | null;
  issueNumber?: string | null;
  isUniqueAccess?: boolean | null;
  enclosureId?: number | null;
  notes?: string | null;
  frequency?: number | null;
  referenceNumber?: string | null;
  frontCover?: string | null;
  backCover?: string | null;
  frontCoverFile?: File | null;
  backCoverFile?: File | null;
};

const BASE = "/api/library/books";

export type BookListQueryParams = {
  page: number;
  limit: number;
  search?: string;
  publisherId?: number;
  languageId?: number;
  subjectGroupId?: number;
  seriesId?: number;
  libraryDocumentTypeId?: number;
  journalId?: number;
  enclosureId?: number;
};

export type BookExportQueryParams = Omit<BookListQueryParams, "page" | "limit">;

export async function getBookList(
  params: BookListQueryParams,
): Promise<ApiResponse<BookListPayload>> {
  const res = await axiosInstance.get<ApiResponse<BookListPayload>>(BASE, { params });
  return res.data;
}

export async function downloadBooksExcel(params: BookExportQueryParams): Promise<Blob> {
  const res = await axiosInstance.get(`${BASE}/download`, {
    params,
    responseType: "blob",
  });
  return res.data as Blob;
}

export async function getBooksMeta(): Promise<ApiResponse<BookMetaPayload>> {
  const res = await axiosInstance.get<ApiResponse<BookMetaPayload>>(`${BASE}/meta`);
  return res.data;
}

export async function getBookById(id: number): Promise<ApiResponse<BookDetail>> {
  const res = await axiosInstance.get<ApiResponse<BookDetail>>(`${BASE}/${id}`);
  return res.data;
}

export async function createBook(body: BookUpsertBody): Promise<ApiResponse<{ id: number }>> {
  const payload = new FormData();
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null || k === "frontCoverFile" || k === "backCoverFile") continue;
    payload.append(k, String(v));
  }
  if (body.frontCoverFile) payload.append("frontCover", body.frontCoverFile);
  if (body.backCoverFile) payload.append("backCover", body.backCoverFile);
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, payload);
  return res.data;
}

export async function updateBook(id: number, body: BookUpsertBody): Promise<ApiResponse<null>> {
  const payload = new FormData();
  for (const [k, v] of Object.entries(body)) {
    if (v === undefined || v === null || k === "frontCoverFile" || k === "backCoverFile") continue;
    payload.append(k, String(v));
  }
  if (body.frontCoverFile) payload.append("frontCover", body.frontCoverFile);
  if (body.backCoverFile) payload.append("backCover", body.backCoverFile);
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, payload);
  return res.data;
}

export async function deleteBook(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
