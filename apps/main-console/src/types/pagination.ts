export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
}
