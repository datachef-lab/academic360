import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibraryArticleFlags = {
  isDocumentTypeExist: boolean;
  isUniqueAccessNumber: boolean;
  isJournal: boolean;
  isAuthor: boolean;
  isImprint: boolean;
  isCopyDetail: boolean;
  isKeyword: boolean;
  isRemarks: boolean;
  isCallNumber: boolean;
  isEnclosure: boolean;
  isVoucher: boolean;
  isAnalytical: boolean;
  isCallNumberAuto: boolean;
  isCallNumberCompulsory: boolean;
  isPublisher: boolean;
  isNote: boolean;
};

export type LibraryArticleRow = {
  id: number;
  legacyLibraryArticleId: number | null;
  name: string;
  code: string | null;
  isDocumentTypeExist: boolean;
  isUniqueAccessNumber: boolean;
  isJournal: boolean;
  isAuthor: boolean;
  isImprint: boolean;
  isCopyDetail: boolean;
  isKeyword: boolean;
  isRemarks: boolean;
  isCallNumber: boolean;
  isEnclosure: boolean;
  isVoucher: boolean;
  isAnalytical: boolean;
  isCallNumberAuto: boolean;
  isCallNumberCompulsory: boolean;
  isPublisher: boolean;
  isNote: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LibraryArticleListPayload = {
  rows: LibraryArticleRow[];
  total: number;
  page: number;
  limit: number;
};

export type LibraryArticleUpsertBody = {
  name: string;
  code?: string | null;
} & Partial<LibraryArticleFlags>;

export type LibraryArticleListQueryParams = {
  page: number;
  limit: number;
  search?: string;
};

const BASE = "/api/library/articles";

export async function getLibraryArticles(
  params: LibraryArticleListQueryParams,
): Promise<ApiResponse<LibraryArticleListPayload>> {
  const res = await axiosInstance.get<ApiResponse<LibraryArticleListPayload>>(BASE, { params });
  return res.data;
}

export async function getLibraryArticleById(id: number): Promise<ApiResponse<LibraryArticleRow>> {
  const res = await axiosInstance.get<ApiResponse<LibraryArticleRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createLibraryArticle(
  body: LibraryArticleUpsertBody,
): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateLibraryArticle(
  id: number,
  body: LibraryArticleUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteLibraryArticle(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
