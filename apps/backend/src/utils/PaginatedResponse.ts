export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  /** Count of unique exam subjects (papers) the student is enrolled in via exam_candidates. Only present for exam-group responses. */
  totalSubjectCount?: number;
}
