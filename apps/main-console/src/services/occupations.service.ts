import axiosInstance from "@/utils/api";
import {
  Occupation,
  CreateOccupationPayload,
  UpdateOccupationPayload,
  SingleOccupationResponse,
  MultipleOccupationResponse,
} from "@/types/resources/occupation.types";

const BASE_URL = '/api/occupations';

export async function getAllOccupations(): Promise<Occupation[]> {
  const response = await axiosInstance.get<MultipleOccupationResponse>(BASE_URL);
  return response.data.data;
}

export async function getOccupationById(id: number): Promise<Occupation> {
  const response = await axiosInstance.get<SingleOccupationResponse>(`${BASE_URL}/${id}`);
  return response.data.data;
}

export async function createOccupation(payload: CreateOccupationPayload): Promise<Occupation> {
  const response = await axiosInstance.post<SingleOccupationResponse>(BASE_URL, payload);
  return response.data.data;
}

export async function updateOccupation(id: number, payload: UpdateOccupationPayload): Promise<Occupation> {
  const response = await axiosInstance.put<SingleOccupationResponse>(`${BASE_URL}/${id}`, payload);
  return response.data.data;
}

export async function deleteOccupation(id: number): Promise<void> {
  await axiosInstance.delete(`${BASE_URL}/${id}`);
}

export const occupationService = {
  getAllOccupations,
  getOccupationById,
  createOccupation,
  updateOccupation,
  deleteOccupation,
}; 