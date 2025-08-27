import axiosInstance from "@/utils/api";
import {
  PickupPoint,
  CreatePickupPointPayload,
  UpdatePickupPointPayload,
  SinglePickupPointResponse,
  MultiplePickupPointResponse,
} from "@/types/resources/pickup-point.types";

const BASE_URL = '/api/pickup-points';

export async function getAllPickupPoints(): Promise<PickupPoint[]> {
  const response = await axiosInstance.get<MultiplePickupPointResponse>(BASE_URL);
  return response.data.data;
}

export async function getPickupPointById(id: number): Promise<PickupPoint> {
  const response = await axiosInstance.get<SinglePickupPointResponse>(`${BASE_URL}/${id}`);
  return response.data.data;
}

export async function createPickupPoint(payload: CreatePickupPointPayload): Promise<PickupPoint> {
  const response = await axiosInstance.post<SinglePickupPointResponse>(BASE_URL, payload);
  return response.data.data;
}

export async function updatePickupPoint(id: number, payload: UpdatePickupPointPayload): Promise<PickupPoint> {
  const response = await axiosInstance.put<SinglePickupPointResponse>(`${BASE_URL}/${id}`, payload);
  return response.data.data;
}

export async function deletePickupPoint(id: number): Promise<void> {
  await axiosInstance.delete(`${BASE_URL}/${id}`);
}

export const pickupPointService = {
  getAllPickupPoints,
  getPickupPointById,
  createPickupPoint,
  updatePickupPoint,
  deletePickupPoint,
}; 