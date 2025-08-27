import { ApiResonse } from "@/types/api-response";
import { EmergencyContact } from "@/types/user/emergency-contact";
import axiosInstance from "@/utils/api";

const BASE_URL = "/api/emergency-contact";

export async function getAllEmergencyContacts(): Promise<ApiResonse<EmergencyContact[]>> {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data;
  } catch {
    throw new Error("Failed to fetch all emergency contacts");
  }
}

export async function getEmergencyContactById(id: number): Promise<ApiResonse<EmergencyContact | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch emergency contact with id ${id}`);
  }
}

export async function getEmergencyContactByStudentId(studentId: number): Promise<ApiResonse<EmergencyContact | null>> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}/student/${studentId}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch emergency contact for studentId ${studentId}`);
  }
}

export async function createEmergencyContact(payload: Partial<EmergencyContact>): Promise<ApiResonse<EmergencyContact>> {
  try {
    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data;
  } catch {
    throw new Error("Failed to create emergency contact");
  }
}

export async function updateEmergencyContact(id: number, payload: Partial<EmergencyContact>): Promise<ApiResonse<EmergencyContact>> {
  try {
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data;
  } catch {
    throw new Error(`Failed to update emergency contact with id ${id}`);
  }
}

export async function deleteEmergencyContact(id: number): Promise<ApiResonse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete emergency contact with id ${id}`);
  }
}

export async function deleteEmergencyContactByStudentId(studentId: number): Promise<ApiResonse<null>> {
  try {
    const response = await axiosInstance.delete(`${BASE_URL}/student/${studentId}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete emergency contact for studentId ${studentId}`);
  }
}
