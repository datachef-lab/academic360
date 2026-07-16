import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type BookAuthorRow = {
  id: number;
  authorId: number;
  authorTypeId: number;
  authorName: string | null;
  authorTypeName: string | null;
};

const BASE = "/api/library/books";

export async function getBookAuthors(bookId: number): Promise<BookAuthorRow[]> {
  const res = await axiosInstance.get<ApiResponse<BookAuthorRow[]>>(`${BASE}/${bookId}/authors`);
  return res.data.payload;
}

export async function saveBookAuthors(
  bookId: number,
  authors: Array<{ authorId: number; authorTypeId: number }>,
): Promise<void> {
  await axiosInstance.put<ApiResponse<unknown>>(`${BASE}/${bookId}/authors/bulk`, { authors });
}
