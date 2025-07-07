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
  const response = await axiosInstance.get<MultipleNationalityResponse>(BASE_URL);
  return response.data.data;
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