import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";
import { PaginatedResponse } from "./course-design.api";
import { ExamDto, ExamPapersWithStats, ExamSubjectDto } from "@/dtos";

export interface ExamFilters {
  examTypeId?: number | null;
  classId?: number | null;
  academicYearId?: number | null;
  affiliationId?: number | null;
  regulationTypeId?: number | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  status?: "upcoming" | "recent" | "previous" | null;
}

export async function fetchExams(
  page: number = 1,
  pageSize: number = 10,
  filters?: ExamFilters,
): Promise<PaginatedResponse<ExamDto>> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (filters?.examTypeId) {
    params.append("examTypeId", String(filters.examTypeId));
  }
  if (filters?.classId) {
    params.append("classId", String(filters.classId));
  }
  if (filters?.academicYearId) {
    params.append("academicYearId", String(filters.academicYearId));
  }
  if (filters?.affiliationId) {
    params.append("affiliationId", String(filters.affiliationId));
  }
  if (filters?.regulationTypeId) {
    params.append("regulationTypeId", String(filters.regulationTypeId));
  }
  if (filters?.dateFrom) {
    params.append("dateFrom", filters.dateFrom);
  }
  if (filters?.dateTo) {
    params.append("dateTo", filters.dateTo);
  }
  if (filters?.status) {
    params.append("status", filters.status);
  }

  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<ExamDto>>>(
    `/api/exams/schedule?${params.toString()}`,
  );
  return response.data.payload;
}

export async function fetchExamById(id: number): Promise<ExamDto> {
  const response = await axiosInstance.get<ApiResponse<ExamDto>>(`/api/exams/schedule/${id}`);
  return response.data.payload;
}

export async function triggerExamAdmitCardByExamId(examId: number, uploadSessionId: string): Promise<boolean> {
  try {
    const response = await axiosInstance.get<ApiResponse<boolean>>(
      `/api/exams/schedule/send-admit-cards?examId=${examId}&uploadSessionId=${uploadSessionId}`,
    );
    return response.data.payload;
  } catch (error: any) {
    console.error("Error triggering admit card emails:", error);

    // Extract error message from response
    let errorMessage = "Failed to send admit cards to students";

    if (error.response?.data) {
      const errorData = error.response.data;
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.payload?.message) {
        errorMessage = errorData.payload.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Provide user-friendly error message
    const userFriendlyMessage =
      errorMessage.toLowerCase().includes("no admit cards") ||
      errorMessage.toLowerCase().includes("not found") ||
      errorMessage.toLowerCase().includes("no candidates")
        ? "No admit cards are available to send. Please ensure students have been assigned to exam rooms and admit cards have been generated."
        : errorMessage.includes("email") || errorMessage.toLowerCase().includes("send")
          ? `Failed to send admit cards: ${errorMessage}`
          : `An error occurred while sending admit cards. ${errorMessage}`;

    throw new Error(userFriendlyMessage);
  }
}

export async function fetchExamPapersStatsByExamId(id: number): Promise<ExamPapersWithStats[]> {
  const response = await axiosInstance.get<ApiResponse<ExamPapersWithStats[]>>(`/api/exams/schedule/exam-papers/${id}`);
  return response.data.payload;
}

export async function fetchExamCandidatesByExamId(id: number): Promise<{ downloadUrl: string; fileName: string }> {
  try {
    const response = await axiosInstance.get(`/api/exams/schedule/exam-candidates/download?examId=${id}`, {
      responseType: "blob",
    });

    // Check if the response is actually an error (JSON error in blob format)
    if (response.data.type === "application/json") {
      const text = await response.data.text();
      const errorData = JSON.parse(text);
      throw new Error(errorData.message || "Failed to download exam candidates");
    }

    const blob = new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const downloadUrl = URL.createObjectURL(blob);

    const contentDisposition = response.headers["content-disposition"];
    let fileName = `exam_${id}-candidates-${new Date().toISOString().split("T")[0]}.xlsx`;

    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
      if (fileNameMatch) {
        fileName = fileNameMatch[1];
      }
    }

    return { downloadUrl, fileName };
  } catch (error: any) {
    // Handle axios errors
    if (error.response?.data) {
      // If error response is a blob, try to parse it
      if (error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || "Failed to download exam candidates");
        } catch {
          // If parsing fails, use default error message
        }
      }
    }
    throw error;
  }
}

export async function updateExamSubject(examSubjectId: number, examSubject: ExamSubjectDto) {
  console.log(examSubjectId);
  const response = await axiosInstance.put<ApiResponse<ExamSubjectDto>>(
    `/api/exams/schedule/exam-subject`,
    examSubject,
  );
  return response.data.payload;
}

export async function updateExamAdmitCardDates(
  examId: number,
  admitCardStartDownloadDate: string | null,
  admitCardLastDownloadDate: string | null,
): Promise<ExamDto> {
  const response = await axiosInstance.put<ApiResponse<ExamDto>>(`/api/exams/schedule/${examId}/admit-card-dates`, {
    admitCardStartDownloadDate,
    admitCardLastDownloadDate,
  });
  return response.data.payload;
}

export async function deleteExamById(examId: number): Promise<{ examId: number }> {
  const response = await axiosInstance.delete<ApiResponse<{ examId: number }>>(`/api/exams/schedule/${examId}`);
  return response.data.payload;
}

export async function downloadAdmitCardTracking(examId: number): Promise<{ downloadUrl: string; fileName: string }> {
  const response = await axiosInstance.get(`/api/exams/schedule/admit-card-tracking/download?examId=${examId}`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const downloadUrl = URL.createObjectURL(blob);

  const contentDisposition = response.headers["content-disposition"];
  let fileName = `exam_${examId}-admit-card-tracking-${new Date().toISOString().split("T")[0]}.xlsx`;

  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
    if (fileNameMatch) {
      fileName = fileNameMatch[1];
    }
  }

  return { downloadUrl, fileName };
}
