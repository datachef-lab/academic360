import axiosInstance from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

export type LibrarySearchType = "BOOK" | "JOURNAL" | "COPY" | "ARTICLE";

/** One catalogue/OPAC search hit (GET /api/library/search). */
export interface LibraryHit {
  type: LibrarySearchType;
  id: number;
  title: string;
  subtitle: string | null;
  meta: string | null; // isbn
  author: string | null;
  publisher: string | null;
  edition: string | null;
  language: string | null;
  quantity: number | null;
  rack: string | null;
  shelf: string | null;
  status: string | null;
  nextAvailableDate: string | null;
}

export async function searchCatalogue(
  q: string,
  opts: { type?: LibrarySearchType; branchId?: number; limit?: number } = {},
): Promise<LibraryHit[]> {
  try {
    const res = await axiosInstance.get<ApiResponse<{ hits: LibraryHit[] }>>(
      "/api/library/search",
      { params: { q, type: opts.type, branchId: opts.branchId, limit: opts.limit ?? 20 } },
    );
    return res.data.payload?.hits ?? [];
  } catch {
    return [];
  }
}

/** Book detail (GET /api/library/books/:id → BookDto, trimmed to what we render). */
export interface LibraryBook {
  id: number;
  title: string;
  subTitle?: string | null;
  isbn?: string | null;
  edition?: string | null;
  publishedYear?: number | null;
  frontCover?: string | null;
  softCopy?: string | null;
  cdlEnabled?: boolean | null;
  keywords?: string | null;
  authors?: { name?: string | null }[] | null;
  publisher?: { name?: string | null } | null;
  language?: { name?: string | null } | null;
  documentType?: { name?: string | null } | null;
}

export async function fetchBook(id: number): Promise<LibraryBook | null> {
  try {
    const res = await axiosInstance.get<ApiResponse<LibraryBook>>(`/api/library/books/${id}`);
    return (res.data.payload as LibraryBook) ?? null;
  } catch {
    return null;
  }
}

export interface OpacCopy {
  rack: string | null;
  shelf: string | null;
  availableDate?: string | null;
  accessNumber?: string | null;
  status?: string | null;
}

export async function fetchCopies(type: LibrarySearchType, id: number): Promise<OpacCopy[]> {
  try {
    const res = await axiosInstance.get<ApiResponse<{ copies: OpacCopy[] }>>(
      "/api/library/search/copies",
      { params: { type, id } },
    );
    return res.data.payload?.copies ?? [];
  } catch {
    return [];
  }
}

/** A row from the student's circulation preview (issued/returned). */
export interface CirculationRow {
  id: number;
  copyDetailsId: number;
  title: string | null;
  author: string | null;
  publication: string | null;
  frontCover: string | null;
  status: "ISSUED" | "RETURNED";
  issuedTimestamp: string;
  returnTimestamp: string; // due date
  actualReturnTimestamp: string | null;
  fine: number;
  netFine: number;
}

export async function fetchMyCirculation(userId: number): Promise<CirculationRow[]> {
  try {
    const res = await axiosInstance.get<ApiResponse<{ rows: CirculationRow[] }>>(
      `/api/library/book-circulation/preview/${userId}`,
    );
    return res.data.payload?.rows ?? [];
  } catch {
    return [];
  }
}

export interface CdlSession {
  sessionId: number;
  signedUrl: string;
  expiresAt: string;
}

/** Start a Controlled Digital Lending session for an e-book (self-scoped). */
export async function startCdlSession(bookId: number): Promise<CdlSession | null> {
  try {
    const res = await axiosInstance.post<ApiResponse<CdlSession>>(
      `/api/library/cdl/${bookId}/sessions`,
    );
    return (res.data.payload as CdlSession) ?? null;
  } catch {
    return null;
  }
}

export interface ReadingList {
  id: number;
  title: string;
  description?: string | null;
}

export interface ReadingListItem {
  id: number;
  itemType?: string | null;
  bookId?: number | null;
  externalTitle?: string | null;
  externalUrl?: string | null;
  notes?: string | null;
}

function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const c = (payload as { content?: T[] } | null)?.content;
  return Array.isArray(c) ? c : [];
}

export async function fetchReadingLists(): Promise<ReadingList[]> {
  try {
    const res = await axiosInstance.get<ApiResponse<unknown>>("/api/library/reading-lists");
    return unwrapList<ReadingList>(res.data.payload);
  } catch {
    return [];
  }
}

export async function fetchReadingListItems(id: number): Promise<ReadingListItem[]> {
  try {
    const res = await axiosInstance.get<ApiResponse<unknown>>(
      `/api/library/reading-lists/${id}/items`,
    );
    return unwrapList<ReadingListItem>(res.data.payload);
  } catch {
    return [];
  }
}
