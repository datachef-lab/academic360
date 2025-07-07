import axiosInstance from "@/utils/api";
import {
  Institution,
  CreateInstitutionPayload,
  UpdateInstitutionPayload,
  SingleInstitutionResponse,
  MultipleInstitutionResponse,
} from "@/types/resources/institution.types";

// ============================================================================
// INSTITUTION SERVICE
// ============================================================================

/**
 * Institution Service
 * 
 * This service handles all CRUD operations for the Institution module.
 * It provides type-safe API communication with the backend.
 */

const BASE_URL = '/api/institutions';

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get all institutions
 * @returns Promise<Institution[]> - Array of all institutions
 */
export async function getAllInstitutions(): Promise<Institution[]> {
  try {
    const response = await axiosInstance.get<MultipleInstitutionResponse>(BASE_URL);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching institutions:', error);
    throw error;
  }
}

/**
 * Get institution by ID
 * @param id - Institution ID
 * @returns Promise<Institution> - Institution data
 */
export async function getInstitutionById(id: number): Promise<Institution> {
  try {
    if (!id) {
      throw new Error('Institution ID is required');
    }

    const response = await axiosInstance.get<SingleInstitutionResponse>(`${BASE_URL}/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching institution with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get active institutions only
 * @returns Promise<Institution[]> - Array of active institutions
 */
export async function getActiveInstitutions(): Promise<Institution[]> {
  try {
    const response = await axiosInstance.get<MultipleInstitutionResponse>(`${BASE_URL}?disabled=false`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching active institutions:', error);
    throw error;
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new institution
 * @param payload - Institution creation data
 * @returns Promise<Institution> - Created institution data
 */
export async function createInstitution(payload: CreateInstitutionPayload): Promise<Institution> {
  try {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Institution name is required');
    }

    const response = await axiosInstance.post<SingleInstitutionResponse>(BASE_URL, payload);
    return response.data.data;
  } catch (error) {
    console.error('Error creating institution:', error);
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update an existing institution
 * @param id - Institution ID
 * @param payload - Institution update data
 * @returns Promise<Institution> - Updated institution data
 */
export async function updateInstitution(id: number, payload: UpdateInstitutionPayload): Promise<Institution> {
  try {
    if (!id) {
      throw new Error('Institution ID is required');
    }

    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('Institution name cannot be empty');
    }

    const response = await axiosInstance.put<SingleInstitutionResponse>(`${BASE_URL}/${id}`, payload);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating institution with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete an institution
 * @param id - Institution ID
 * @returns Promise<void>
 */
export async function deleteInstitution(id: number): Promise<void> {
  try {
    if (!id) {
      throw new Error('Institution ID is required');
    }

    await axiosInstance.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting institution with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// SEARCH AND FILTER OPERATIONS
// ============================================================================

/**
 * Search institutions by name
 * @param searchTerm - Search term for institution name
 * @returns Promise<Institution[]> - Array of matching institutions
 */
export async function searchInstitutions(searchTerm: string): Promise<Institution[]> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return getAllInstitutions();
    }

    const response = await axiosInstance.get<MultipleInstitutionResponse>(
      `${BASE_URL}/search?q=${encodeURIComponent(searchTerm.trim())}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error searching institutions:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if an institution exists by name
 * @param name - Institution name to check
 * @returns Promise<boolean> - True if exists, false otherwise
 */
export async function checkInstitutionExists(name: string): Promise<boolean> {
  try {
    if (!name || name.trim().length === 0) {
      return false;
    }

    const response = await axiosInstance.get<MultipleInstitutionResponse>(
      `${BASE_URL}?name=${encodeURIComponent(name.trim())}`
    );
    return response.data.data.length > 0;
  } catch (error) {
    console.error('Error checking institution existence:', error);
    return false;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const institutionService = {
  // Get operations
  getAllInstitutions,
  getInstitutionById,
  getActiveInstitutions,
  
  // Create operations
  createInstitution,
  
  // Update operations
  updateInstitution,
  
  // Delete operations
  deleteInstitution,
  
  // Search and filter operations
  searchInstitutions,
  
  // Utility functions
  checkInstitutionExists,
}; 