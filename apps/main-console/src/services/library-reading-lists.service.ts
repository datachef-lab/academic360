import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type ReadingListRow = {
  id: number;
  programCourseId: number;
  programCourseName: string | null;
  classId: number | null;
  className: string | null;
  facultyUserId: number | null;
  title: string;
  description: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ReadingListPayload = {
  rows: ReadingListRow[];
  total: number;
  page: number;
  limit: number;
};

export type ReadingListUpsertBody = {
  programCourseId: number;
  classId?: number | null;
  facultyUserId?: number | null;
  title: string;
  description?: string | null;
  isPublished?: boolean;
};

export type ReadingListItemRow = {
  id: number;
  readingListId: number;
  itemType: "BOOK" | "JOURNAL" | "EXTERNAL_URL";
  bookId: number | null;
  journalId: number | null;
  externalUrl: string | null;
  externalTitle: string | null;
  notes: string | null;
  displayOrder: number;
};

export type ReadingListItemUpsertBody = {
  itemType: "BOOK" | "JOURNAL" | "EXTERNAL_URL";
  bookId?: number | null;
  journalId?: number | null;
  externalUrl?: string | null;
  externalTitle?: string | null;
  notes?: string | null;
  displayOrder?: number;
};

const BASE = "/api/library/reading-lists";

export async function getReadingLists(params: {
  page: number;
  limit: number;
  search?: string;
  programCourseId?: number;
  classId?: number;
  isPublished?: boolean;
}) {
  const res = await axiosInstance.get<ApiResponse<ReadingListPayload>>(BASE, {
    params,
  });
  return res.data;
}

export async function getReadingListById(id: number) {
  const res = await axiosInstance.get<ApiResponse<ReadingListRow>>(`${BASE}/${id}`);
  return res.data;
}

export async function createReadingList(body: ReadingListUpsertBody) {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, body);
  return res.data;
}

export async function updateReadingList(id: number, body: ReadingListUpsertBody) {
  const res = await axiosInstance.put<ApiResponse<null>>(`${BASE}/${id}`, body);
  return res.data;
}

export async function deleteReadingList(id: number) {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}

export async function getReadingListItems(readingListId: number) {
  const res = await axiosInstance.get<ApiResponse<ReadingListItemRow[]>>(
    `${BASE}/${readingListId}/items`,
  );
  return res.data;
}

export async function createReadingListItem(
  readingListId: number,
  body: ReadingListItemUpsertBody,
) {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(
    `${BASE}/${readingListId}/items`,
    body,
  );
  return res.data;
}

export async function deleteReadingListItem(id: number) {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/items/${id}`);
  return res.data;
}
