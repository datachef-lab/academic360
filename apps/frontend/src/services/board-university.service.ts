import axiosInstance from "@/utils/api";
import {
  BoardUniversity,
  CreateBoardUniversityPayload,
  UpdateBoardUniversityPayload,
  SingleBoardUniversityResponse,
  MultipleBoardUniversityResponse,
} from "@/types/resources/board-university.types";

// ============================================================================
// BOARD UNIVERSITY SERVICE
// ============================================================================

/**
 * Board University Service
 * 
 * This service handles all CRUD operations for the Board University module.
 * It provides type-safe API communication with the backend.
 */

const BASE_URL = '/api/board-universities';

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get all board universities
 * @returns Promise<BoardUniversity[]> - Array of all board universities
 */
export async function getAllBoardUniversities(): Promise<BoardUniversity[]> {
  try {
    const response = await axiosInstance.get<MultipleBoardUniversityResponse>(BASE_URL);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching board universities:', error);
    throw error;
  }
}

/**
 * Get board university by ID
 * @param id - Board university ID
 * @returns Promise<BoardUniversity> - Board university data
 */
export async function getBoardUniversityById(id: number): Promise<BoardUniversity> {
  try {
    if (!id) {
      throw new Error('Board university ID is required');
    }

    const response = await axiosInstance.get<SingleBoardUniversityResponse>(`${BASE_URL}/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching board university with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get active board universities only
 * @returns Promise<BoardUniversity[]> - Array of active board universities
 */
export async function getActiveBoardUniversities(): Promise<BoardUniversity[]> {
  try {
    const response = await axiosInstance.get<MultipleBoardUniversityResponse>(`${BASE_URL}?disabled=false`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching active board universities:', error);
    throw error;
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new board university
 * @param payload - Board university creation data
 * @returns Promise<BoardUniversity> - Created board university data
 */
export async function createBoardUniversity(payload: CreateBoardUniversityPayload): Promise<BoardUniversity> {
  try {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Board university name is required');
    }

    const response = await axiosInstance.post<SingleBoardUniversityResponse>(BASE_URL, payload);
    return response.data.data;
  } catch (error) {
    console.error('Error creating board university:', error);
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update an existing board university
 * @param id - Board university ID
 * @param payload - Board university update data
 * @returns Promise<BoardUniversity> - Updated board university data
 */
export async function updateBoardUniversity(id: number, payload: UpdateBoardUniversityPayload): Promise<BoardUniversity> {
  try {
    if (!id) {
      throw new Error('Board university ID is required');
    }

    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('Board university name cannot be empty');
    }

    const response = await axiosInstance.put<SingleBoardUniversityResponse>(`${BASE_URL}/${id}`, payload);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating board university with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a board university
 * @param id - Board university ID
 * @returns Promise<void>
 */
export async function deleteBoardUniversity(id: number): Promise<void> {
  try {
    if (!id) {
      throw new Error('Board university ID is required');
    }

    await axiosInstance.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting board university with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// SEARCH AND FILTER OPERATIONS
// ============================================================================

/**
 * Search board universities by name
 * @param searchTerm - Search term for board university name
 * @returns Promise<BoardUniversity[]> - Array of matching board universities
 */
export async function searchBoardUniversities(searchTerm: string): Promise<BoardUniversity[]> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return getAllBoardUniversities();
    }

    const response = await axiosInstance.get<MultipleBoardUniversityResponse>(
      `${BASE_URL}/search?q=${encodeURIComponent(searchTerm.trim())}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error searching board universities:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a board university exists by name
 * @param name - Board university name to check
 * @returns Promise<boolean> - True if exists, false otherwise
 */
export async function checkBoardUniversityExists(name: string): Promise<boolean> {
  try {
    if (!name || name.trim().length === 0) {
      return false;
    }

    const response = await axiosInstance.get<MultipleBoardUniversityResponse>(
      `${BASE_URL}?name=${encodeURIComponent(name.trim())}`
    );
    return response.data.data.length > 0;
  } catch (error) {
    console.error('Error checking board university existence:', error);
    return false;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const boardUniversityService = {
  // Get operations
  getAllBoardUniversities,
  getBoardUniversityById,
  getActiveBoardUniversities,
  
  // Create operations
  createBoardUniversity,
  
  // Update operations
  updateBoardUniversity,
  
  // Delete operations
  deleteBoardUniversity,
  
  // Search and filter operations
  searchBoardUniversities,
  
  // Utility functions
  checkBoardUniversityExists,
}; 