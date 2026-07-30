import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";
import type { DocumentTypeT } from "@repo/db/schemas/models/documents";

export type { DocumentTypeT };

export type DocumentDomain = NonNullable<DocumentTypeT["domain"]>;
export type DocumentCategory = NonNullable<DocumentTypeT["category"]>;
export type DocumentEligibilityRule = NonNullable<DocumentTypeT["eligibilityRule"]>;
export type DocumentIssuingAuthority = NonNullable<DocumentTypeT["issuingAuthority"]>;

export const DOCUMENT_DOMAINS: DocumentDomain[] = [
  "PRE_ADMISSION",
  "POST_ADMISSION",
  "ENROLMENT",
  "PRE_CU_REGISTRATION",
  "POST_CU_REGISTRATION",
  "EXAM",
  "FEES",
  "LIBRARY",
  "OTHER",
];

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  "EXAM_LINKED",
  "ADMINISTRATIVE",
  "UPLOAD",
  "SYSTEM_GENERATED",
];

export const DOCUMENT_ELIGIBILITY_RULES: DocumentEligibilityRule[] = [
  "FORM_FILLUP_RECORDED",
  "RCSI_RECORDED",
];

export const DOCUMENT_ISSUING_AUTHORITIES: DocumentIssuingAuthority[] = ["UNIVERSITY", "COLLEGE"];

export type DocumentType = Omit<DocumentTypeT, "id"> & { id: number };

export type DocumentTypeUpsertBody = {
  domain?: DocumentDomain;
  name: string;
  description?: string | null;
  issuingAuthority?: DocumentIssuingAuthority | null;
  category?: DocumentCategory;
  eligibilityRule?: DocumentEligibilityRule | null;
  requiresFeeClearance?: boolean;
  requiresLibraryClearance?: boolean;
  isRecurring?: boolean;
  sequence?: number | null;
  isActive?: boolean | null;
  bgColor?: string | null;
  textColor?: string | null;
};

const BASE_URL = "/api/documents";

export async function getAllDocumentTypes(): Promise<ApiResponse<DocumentType[]>> {
  const response = await axiosInstance.get<ApiResponse<DocumentType[]>>(BASE_URL);
  return response.data;
}

export async function createDocumentType(
  body: DocumentTypeUpsertBody,
): Promise<ApiResponse<DocumentType>> {
  const response = await axiosInstance.post<ApiResponse<DocumentType>>(BASE_URL, body);
  return response.data;
}

export async function updateDocumentType(
  id: number,
  body: DocumentTypeUpsertBody,
): Promise<ApiResponse<DocumentType>> {
  const response = await axiosInstance.put<ApiResponse<DocumentType>>(`${BASE_URL}/${id}`, body);
  return response.data;
}

export async function deleteDocumentType(id: number): Promise<ApiResponse<DocumentType>> {
  const response = await axiosInstance.delete<ApiResponse<DocumentType>>(`${BASE_URL}/${id}`);
  return response.data;
}
