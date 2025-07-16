import axiosInstance from "@/utils/api";
import {
  Transport,
  CreateTransportPayload,
  UpdateTransportPayload,
  SingleTransportResponse,
  MultipleTransportResponse,
} from "@/types/resources/transport.types";

const BASE_URL = '/api/transports';

export async function getAllTransports(): Promise<Transport[]> {
  const response = await axiosInstance.get<MultipleTransportResponse>(BASE_URL);
  return response.data.data;
}

export async function getTransportById(id: number): Promise<Transport> {
  const response = await axiosInstance.get<SingleTransportResponse>(`${BASE_URL}/${id}`);
  return response.data.data;
}

export async function getTransportsByMode(mode: string): Promise<Transport[]> {
  const response = await axiosInstance.get<MultipleTransportResponse>(`${BASE_URL}?mode=${mode}`);
  return response.data.data;
}

export async function createTransport(payload: CreateTransportPayload): Promise<Transport> {
  const response = await axiosInstance.post<SingleTransportResponse>(BASE_URL, payload);
  return response.data.data;
}

export async function updateTransport(id: number, payload: UpdateTransportPayload): Promise<Transport> {
  const response = await axiosInstance.put<SingleTransportResponse>(`${BASE_URL}/${id}`, payload);
  return response.data.data;
}

export async function deleteTransport(id: number): Promise<void> {
  await axiosInstance.delete(`${BASE_URL}/${id}`);
}

export const transportService = {
  getAllTransports,
  getTransportById,
  getTransportsByMode,
  createTransport,
  updateTransport,
  deleteTransport,
}; 