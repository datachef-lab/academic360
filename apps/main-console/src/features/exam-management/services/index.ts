import type { ExamDto } from "@/dtos";
import type { ExamT } from "@repo/db/schemas";
import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";

const BASE_URL = "/api/exams/schedule";

// export async function doAssignExam(dto: ExamDto, file: File | null): Promise<ApiResponse<ExamT>> {
//   try {
//     const response = await axiosInstance.post(BASE_URL, dto);
//     console.log("In doAssignExam(), response:", response);
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching all academic histories:", error);
//     throw new Error("Failed to fetch all academic histories");
//   }
// }

export async function doAssignExam(dto: ExamDto, file: File | null): Promise<ApiResponse<ExamT>> {
  try {
    const formData = new FormData();

    console.log("in ui, doAssignExam(), service api call:", dto);

    // Append DTO fields
    Object.entries(dto).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v, i) => {
          if (typeof v === "object") {
            Object.entries(v).forEach(([k, val]) => {
              formData.append(`${key}[${i}][${k}]`, String(val ?? ""));
            });
          } else {
            formData.append(`${key}[]`, String(v));
          }
        });
      } else if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // Append Excel file
    if (file) {
      formData.append("file", file); // 🔑 MUST be "file"
    }

    const response = await axiosInstance.post(BASE_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("In doAssignExam(), response:", response);
    return response.data;
  } catch (error) {
    console.error("Error assigning exam:", error);
    throw new Error("Failed to assign exam");
  }
}
