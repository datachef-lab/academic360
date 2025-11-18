import { ApiResponse } from "@/types/api-response";
import { FloorT } from "@repo/db/schemas/models/exams";
import axiosInstance from "@/utils/api";

export type { FloorT };

const BASE_URL = "/api/exams/floors";

// Get all floors
export async function getAllFloors(): Promise<ApiResponse<FloorT[]>> {
  try {
    const response = await axiosInstance.get<ApiResponse<FloorT[]>>(BASE_URL);
    return response.data;
  } catch {
    throw new Error("Failed to fetch all floors");
  }
}

// Get a single floor by id
export async function getFloorById(id: number): Promise<ApiResponse<FloorT>> {
  try {
    const response = await axiosInstance.get<ApiResponse<FloorT>>(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to fetch floor with id ${id}`);
  }
}

// Create a new floor
export async function createFloor(payload: Partial<FloorT>): Promise<ApiResponse<FloorT>> {
  try {
    const response = await axiosInstance.post<ApiResponse<FloorT>>(BASE_URL, payload);
    return response.data;
  } catch {
    throw new Error("Failed to create floor");
  }
}

// Update a floor
export async function updateFloor(id: number, payload: Partial<FloorT>): Promise<ApiResponse<FloorT>> {
  try {
    const response = await axiosInstance.put<ApiResponse<FloorT>>(`${BASE_URL}/${id}`, payload);
    return response.data;
  } catch {
    throw new Error(`Failed to update floor with id ${id}`);
  }
}

// Delete a floor
export async function deleteFloor(id: number): Promise<ApiResponse<null>> {
  try {
    const response = await axiosInstance.delete<ApiResponse<null>>(`${BASE_URL}/${id}`);
    return response.data;
  } catch {
    throw new Error(`Failed to delete floor with id ${id}`);
  }
}
