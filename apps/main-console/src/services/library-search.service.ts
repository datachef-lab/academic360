import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibrarySearchHit = {
  type: "BOOK" | "JOURNAL" | "COPY" | "ARTICLE";
  id: number;
  title: string;
  subtitle: string | null;
  meta: string | null;
  author: string | null;
  publisher: string | null;
  edition: string | null;
  language: string | null;
  quantity: number | null;
  rack: string | null;
  shelf: string | null;
  status: string | null;
  nextAvailableDate: string | null;
};

export type LibrarySearchPayload = {
  hits: LibrarySearchHit[];
  total: number;
};

export type OpacCopyRow = {
  id: number;
  accessNumber: string | null;
  oldAccessNumber: string | null;
  status: string | null;
  availableDate: string | null;
  copyType: string | null;
  binding: string | null;
  rack: string | null;
  shelf: string | null;
};

const BASE = "/api/library/search";

export async function getOpacCopies(params: {
  type: "BOOK" | "JOURNAL" | "COPY" | "ARTICLE";
  id: number;
}) {
  const res = await axiosInstance.get<ApiResponse<{ copies: OpacCopyRow[] }>>(`${BASE}/copies`, {
    params,
  });
  return res.data.payload?.copies ?? [];
}

export async function librarySearch(params: {
  q: string;
  type?: "BOOK" | "JOURNAL" | "COPY" | "ARTICLE";
  limit?: number;
  branchId?: number;
}) {
  const res = await axiosInstance.get<ApiResponse<LibrarySearchPayload>>(BASE, {
    params,
  });
  return res.data;
}
