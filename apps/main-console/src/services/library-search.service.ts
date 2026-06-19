import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type LibrarySearchHit = {
  type: "BOOK" | "JOURNAL" | "COPY" | "ARTICLE";
  id: number;
  title: string;
  subtitle: string | null;
  meta: string | null;
};

export type LibrarySearchPayload = {
  hits: LibrarySearchHit[];
  total: number;
};

const BASE = "/api/library/search";

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
