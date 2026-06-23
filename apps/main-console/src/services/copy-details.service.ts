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
  itemCategories: Array<{ id: number; name: string }>;
  vendors: Array<{ id: number; name: string }>;
  branches: Array<{ id: number; name: string }>;
  authorTypes: Array<{ id: number; name: string | null }>;
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
  branchId: number | null;
  itemCategoryId: number | null;
  vendorId: number | null;
  rfidNumber: string | null;
  theftBitArmed: boolean | null;
  priceForeignCurrency: string | null;
  purchasePrice: string | null;
  setPrice: string | null;
  discount: string | null;
  shippingCharges: string | null;
  bookVolume: string | null;
  bookPart: string | null;
  bookPartInfo: string | null;
  volumeInfo: string | null;
  prefix: string | null;
  suffix: string | null;
  bookSize: string | null;
  billDate: string | null;
  authorTypeId: number | null;
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
  branchId?: number | null;
  itemCategoryId?: number | null;
  vendorId?: number | null;
  rfidNumber?: string | null;
  theftBitArmed?: boolean | null;
  priceForeignCurrency?: string | null;
  purchasePrice?: string | null;
  setPrice?: string | null;
  discount?: string | null;
  shippingCharges?: string | null;
  bookVolume?: string | null;
  bookPart?: string | null;
  bookPartInfo?: string | null;
  volumeInfo?: string | null;
  prefix?: string | null;
  suffix?: string | null;
  bookSize?: string | null;
  billDate?: string | null;
  authorTypeId?: number | null;
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

export async function deleteCopyDetails(id: number): Promise<ApiResponse<null>> {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}

export async function downloadCopyBulkUploadTemplate(bookId?: number): Promise<Blob> {
  const res = await axiosInstance.get(`${BASE}/template`, {
    params: bookId ? { bookId } : undefined,
    responseType: "blob",
  });
  return res.data as Blob;
}

export type CopyBulkUploadJob = {
  jobId: string;
  bookId: number;
};

export async function bulkUploadCopyDetails(
  bookId: number,
  file: File,
): Promise<ApiResponse<CopyBulkUploadJob>> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axiosInstance.post<ApiResponse<CopyBulkUploadJob>>(
    `${BASE}/bulk-upload`,
    formData,
    {
      params: { bookId },
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return res.data;
}

export type CopyAddress = {
  id: number | null;
  addressLine: string | null;
  countryId: number | null;
  stateId: number | null;
  cityId: number | null;
  pincode: string | null;
  landmark: string | null;
};

export type CopyAddressInput = Omit<CopyAddress, "id">;

export async function getCopyAddress(copyId: number): Promise<CopyAddress> {
  const res = await axiosInstance.get<ApiResponse<CopyAddress>>(`${BASE}/${copyId}/address`);
  return res.data.payload;
}

export async function saveCopyAddress(
  copyId: number,
  input: CopyAddressInput,
): Promise<CopyAddress> {
  const res = await axiosInstance.put<ApiResponse<CopyAddress>>(`${BASE}/${copyId}/address`, input);
  return res.data.payload;
}

export type CopyBulkUploadProgress = {
  jobId: string;
  bookId: number;
  status: "STARTED" | "ROW" | "COMPLETED";
  processed: number;
  succeeded: number;
  failed: number;
  total: number;
  lastError?: { row: number; message: string } | null;
  errors?: Array<{ row: number; message: string }>;
  updatedAt: string;
};
