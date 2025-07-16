import axiosInstance from "@/utils/api";
import {
  BoardResultStatus,
  CreateBoardResultStatusPayload,
  UpdateBoardResultStatusPayload,
} from "@/types/resources/board-result-status.types";


const BASE_URL = '/api/board-result-statuses';

export async function getAllBoardResultStatuses(): Promise<BoardResultStatus[]> {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data.payload;
  } catch (error) {
    console.error('Error fetching board result statuses:', error);
    throw error;
  }
}

export async function getBoardResultStatusById(id: number): Promise<BoardResultStatus> {
  try {
    if (!id) {
      throw new Error('Board result status ID is required');
    }
    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data.payload;
  } catch (error) {
    console.error(`Error fetching board result status with ID ${id}:`, error);
    throw error;
  }
}

export async function getActiveBoardResultStatuses(): Promise<BoardResultStatus[]> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}?disabled=false`);
    return response.data.payload;
  } catch (error) {
    console.error('Error fetching active board result statuses:', error);
    throw error;
  }
}

export async function createBoardResultStatus(payload: CreateBoardResultStatusPayload): Promise<BoardResultStatus> {
  try {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Board result status name is required');
    }
    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data.payload;
  } catch (error) {
    console.error('Error creating board result status:', error);
    throw error;
  }
}

export async function updateBoardResultStatus(id: number, payload: UpdateBoardResultStatusPayload): Promise<BoardResultStatus> {
  try {
    if (!id) {
      throw new Error('Board result status ID is required');
    }
    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('Board result status name cannot be empty');
    }
    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data.payload;
  } catch (error) {
    console.error(`Error updating board result status with ID ${id}:`, error);
    throw error;
  }
}

export async function deleteBoardResultStatus(id: number): Promise<void> {
  try {
    if (!id) {
      throw new Error('Board result status ID is required');
    }
    await axiosInstance.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting board result status with ID ${id}:`, error);
    throw error;
  }
}

export async function searchBoardResultStatuses(searchTerm: string): Promise<BoardResultStatus[]> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return getAllBoardResultStatuses();
    }
    const response = await axiosInstance.get(
      `${BASE_URL}/search?q=${encodeURIComponent(searchTerm.trim())}`
    );
    return response.data.payload;
  } catch (error) {
    console.error('Error searching board result statuses:', error);
    throw error;
  }
}

export async function checkBoardResultStatusExists(name: string): Promise<boolean> {
  try {
    if (!name || name.trim().length === 0) {
      return false;
    }
    const response = await axiosInstance.get(
      `${BASE_URL}?name=${encodeURIComponent(name.trim())}`
    );
    return response.data.payload.length > 0;
  } catch (error) {
    console.error('Error checking board result status existence:', error);
    return false;
  }
}

export const boardResultStatusService = {
  
  getAllBoardResultStatuses,
  getBoardResultStatusById,
  getActiveBoardResultStatuses,
  
  // Create operations
  createBoardResultStatus,
  
  // Update operations
  updateBoardResultStatus,
  
  // Delete operations
  deleteBoardResultStatus,
  
  // Search and filter operations
  searchBoardResultStatuses,
  
  // Utility functions
  checkBoardResultStatusExists,
}; 