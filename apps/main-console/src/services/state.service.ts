import axiosInstance from "@/utils/api";
import {
  State,
  CreateStatePayload,
  UpdateStatePayload,
  SingleStateResponse,
  MultipleStateResponse,
} from "@/types/resources/state.types";

const BASE_URL = '/api/states';

export async function getAllStates(): Promise<State[]> {
  const response = await axiosInstance.get<MultipleStateResponse>(BASE_URL);
  return response.data.payload || [];
}

export async function getStateById(id: number): Promise<State> {
  const response = await axiosInstance.get<SingleStateResponse>(`${BASE_URL}/${id}`);
  return response.data.data;
}

export async function getStatesByCountry(countryId: number): Promise<State[]> {
  const response = await axiosInstance.get<MultipleStateResponse>(`${BASE_URL}?countryId=${countryId}`);
  return response.data.payload || [];
}

export async function createState(payload: CreateStatePayload): Promise<State> {
  const response = await axiosInstance.post<SingleStateResponse>(BASE_URL, payload);
  return response.data.data;
}

export async function updateState(id: number, payload: UpdateStatePayload): Promise<State> {
  const response = await axiosInstance.put<SingleStateResponse>(`${BASE_URL}/${id}`, payload);
  return response.data.data;
}

export async function deleteState(id: number): Promise<void> {
  await axiosInstance.delete(`${BASE_URL}/${id}`);
}

export const stateService = {
  getAllStates,
  getStateById,
  getStatesByCountry,
  createState,
  updateState,
  deleteState,
}; 