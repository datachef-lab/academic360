import axiosInstance from "@/utils/api";
import {
  Qualification,
  CreateQualificationPayload,
  UpdateQualificationPayload,
  SingleQualificationResponse,
  MultipleQualificationResponse,
} from "@/types/resources/qualification.types";

const BASE_URL = '/api/qualifications';

export async function getAllQualifications(): Promise<Qualification[]> {
  const response = await axiosInstance.get<MultipleQualificationResponse>(BASE_URL);
  return response.data.data;
}

export async function getQualificationById(id: number): Promise<Qualification> {
  const response = await axiosInstance.get<SingleQualificationResponse>(`${BASE_URL}/${id}`);
  return response.data.data;
}

export async function createQualification(payload: CreateQualificationPayload): Promise<Qualification> {
  const response = await axiosInstance.post<SingleQualificationResponse>(BASE_URL, payload);
  return response.data.data;
}

export async function updateQualification(id: number, payload: UpdateQualificationPayload): Promise<Qualification> {
  const response = await axiosInstance.put<SingleQualificationResponse>(`${BASE_URL}/${id}`, payload);
  return response.data.data;
}

export async function deleteQualification(id: number): Promise<void> {
  await axiosInstance.delete(`${BASE_URL}/${id}`);
}

export const qualificationService = {
  getAllQualifications,
  getQualificationById,
  createQualification,
  updateQualification,
  deleteQualification,
}; 