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

// export async function doAssignExam(dto: ExamDto, file: File | null): Promise<ApiResponse<ExamT>> {
//   try {
//     const formData = new FormData();

//     console.log("in ui, doAssignExam(), service api call:", dto);

//     // Append DTO fields
//     Object.entries(dto).forEach(([key, value]) => {
//       if (Array.isArray(value)) {
//         value.forEach((v, i) => {
//           if (typeof v === "object") {
//             Object.entries(v).forEach(([k, val]) => {
//               formData.append(`${key}[${i}][${k}]`, String(val ?? ""));
//             });
//           } else {
//             formData.append(`${key}[]`, String(v));
//           }
//         });
//       } else if (value !== undefined && value !== null) {
//         formData.append(key, String(value));
//       }
//     });

//     // Append Excel file
//     if (file) {
//       formData.append("file", file); // 🔑 MUST be "file"
//     }

//     const response = await axiosInstance.post(BASE_URL, formData, {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     });

//     console.log("In doAssignExam(), response:", response);
//     return response.data;
//   } catch (error) {
//     console.error("Error assigning exam:", error);
//     throw new Error("Failed to assign exam");
//   }
// }

export async function doAssignExam(dto: ExamDto, file: File | null): Promise<ApiResponse<ExamT>> {
  try {
    const formData = new FormData();

    console.log("in ui, doAssignExam(), sending dto + file:", dto);

    // ✅ Send DTO as JSON (single field)
    formData.append("dto", JSON.stringify(dto));

    // ✅ Send file
    if (file) {
      formData.append("file", file);
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

export interface AllotExamParams {
  locations: Array<{
    roomId: number;
    studentsPerBench: number;
    capacity: number;
    room: {
      id: number;
      name: string;
      floor?: {
        id: number;
        name: string;
      } | null;
    };
  }>;
  orderType: "CU_ROLL_NUMBER" | "UID" | "CU_REGISTRATION_NUMBER";
  gender: "MALE" | "FEMALE" | "OTHER" | null;
}

export async function allotExamRoomsAndStudents(
  examId: number,
  params: AllotExamParams,
  file: File | null,
): Promise<ApiResponse<{ examId: number; totalStudentsAssigned: number; roomsAssigned: number; message: string }>> {
  try {
    const formData = new FormData();

    console.log("in ui, allotExamRoomsAndStudents(), sending params + file:", params);

    // Send locations, orderType, and gender as JSON
    formData.append("locations", JSON.stringify(params.locations));
    formData.append("orderType", params.orderType);
    // Always send gender, even if null
    formData.append("gender", params.gender || "");

    // Send file
    if (file) {
      formData.append("file", file);
    }

    const response = await axiosInstance.post(`${BASE_URL}/${examId}/allot`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("In allotExamRoomsAndStudents(), response:", response);
    return response.data;
  } catch (error) {
    console.error("Error allotting exam rooms and students:", error);
    throw new Error("Failed to allot exam rooms and students");
  }
}
