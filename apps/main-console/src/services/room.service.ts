import { ApiResponse } from "@/types/api-response";
import type { RoomT } from "@repo/db/schemas/models/exams";
import axiosInstance from "@/utils/api";
import { RoomDto } from "@/dtos";

export type { RoomT };

const BASE_URL = "/api/exams/rooms";

// Get all rooms
export async function getAllRooms(): Promise<ApiResponse<RoomDto[]>> {
  try {
    const response = await axiosInstance.get<ApiResponse<RoomDto[]>>(BASE_URL);
    return response.data;
  } catch {
    throw new Error("Failed to fetch all rooms");
  }
}

// Get a single room by id
export async function getRoomById(id: number): Promise<ApiResponse<RoomT>> {
  try {
    const response = await axiosInstance.get<ApiResponse<RoomT>>(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch room with id ${id}`);
  }
}

// Create a new room
export async function createRoom(payload: Partial<RoomT>): Promise<ApiResponse<RoomT>> {
  try {
    const response = await axiosInstance.post<ApiResponse<RoomT>>(BASE_URL, payload);
    return response.data;
  } catch {
    throw new Error("Failed to create room");
  }
}

// Update a room
export async function updateRoom(id: number, payload: Partial<RoomT>): Promise<ApiResponse<RoomT>> {
  try {
    const response = await axiosInstance.put<ApiResponse<RoomT>>(`${BASE_URL}/${id}`, payload);
    return response.data;
  } catch {
    throw new Error(`Failed to update room with id ${id}`);
  }
}

// Delete a room
export async function deleteRoom(id: number): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete<ApiResponse<null>>(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete room with id ${id}`);
  }
}
