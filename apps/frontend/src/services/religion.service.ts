import axiosInstance from "@/utils/api";
import {
  Religion,
  CreateReligionPayload,
  UpdateReligionPayload,
  SingleReligionResponse,
  MultipleReligionResponse,
} from "@/types/resources/religion.types";

const BASE_URL = '/api/religions';

export async function getAllReligions(): Promise<Religion[]> {
  const response = await axiosInstance.get<MultipleReligionResponse>(BASE_URL);
  return response.data.data;
}

export async function getReligionById(id: number): Promise<Religion> {
  const response = await axiosInstance.get<SingleReligionResponse>(`${BASE_URL}/${id}`);
  return response.data.data;
}

export async function createReligion(payload: CreateReligionPayload): Promise<Religion> {
  const response = await axiosInstance.post<SingleReligionResponse>(BASE_URL, payload);
  return response.data.data;
}

export async function updateReligion(id: number, payload: UpdateReligionPayload): Promise<Religion> {
  const response = await axiosInstance.put<SingleReligionResponse>(`${BASE_URL}/${id}`, payload);
  return response.data.data;
}

export async function deleteReligion(id: number): Promise<void> {
  await axiosInstance.delete(`${BASE_URL}/${id}`);
}

export const religionService = {
  getAllReligions,
  getReligionById,
  createReligion,
  updateReligion,
  deleteReligion,
}; 