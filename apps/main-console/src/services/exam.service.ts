import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";
import { PaginatedResponse } from "./course-design.api";
import { ExamDto, ExamPapersWithStats, ExamSubjectDto } from "@/dtos";

export async function fetchExams(page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<ExamDto>> {
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<ExamDto>>>(
    `/api/exams/schedule?page=${page}&pageSize=${pageSize}`,
  );
  return response.data.payload;
}

export async function fetchExamById(id: number): Promise<ExamDto> {
  const response = await axiosInstance.get<ApiResponse<ExamDto>>(`/api/exams/schedule/${id}`);
  return response.data.payload;
}

export async function triggerExamAdmitCardByExamId(examId: number, uploadSessionId: string): Promise<boolean> {
  const response = await axiosInstance.get<ApiResponse<boolean>>(
    `/api/exams/schedule/send-admit-cards?examId=${examId}&uploadSessionId=${uploadSessionId}`,
  );
  return response.data.payload;
}

export async function fetchExamPapersStatsByExamId(id: number): Promise<ExamPapersWithStats[]> {
  const response = await axiosInstance.get<ApiResponse<ExamPapersWithStats[]>>(`/api/exams/schedule/exam-papers/${id}`);
  return response.data.payload;
}

export async function fetchExamCandidatesByExamId(id: number): Promise<{ downloadUrl: string; fileName: string }> {
  const response = await axiosInstance.get(`/api/exams/schedule/exam-candidates/download?examId=${id}`, {
    responseType: "blob",
  });

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
