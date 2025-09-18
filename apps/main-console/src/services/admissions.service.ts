// import { AcademicYear } from "@/types/academics/academic-year";
import { Course } from "@/types/course-design";
import { Admission } from "@/types/admissions";
import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";
import { AdmissionSummary } from "@/pages/admissions-fees/admissions/types";
// import {Admission} from "@/types/admissions"

export interface AdmissionUpdatePayload {
  admission: Admission;
  courses: Course[];
}

// API helpers using axios
export async function fetchAdmissions(): Promise<ApiResponse<AdmissionSummary[]>> {
  const res = await axiosInstance.get<ApiResponse<AdmissionSummary[]>>("/api/admissions");
  console.log("fetchAdmissions response:", res.data);

  return res.data;
}
export async function fetchAdmissionStats() {
  const res = await axiosInstance.get("/api/admissions/stats");
  console.log("fetchAdmissionStats response:", res.data);
  return res.data.data;
}

export async function fetchStatsSummary() {
  const res = await axiosInstance.get("/api/admissions/stats-summary");
  console.log("fetchStatsSummary response:", res.data);
  return res.data.data;
}

export async function fetchAdmissionSummaries() {
  const res = await axiosInstance.get("/api/admissions/summary");
  return res.data.data;
}

export async function createAdmission(admission: Admission) {
  const res = await axiosInstance.post("/api/admissions", admission);
  return res.data;
}

export async function updateAdmission(id: number, admission: Admission) {
  const res = await axiosInstance.put(`/api/admissions/${id}`, admission);
  return res.data;
}

export async function findAdmissionById(id: number): Promise<ApiResponse<Admission>> {
  const res = await axiosInstance.get(`/api/admissions/${id}`);
  return res.data;
}

export async function fetchAcademicYears() {
  const res = await axiosInstance.get("/api/v1/academics/all");
  console.log("/api/v1/academics/all: ", res.data);
  return res.data;
}

export async function fetchApplicationFormsByAdmissionId(admissionId: number) {
  const res = await axiosInstance.get(`/api/admissions/application-forms/admission/${admissionId}`);
  return res.data.data;
}

// Board Subject Names API
export interface BoardSubjectName {
  id: number;
  name: string;
  code: string | null;
}

export async function getActiveBoardSubjectNames(): Promise<BoardSubjectName[]> {
  const res = await axiosInstance.get<ApiResponse<BoardSubjectName[]>>("/api/admissions/board-subject-names/active");
  return res.data.payload;
}
