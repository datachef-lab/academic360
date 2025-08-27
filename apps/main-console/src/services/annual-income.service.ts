import axiosInstance from "@/utils/api";
import {
  AnnualIncome,
  CreateAnnualIncomePayload,
  UpdateAnnualIncomePayload,
} from "@/types/resources/annual-income.types";

// ============================================================================
// ANNUAL INCOME SERVICE
// ============================================================================

/**
 * Annual Income Service
 * 
 * This service handles all CRUD operations for the Annual Income module.
 * It provides type-safe API communication with the backend.
 */

const BASE_URL = '/api/annual-incomes';

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get all annual incomes
 * @returns Promise<AnnualIncome[]> - Array of all annual incomes
 */
export async function getAllAnnualIncomes(): Promise<AnnualIncome[]> {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data.payload;
  } catch (error) {
    console.error('Error fetching annual incomes:', error);
    throw error;
  }
}

/**
 * Get annual income by ID
 * @param id - Annual income ID
 * @returns Promise<AnnualIncome> - Annual income data
 */
export async function getAnnualIncomeById(id: number): Promise<AnnualIncome> {
  try {
    if (!id) {
      throw new Error('Annual income ID is required');
    }

    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data.payload;
  } catch (error) {
    console.error(`Error fetching annual income with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get active annual incomes only
 * @returns Promise<AnnualIncome[]> - Array of active annual incomes
 */
export async function getActiveAnnualIncomes(): Promise<AnnualIncome[]> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}?disabled=false`);
    return response.data.payload;
  } catch (error) {
    console.error('Error fetching active annual incomes:', error);
    throw error;
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new annual income
 * @param payload - Annual income creation data
 * @returns Promise<AnnualIncome> - Created annual income data
 */
export async function createAnnualIncome(payload: CreateAnnualIncomePayload): Promise<AnnualIncome> {
  try {
    if (!payload.range || payload.range.trim().length === 0) {
      throw new Error('Annual income range is required');
    }

    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data.payload;
  } catch (error) {
    console.error('Error creating annual income:', error);
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update an existing annual income
 * @param id - Annual income ID
 * @param payload - Annual income update data
 * @returns Promise<AnnualIncome> - Updated annual income data
 */
export async function updateAnnualIncome(id: number, payload: UpdateAnnualIncomePayload): Promise<AnnualIncome> {
  try {
    if (!id) {
      throw new Error('Annual income ID is required');
    }

    if (payload.range !== undefined && payload.range.trim().length === 0) {
      throw new Error('Annual income range cannot be empty');
    }

    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data.payload;
  } catch (error) {
    console.error(`Error updating annual income with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete an annual income
 * @param id - Annual income ID
 * @returns Promise<void>
 */
export async function deleteAnnualIncome(id: number): Promise<void> {
  try {
    if (!id) {
      throw new Error('Annual income ID is required');
    }

    await axiosInstance.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting annual income with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// SEARCH AND FILTER OPERATIONS
// ============================================================================

/**
 * Search annual incomes by name
 * @param searchTerm - Search term for annual income name
 * @returns Promise<AnnualIncome[]> - Array of matching annual incomes
 */
export async function searchAnnualIncomes(searchTerm: string): Promise<AnnualIncome[]> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return getAllAnnualIncomes();
    }

    const response = await axiosInstance.get(
      `${BASE_URL}/search?q=${encodeURIComponent(searchTerm.trim())}`
    );
    return response.data.payload;
  } catch (error) {
    console.error('Error searching annual incomes:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if an annual income exists by name
 * @param name - Annual income name to check
 * @returns Promise<boolean> - True if exists, false otherwise
 */
export async function checkAnnualIncomeExists(name: string): Promise<boolean> {
  try {
    if (!name || name.trim().length === 0) {
      return false;
    }

    const response = await axiosInstance.get(
      `${BASE_URL}?name=${encodeURIComponent(name.trim())}`
    );
    return response.data.payload.length > 0;
  } catch (error) {
    console.error('Error checking annual income existence:', error);
    return false;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const annualIncomeService = {
  // Get operations
  getAllAnnualIncomes,
  getAnnualIncomeById,
  getActiveAnnualIncomes,
  
  // Create operations
  createAnnualIncome,
  
  // Update operations
  updateAnnualIncome,
  
  // Delete operations
  deleteAnnualIncome,
  
  // Search and filter operations
  searchAnnualIncomes,
  
  // Utility functions
  checkAnnualIncomeExists,
}; 