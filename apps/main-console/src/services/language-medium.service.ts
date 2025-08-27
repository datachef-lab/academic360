import axiosInstance from "@/utils/api";
import {
  LanguageMedium,
  CreateLanguageMediumPayload,
  UpdateLanguageMediumPayload,
  SingleLanguageMediumResponse,
  MultipleLanguageMediumResponse,
} from "@/types/resources/language-medium.types";

// ============================================================================
// LANGUAGE MEDIUM SERVICE
// ============================================================================

/**
 * Language Medium Service
 * 
 * This service handles all CRUD operations for the Language Medium module.
 * It provides type-safe API communication with the backend.
 */

const BASE_URL = '/api/languages';

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get all language mediums
 * @returns Promise<LanguageMedium[]> - Array of all language mediums
 */
export async function getAllLanguageMediums(): Promise<LanguageMedium[]> {
  try {
    const response = await axiosInstance.get<MultipleLanguageMediumResponse>(BASE_URL);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching language mediums:', error);
    throw error;
  }
}

/**
 * Get language medium by ID
 * @param id - Language medium ID
 * @returns Promise<LanguageMedium> - Language medium data
 */
export async function getLanguageMediumById(id: number): Promise<LanguageMedium> {
  try {
    if (!id) {
      throw new Error('Language medium ID is required');
    }

    const response = await axiosInstance.get<SingleLanguageMediumResponse>(`${BASE_URL}/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching language medium with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get active language mediums only
 * @returns Promise<LanguageMedium[]> - Array of active language mediums
 */
export async function getActiveLanguageMediums(): Promise<LanguageMedium[]> {
  try {
    const response = await axiosInstance.get<MultipleLanguageMediumResponse>(`${BASE_URL}?disabled=false`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching active language mediums:', error);
    throw error;
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new language medium
 * @param payload - Language medium creation data
 * @returns Promise<LanguageMedium> - Created language medium data
 */
export async function createLanguageMedium(payload: CreateLanguageMediumPayload): Promise<LanguageMedium> {
  try {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Language medium name is required');
    }

    const response = await axiosInstance.post<SingleLanguageMediumResponse>(BASE_URL, payload);
    return response.data.data;
  } catch (error) {
    console.error('Error creating language medium:', error);
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update an existing language medium
 * @param id - Language medium ID
 * @param payload - Language medium update data
 * @returns Promise<LanguageMedium> - Updated language medium data
 */
export async function updateLanguageMedium(id: number, payload: UpdateLanguageMediumPayload): Promise<LanguageMedium> {
  try {
    if (!id) {
      throw new Error('Language medium ID is required');
    }

    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('Language medium name cannot be empty');
    }

    const response = await axiosInstance.put<SingleLanguageMediumResponse>(`${BASE_URL}/${id}`, payload);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating language medium with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a language medium
 * @param id - Language medium ID
 * @returns Promise<void>
 */
export async function deleteLanguageMedium(id: number): Promise<void> {
  try {
    if (!id) {
      throw new Error('Language medium ID is required');
    }

    await axiosInstance.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting language medium with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// SEARCH AND FILTER OPERATIONS
// ============================================================================

/**
 * Search language mediums by name
 * @param searchTerm - Search term for language medium name
 * @returns Promise<LanguageMedium[]> - Array of matching language mediums
 */
export async function searchLanguageMediums(searchTerm: string): Promise<LanguageMedium[]> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return getAllLanguageMediums();
    }

    const response = await axiosInstance.get<MultipleLanguageMediumResponse>(
      `${BASE_URL}/search?q=${encodeURIComponent(searchTerm.trim())}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error searching language mediums:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a language medium exists by name
 * @param name - Language medium name to check
 * @returns Promise<boolean> - True if exists, false otherwise
 */
export async function checkLanguageMediumExists(name: string): Promise<boolean> {
  try {
    if (!name || name.trim().length === 0) {
      return false;
    }

    const response = await axiosInstance.get<MultipleLanguageMediumResponse>(
      `${BASE_URL}?name=${encodeURIComponent(name.trim())}`
    );
    return response.data.data.length > 0;
  } catch (error) {
    console.error('Error checking language medium existence:', error);
    return false;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const languageMediumService = {
  // Get operations
  getAllLanguageMediums,
  getLanguageMediumById,
  getActiveLanguageMediums,
  
  // Create operations
  createLanguageMedium,
  
  // Update operations
  updateLanguageMedium,
  
  // Delete operations
  deleteLanguageMedium,
  
  // Search and filter operations
  searchLanguageMediums,
  
  // Utility functions
  checkLanguageMediumExists,
}; 