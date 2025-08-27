import axiosInstance from "@/utils/api";
import {
  Degree,
  CreateDegreePayload,
  UpdateDegreePayload,
  SingleDegreeResponse,
  MultipleDegreeResponse,
} from "@/types/resources/degree.types";

// ============================================================================
// DEGREE SERVICE
// ============================================================================

/**
 * Degree Service
 * 
 * This service handles all CRUD operations for the Degree module.
 * It provides type-safe API communication with the backend.
 */

const BASE_URL = '/api/degree';

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get all degrees
 * @returns Promise<Degree[]> - Array of all degrees
 */
export async function findAllDegrees(): Promise<Degree[]> {
  try {
    const response = await axiosInstance.get<MultipleDegreeResponse>(BASE_URL);
    return response.data.payload || [];
  } catch (error) {
    console.error('Error fetching degrees:', error);
    throw error;
  }
}

/**
 * Get degree by ID
 * @param id - Degree ID
 * @returns Promise<Degree> - Degree data
 */
export async function getDegreeById(id: number): Promise<Degree> {
  try {
    if (!id) {
      throw new Error('Degree ID is required');
    }

    const response = await axiosInstance.get<SingleDegreeResponse>(`${BASE_URL}/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching degree with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get active degrees only
 * @returns Promise<Degree[]> - Array of active degrees
 */
export async function getActiveDegrees(): Promise<Degree[]> {
  try {
    const response = await axiosInstance.get<MultipleDegreeResponse>(`${BASE_URL}?disabled=false`);
    return response.data.payload || [];
  } catch (error) {
    console.error('Error fetching active degrees:', error);
    throw error;
  }
}

/**
 * Get degrees by level
 * @param level - Degree level
 * @returns Promise<Degree[]> - Array of degrees with specified level
 */
export async function getDegreesByLevel(level: string): Promise<Degree[]> {
  try {
    if (!level) {
      throw new Error('Degree level is required');
    }

    const response = await axiosInstance.get<MultipleDegreeResponse>(`${BASE_URL}?level=${encodeURIComponent(level)}`);
    return response.data.payload || [];
  } catch (error) {
    console.error(`Error fetching degrees for level ${level}:`, error);
    throw error;
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new degree
 * @param payload - Degree creation data
 * @returns Promise<Degree> - Created degree data
 */
export async function createDegree(payload: CreateDegreePayload): Promise<Degree> {
  try {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Degree name is required');
    }

    const response = await axiosInstance.post<SingleDegreeResponse>(BASE_URL, payload);
    return response.data.data;
  } catch (error) {
    console.error('Error creating degree:', error);
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update an existing degree
 * @param id - Degree ID
 * @param payload - Degree update data
 * @returns Promise<Degree> - Updated degree data
 */
export async function updateDegree(id: number, payload: UpdateDegreePayload): Promise<Degree> {
  try {
    if (!id) {
      throw new Error('Degree ID is required');
    }

    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('Degree name cannot be empty');
    }

    const response = await axiosInstance.put<SingleDegreeResponse>(`${BASE_URL}/${id}`, payload);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating degree with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a degree
 * @param id - Degree ID
 * @returns Promise<void>
 */
export async function deleteDegree(id: number): Promise<void> {
  try {
    if (!id) {
      throw new Error('Degree ID is required');
    }

    await axiosInstance.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting degree with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// SEARCH AND FILTER OPERATIONS
// ============================================================================

/**
 * Search degrees by name
 * @param searchTerm - Search term for degree name
 * @returns Promise<Degree[]> - Array of matching degrees
 */
export async function searchDegrees(searchTerm: string): Promise<Degree[]> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return findAllDegrees();
    }

    const response = await axiosInstance.get<MultipleDegreeResponse>(
      `${BASE_URL}/search?q=${encodeURIComponent(searchTerm.trim())}`
    );
    return response.data.payload || [];
  } catch (error) {
    console.error('Error searching degrees:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a degree exists by name
 * @param name - Degree name to check
 * @returns Promise<boolean> - True if exists, false otherwise
 */
export async function checkDegreeExists(name: string): Promise<boolean> {
  try {
    if (!name || name.trim().length === 0) {
      return false;
    }

    const response = await axiosInstance.get<MultipleDegreeResponse>(
      `${BASE_URL}?name=${encodeURIComponent(name.trim())}`
    );
    return (response.data.payload || []).length > 0;
  } catch (error) {
    console.error('Error checking degree existence:', error);
    return false;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const degreeService = {
  // Get operations
  findAllDegrees,
  getDegreeById,
  getActiveDegrees,
  getDegreesByLevel,
  
  // Create operations
  createDegree,
  
  // Update operations
  updateDegree,
  
  // Delete operations
  deleteDegree,
  
  // Search and filter operations
  searchDegrees,
  
  // Utility functions
  checkDegreeExists,
};