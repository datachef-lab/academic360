import { ApiResonse } from "@/types/api-response";
import { PaginatedResponse } from "@/types/pagination";
import { Address } from "@/types/resources/address";
import { Category } from "@/types/resources/category";
import { LanguageMedium } from "@/types/resources/language-medium";
import { Nationality } from "@/types/resources/nationality";
import { Occupation } from "@/types/resources/occupation";
import { Qualification } from "@/types/resources/qualification";
import { Religion } from "@/types/resources/religion";
import { Person } from "@/types/user/person";
import { PersonalDetails } from "@/types/user/personal-details";
import axiosInstance from "@/utils/api";


export async function languages(): Promise<ApiResonse<PaginatedResponse<LanguageMedium>>> {
  const response = await axiosInstance.get("/api/languages", { withCredentials: true });
  return response.data;
}

export async function category(): Promise<ApiResonse<PaginatedResponse<Category>>> {
  const response = await axiosInstance.get("/api/categories", { withCredentials: true });
  return response.data;
} 

export async function fetchAddressById(studentId: number): Promise<ApiResonse<Address>> {
  const response = await axiosInstance.get(`/api/address/${studentId}`, { withCredentials: true });
  return response.data;
}

export async function religion(): Promise<ApiResonse<PaginatedResponse<Religion>>> {
  const response = await axiosInstance.get("/api/religions", { withCredentials: true });
  return response.data;
}

export async function nationality(): Promise<ApiResonse<PaginatedResponse<Nationality>>> {
  const response = await axiosInstance.get("/api/nationality", { withCredentials: true });
  return response.data;
}


export async function personalDetails(): Promise<ApiResonse<PersonalDetails>> {
  const response = await axiosInstance.get("/api/personal-details", { withCredentials: true });
  console.log("response is coming for personal detail............", response);
  return response.data;
}

export async function fetchPersonalDetailsByStudentId(studentId: number): Promise<ApiResonse<PersonalDetails>> {
  const response = await axiosInstance.get(`/api/personal-details/student/${studentId}`, { withCredentials: true });
  return response.data;
}
export async function fetchPersonByStudentId(studentId: number): Promise<ApiResonse<Person>> {
  const response = await axiosInstance.get(`/api/person/${studentId}`, { withCredentials: true });
  return response.data;
}
export async function fetchOccupationById(studentId: number): Promise<ApiResonse<Occupation>> {
  const response = await axiosInstance.get(`/api/occupations/${studentId}`, { withCredentials: true });
  return response.data;
}

export async function fetchAllOccupations(): Promise<ApiResonse<Occupation>> {
  const response = await axiosInstance.get("/api/occupations", { withCredentials: true });
  return response.data;
}
export async function fetchAllQualifications(): Promise<ApiResonse<Qualification>> {
  const response = await axiosInstance.get("/api/qualifications", { withCredentials: true });
  return response.data;
}