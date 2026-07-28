import axios from "axios";
import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";
import type {
  DeclarationMasterDto,
  DeclarationMasterStatementDto,
  DeclarationMasterStatementFieldDto,
} from "@repo/db/dtos/academics";

const BASE_URL = "/api/academics/declaration-masters";

/**
 * The DB DTOs are derived from drizzle insert schemas, so `id` is optional on
 * them. Anything the API hands back is already persisted — this makes that
 * explicit so the screens never have to null-check an id.
 */
type Persisted<T> = Omit<T, "id"> & { id: number };

export type DeclarationContext = DeclarationMasterDto["context"];
// NonNullable because the DTO extends drizzle's INSERT type, where `type` has
// a DB default and is therefore optional — without this the union carries
// `undefined` and can't be handed to a <SelectItem value>.
export type DeclarationFieldType = NonNullable<DeclarationMasterStatementFieldDto["type"]>;

export const DECLARATION_CONTEXTS: DeclarationContext[] = [
  "ADMISSION",
  "EXAM",
  "FEES",
  "LIBRARY",
  "OTHER",
];

export const DECLARATION_FIELD_TYPES: DeclarationFieldType[] = [
  "TEXT",
  "TEXTAREA",
  "SELECT",
  "NUMBER",
  "DATE",
];

/**
 * How many student declarations already reference this row. The API returns it
 * on every statement, field and option (0 when unused). Anything above 0 is
 * frozen server-side — see `isDeclarationInUseError` below.
 */
type WithUsage = { usageCount: number };

export type DeclarationMasterStatementFieldOption = Persisted<
  NonNullable<DeclarationMasterStatementFieldDto["options"]>[number]
> &
  WithUsage;

export type DeclarationMasterStatementField = Persisted<
  Omit<DeclarationMasterStatementFieldDto, "options">
> &
  WithUsage & {
    options?: DeclarationMasterStatementFieldOption[];
  };

export type DeclarationMasterStatement = Persisted<Omit<DeclarationMasterStatementDto, "fields">> &
  WithUsage & {
    fields?: DeclarationMasterStatementField[];
  };

export type DeclarationMaster = Persisted<Omit<DeclarationMasterDto, "statements">> & {
  statements?: DeclarationMasterStatement[];
};

export type DeclarationMasterPayload = {
  /** Human label shown in the admin console, e.g. "Fee Due Declaration". */
  name: string;
  context: DeclarationContext;
  template: string;
  isActive?: boolean;
};

export type DeclarationStatementPayload = {
  declarationMasterId: number;
  statement: string;
  isRequired?: boolean;
  sequence?: number;
  isActive?: boolean;
};

export type DeclarationStatementFieldPayload = {
  declarationMasterStatementId: number;
  label: string;
  type: DeclarationFieldType;
  sequence?: number;
  isActive?: boolean;
};

export type DeclarationStatementFieldOptionPayload = {
  declarationMasterStatementFieldId: number;
  name: string;
  sequence?: number;
  isActive?: boolean;
};

/* ----------------------------- in-use guard ------------------------------- */

/**
 * A row a student has already declared against is immutable: its wording can
 * never be edited, because that would retroactively change what those students
 * agreed to. The sanctioned workflow is to deactivate the old row and add a new
 * one. The server refuses such writes with HTTP 409 and this payload.
 */
export type DeclarationInUsePayload = {
  code: "DECLARATION_IN_USE";
  level: "STATEMENT" | "FIELD" | "OPTION";
  id: number;
  usageCount: number;
  action: "UPDATE" | "DELETE";
  /** Names of the immutable columns the request tried to change. */
  blockedFields: string[];
};

/**
 * `payload.code` is the stable marker — never string-match the message, which
 * is prose meant for humans and is free to change.
 */
export function getDeclarationInUseError(
  e: unknown,
): { payload: DeclarationInUsePayload; message: string } | null {
  if (!axios.isAxiosError(e)) return null;
  const data: unknown = e.response?.data;
  if (typeof data !== "object" || data === null) return null;

  const payload = (data as { payload?: unknown }).payload;
  if (typeof payload !== "object" || payload === null) return null;
  if ((payload as { code?: unknown }).code !== "DECLARATION_IN_USE") return null;

  const rawMessage = (data as { message?: unknown }).message;
  return {
    payload: payload as DeclarationInUsePayload,
    message: typeof rawMessage === "string" ? rawMessage : "",
  };
}

/** True when the server refused the write because the row is already in use. */
export function isDeclarationInUseError(e: unknown): boolean {
  return getDeclarationInUseError(e) !== null;
}

/** The server's ready-to-show sentence for a 409, or `null` for anything else. */
export function declarationInUseMessage(e: unknown): string | null {
  const hit = getDeclarationInUseError(e);
  if (!hit) return null;
  return (
    hit.message ||
    "This row has already been declared by a student. Deactivate it and add a new one instead."
  );
}

/**
 * Defensive read of `usageCount`: an older/cached API response may not carry it
 * at all, and "missing" must mean "not in use" rather than crash the screen.
 */
export function usageCountOf(row: { usageCount?: number | null } | null | undefined): number {
  const n = row?.usageCount;
  return typeof n === "number" && n > 0 ? n : 0;
}

/* --------------------------------- masters -------------------------------- */

export async function getAllDeclarationMasters() {
  const { data } = await axiosInstance.get<ApiResponse<DeclarationMaster[]>>(BASE_URL);
  return Array.isArray(data.payload) ? data.payload : [];
}

export async function getDeclarationMasterById(id: number) {
  const { data } = await axiosInstance.get<ApiResponse<DeclarationMaster | null>>(
    `${BASE_URL}/${id}`,
  );
  return data.payload;
}

export async function createDeclarationMaster(payload: DeclarationMasterPayload) {
  const { data } = await axiosInstance.post<ApiResponse<DeclarationMaster>>(BASE_URL, payload);
  return data.payload;
}

export async function updateDeclarationMaster(
  id: number,
  payload: Partial<DeclarationMasterPayload>,
) {
  const { data } = await axiosInstance.put<ApiResponse<DeclarationMaster | null>>(
    `${BASE_URL}/${id}`,
    payload,
  );
  return data.payload;
}

export async function deleteDeclarationMaster(id: number) {
  const { data } = await axiosInstance.delete<ApiResponse<null>>(`${BASE_URL}/${id}`);
  return data;
}

/**
 * Server-side render of the EJS template this master points at, with sample
 * data. `NONE` means the template could not be rendered — `error` carries the
 * reason (missing file, render failure, …) so the console can show it.
 */
export type DeclarationMasterPreview =
  | { kind: "EMAIL"; html: string; templateKey: string | null }
  | { kind: "NONE"; templateKey: string | null; error?: string };

export async function getDeclarationMasterPreview(id: number) {
  const { data } = await axiosInstance.get<ApiResponse<DeclarationMasterPreview>>(
    `${BASE_URL}/${id}/preview`,
  );
  return data.payload;
}

/**
 * The unsaved dialog tree, in the shape the draft-preview endpoint expects. It
 * is deliberately loose (everything optional, no ids) — the console posts what
 * the admin has typed so far, half-finished rows included.
 */
export type DeclarationMasterDraftPreviewPayload = {
  name?: string;
  template?: string;
  statements?: Array<{
    statement?: string;
    isActive?: boolean;
    sequence?: number;
    fields?: Array<{
      label?: string;
      isActive?: boolean;
      sequence?: number;
      options?: Array<{ name?: string; isActive?: boolean; sequence?: number }>;
    }>;
  }>;
};

/**
 * Renders the email for a draft that has not been saved yet. The endpoint reads
 * and writes nothing: it drops inactive rows, orders by `sequence` and skips
 * blank statements / unlabelled fields, so half-typed rows never reach the
 * preview. Same `NONE` fallback as the saved-row preview when the template file
 * does not exist.
 */
export async function previewDeclarationMasterDraft(draft: DeclarationMasterDraftPreviewPayload) {
  const { data } = await axiosInstance.post<ApiResponse<DeclarationMasterPreview>>(
    `${BASE_URL}/preview`,
    draft,
  );
  return data.payload;
}

/* ------------------------------- statements ------------------------------- */

export async function getDeclarationStatements(declarationMasterId: number) {
  const { data } = await axiosInstance.get<ApiResponse<DeclarationMasterStatement[]>>(
    `${BASE_URL}/statements`,
    { params: { declarationMasterId } },
  );
  return Array.isArray(data.payload) ? data.payload : [];
}

export async function createDeclarationStatement(payload: DeclarationStatementPayload) {
  const { data } = await axiosInstance.post<ApiResponse<DeclarationMasterStatement>>(
    `${BASE_URL}/statements`,
    payload,
  );
  return data.payload;
}

export async function updateDeclarationStatement(
  id: number,
  payload: Partial<DeclarationStatementPayload>,
) {
  const { data } = await axiosInstance.put<ApiResponse<DeclarationMasterStatement | null>>(
    `${BASE_URL}/statements/${id}`,
    payload,
  );
  return data.payload;
}

export async function deleteDeclarationStatement(id: number) {
  const { data } = await axiosInstance.delete<ApiResponse<null>>(`${BASE_URL}/statements/${id}`);
  return data;
}

/* --------------------------------- fields --------------------------------- */

export async function getDeclarationStatementFields(declarationMasterStatementId: number) {
  const { data } = await axiosInstance.get<ApiResponse<DeclarationMasterStatementField[]>>(
    `${BASE_URL}/statement-fields`,
    { params: { declarationMasterStatementId } },
  );
  return Array.isArray(data.payload) ? data.payload : [];
}

export async function createDeclarationStatementField(payload: DeclarationStatementFieldPayload) {
  const { data } = await axiosInstance.post<ApiResponse<DeclarationMasterStatementField>>(
    `${BASE_URL}/statement-fields`,
    payload,
  );
  return data.payload;
}

export async function updateDeclarationStatementField(
  id: number,
  payload: Partial<DeclarationStatementFieldPayload>,
) {
  const { data } = await axiosInstance.put<ApiResponse<DeclarationMasterStatementField | null>>(
    `${BASE_URL}/statement-fields/${id}`,
    payload,
  );
  return data.payload;
}

export async function deleteDeclarationStatementField(id: number) {
  const { data } = await axiosInstance.delete<ApiResponse<null>>(
    `${BASE_URL}/statement-fields/${id}`,
  );
  return data;
}

/* --------------------------------- options -------------------------------- */

export async function getDeclarationStatementFieldOptions(
  declarationMasterStatementFieldId: number,
) {
  const { data } = await axiosInstance.get<ApiResponse<DeclarationMasterStatementFieldOption[]>>(
    `${BASE_URL}/statement-field-options`,
    { params: { declarationMasterStatementFieldId } },
  );
  return Array.isArray(data.payload) ? data.payload : [];
}

export async function createDeclarationStatementFieldOption(
  payload: DeclarationStatementFieldOptionPayload,
) {
  const { data } = await axiosInstance.post<ApiResponse<DeclarationMasterStatementFieldOption>>(
    `${BASE_URL}/statement-field-options`,
    payload,
  );
  return data.payload;
}

export async function updateDeclarationStatementFieldOption(
  id: number,
  payload: Partial<DeclarationStatementFieldOptionPayload>,
) {
  const { data } = await axiosInstance.put<
    ApiResponse<DeclarationMasterStatementFieldOption | null>
  >(`${BASE_URL}/statement-field-options/${id}`, payload);
  return data.payload;
}

export async function deleteDeclarationStatementFieldOption(id: number) {
  const { data } = await axiosInstance.delete<ApiResponse<null>>(
    `${BASE_URL}/statement-field-options/${id}`,
  );
  return data;
}
