import { ApiResonse } from "@/types/api-response";
import { Accommodation } from "@/types/user/accommodation";
import axiosInstance from "@/utils/api";

const BASE_URL = "/api/accommodations";

export async function getAllAccommodations(): Promise<ApiResonse<Accommodation[]>> {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  } catch {
    throw new Error("Failed to fetch all accommodations");
  }
}

export async function getAccommodationById(id: number): Promise<ApiResonse<Accommodation | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch accommodation with id ${id}`);
  }
}

export async function getAccommodationByStudentId(studentId: number): Promise<ApiResonse<Accommodation | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/student/${studentId}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch accommodation for studentId ${studentId}`);
  }
}

export async function createAccommodation(payload: Partial<Accommodation>): Promise<ApiResonse<Accommodation>> {
  try {
    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data;
  } catch {
    throw new Error("Failed to create accommodation");
  }
}

export async function updateAccommodation(id: number, payload: Partial<Accommodation>): Promise<ApiResonse<Accommodation>> {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data;
  } catch {
    throw new Error(`Failed to update accommodation with id ${id}`);
  }
}

export async function deleteAccommodation(id: number): Promise<ApiResonse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete accommodation with id ${id}`);
  }
}

export async function deleteAccommodationByStudentId(studentId: number): Promise<ApiResonse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/student/${studentId}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete accommodation for studentId ${studentId}`);
  }
}
