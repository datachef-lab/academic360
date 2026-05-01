import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type CopyDetailsListRow = {
  id: number;
  bookId: number;
  bookTitle: string;
  publisherName: string | null;
  accessNumber: string | null;
  oldAccessNumber: string | null;
  isbn: string | null;
  publishedYear: string | null;
  statusName: string | null;
  entryModeName: string | null;
  rackName: string | null;
  shelfName: string | null;
  enclosureName: string | null;
  bindingName: string | null;
  priceInINR: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CopyDetailsListPayload = {
  rows: CopyDetailsListRow[];
  total: number;
  page: number;
  limit: number;
};

export type CopyDetailsMetaPayload = {
  books: Array<{ id: number; title: string }>;
  statuses: Array<{ id: number; name: string | null }>;
  entryModes: Array<{ id: number; name: string | null }>;
  racks: Array<{ id: number; name: string }>;
  shelves: Array<{ id: number; name: string }>;
  enclosures: Array<{ id: number; name: string }>;
  bindings: Array<{ id: number; name: string | null }>;
};

export type CopyDetailsDetail = {
  id: number;
  bookId: number;
  publishedYear: string | null;
  accessNumber: string | null;
  oldAccessNumber: string | null;
  type: string | null;
  issueType: string | null;
  statusId: number | null;
  enntryModeId: number | null;
  rackId: number | null;
  shelfId: number | null;
  voucherNumber: string | null;
  enclosureId: number | null;
  numberOfEnclosures: number | null;
  numberOfPages: number | null;
  priceInINR: string | null;
  bindingTypeId: number | null;
  isbn: string | null;
  remarks: string | null;
};

export type CopyDetailsUpsertBody = {
  bookId: number;
  publishedYear?: string | null;
  accessNumber?: string | null;
  oldAccessNumber?: string | null;
  type?: string | null;
  issueType?: string | null;
  statusId?: number | null;
  enntryModeId?: number | null;
  rackId?: number | null;
  shelfId?: number | null;
  voucherNumber?: string | null;
  enclosureId?: number | null;
  numberOfEnclosures?: number | null;
  numberOfPages?: number | null;
  priceInINR?: string | null;
  bindingTypeId?: number | null;
  isbn?: string | null;
  remarks?: string | null;
};

const BASE = "/api/library/copy-details";

export type CopyDetailsListQueryParams = {
  page: number;
  limit: number;
  search?: string;
  statusId?: number;
  entryModeId?: number;
  rackId?: number;
  shelfId?: number;
  bindingTypeId?: number;
  enclosureId?: number;
  bookId?: number;
};

export type CopyDetailsExportQueryParams = Omit<CopyDetailsListQueryParams, "page" | "limit">;

export async function getCopyDetailsList(
  params: CopyDetailsListQueryParams,
): Promise<ApiResponse<CopyDetailsListPayload>> {
  const res = await axiosInstance.get<ApiResponse<CopyDetailsListPayload>>(BASE, { params });
  return res.data;
}

export async function downloadCopyDetailsExcel(
  params: CopyDetailsExportQueryParams,
): Promise<Blob> {
  const res = await axiosInstance.get(`${BASE}/download`, {
    params,
    responseType: "blob",
  });
  return res.data as Blob;
}

export async function getCopyDetailsMeta(): Promise<ApiResponse<CopyDetailsMetaPayload>> {
  const res = await axiosInstance.get<ApiResponse<CopyDetailsMetaPayload>>(`${BASE}/meta`);
  return res.data;
}

export async function getCopyDetailsById(id: number): Promise<ApiResponse<CopyDetailsDetail>> {
  const res = await axiosInstance.get<ApiResponse<CopyDetailsDetail>>(`${BASE}/${id}`);
  return res.data;
}

export async function createCopyDetails(
  body: CopyDetailsUpsertBody,
): Promise<ApiResponse<{ id: number }>> {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateCopyDetails(
  id: number,
  body: CopyDetailsUpsertBody,
): Promise<ApiResponse<null>> {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}
