import axiosInstance from "@/utils/api";
import {
  BoardResultStatus,
  CreateBoardResultStatusPayload,
  UpdateBoardResultStatusPayload,
  SingleBoardResultStatusResponse,
  MultipleBoardResultStatusResponse,
} from "@/types/resources/board-result-status.types";

// ============================================================================
// BOARD RESULT STATUS SERVICE
// ============================================================================

/**
 * Board Result Status Service
 * 
 * This service handles all CRUD operations for the Board Result Status module.
 * It provides type-safe API communication with the backend.
 */

const BASE_URL = '/api/resultstatus';

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get all board result statuses
 * @returns Promise<BoardResultStatus[]> - Array of all board result statuses
 */
export async function getAllBoardResultStatuses(): Promise<BoardResultStatus[]> {
  try {
    const response = await axiosInstance.get<MultipleBoardResultStatusResponse>(BASE_URL);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching board result statuses:', error);
    throw error;
  }
}

/**
 * Get board result status by ID
 * @param id - Board result status ID
 * @returns Promise<BoardResultStatus> - Board result status data
 */
export async function getBoardResultStatusById(id: number): Promise<BoardResultStatus> {
  try {
    if (!id) {
      throw new Error('Board result status ID is required');
    }

    const response = await axiosInstance.get<SingleBoardResultStatusResponse>(`${BASE_URL}/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching board result status with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get active board result statuses only
 * @returns Promise<BoardResultStatus[]> - Array of active board result statuses
 */
export async function getActiveBoardResultStatuses(): Promise<BoardResultStatus[]> {
  try {
    const response = await axiosInstance.get<MultipleBoardResultStatusResponse>(`${BASE_URL}?disabled=false`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching active board result statuses:', error);
    throw error;
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new board result status
 * @param payload - Board result status creation data
 * @returns Promise<BoardResultStatus> - Created board result status data
 */
export async function createBoardResultStatus(payload: CreateBoardResultStatusPayload): Promise<BoardResultStatus> {
  try {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Board result status name is required');
    }

    const response = await axiosInstance.post<SingleBoardResultStatusResponse>(BASE_URL, payload);
    return response.data.data;
  } catch (error) {
    console.error('Error creating board result status:', error);
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update an existing board result status
 * @param id - Board result status ID
 * @param payload - Board result status update data
 * @returns Promise<BoardResultStatus> - Updated board result status data
 */
export async function updateBoardResultStatus(id: number, payload: UpdateBoardResultStatusPayload): Promise<BoardResultStatus> {
  try {
    if (!id) {
      throw new Error('Board result status ID is required');
    }

    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('Board result status name cannot be empty');
    }

    const response = await axiosInstance.put<SingleBoardResultStatusResponse>(`${BASE_URL}/${id}`, payload);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating board result status with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a board result status
 * @param id - Board result status ID
 * @returns Promise<void>
 */
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

// ============================================================================
// SEARCH AND FILTER OPERATIONS
// ============================================================================

/**
 * Search board result statuses by name
 * @param searchTerm - Search term for board result status name
 * @returns Promise<BoardResultStatus[]> - Array of matching board result statuses
 */
export async function searchBoardResultStatuses(searchTerm: string): Promise<BoardResultStatus[]> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return getAllBoardResultStatuses();
    }

    const response = await axiosInstance.get<MultipleBoardResultStatusResponse>(
      `${BASE_URL}/search?q=${encodeURIComponent(searchTerm.trim())}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error searching board result statuses:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a board result status exists by name
 * @param name - Board result status name to check
 * @returns Promise<boolean> - True if exists, false otherwise
 */
export async function checkBoardResultStatusExists(name: string): Promise<boolean> {
  try {
    if (!name || name.trim().length === 0) {
      return false;
    }

    const response = await axiosInstance.get<MultipleBoardResultStatusResponse>(
      `${BASE_URL}?name=${encodeURIComponent(name.trim())}`
    );
    return response.data.data.length > 0;
  } catch (error) {
    console.error('Error checking board result status existence:', error);
    return false;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const boardResultStatusService = {
  // Get operations
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