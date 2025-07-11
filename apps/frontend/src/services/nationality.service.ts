import axiosInstance from "@/utils/api";
import {
  Nationality,
  CreateNationalityPayload,
  UpdateNationalityPayload,
  SingleNationalityResponse,
  MultipleNationalityResponse,
} from "@/types/resources/nationality.types";

const BASE_URL = '/api/nationality';

export async function getAllNationalities(): Promise<Nationality[]> {
  try {
    const response = await axiosInstance.get<MultipleNationalityResponse>(BASE_URL);
    const responseData = response.data;
    
    // Check if response has payload property (like personal details API)
    if ('payload' in responseData && Array.isArray(responseData.payload)) {
      return responseData.payload;
    }
    
    // Fallback to data property (original expected structure)
    if ('data' in responseData && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    
    // Return empty array if neither structure matches
    return [];
  } catch (error) {
    console.error('Error fetching nationalities:', error);
    throw error;
  }
}

export async function getNationalityById(id: number): Promise<Nationality> {
  const response = await axiosInstance.get<SingleNationalityResponse>(`${BASE_URL}/${id}`);
  return response.data.data;
}

export async function createNationality(payload: CreateNationalityPayload): Promise<Nationality> {
  const response = await axiosInstance.post<SingleNationalityResponse>(BASE_URL, payload);
  return response.data.data;
}

export async function updateNationality(id: number, payload: UpdateNationalityPayload): Promise<Nationality> {
  const response = await axiosInstance.put<SingleNationalityResponse>(`${BASE_URL}/${id}`, payload);
  return response.data.data;
}

export async function deleteNationality(id: number): Promise<void> {
  await axiosInstance.delete(`${BASE_URL}/${id}`);
}

export const nationalityService = {
  getAllNationalities,
  getNationalityById,
  createNationality,
  updateNationality,
  deleteNationality,
}; 