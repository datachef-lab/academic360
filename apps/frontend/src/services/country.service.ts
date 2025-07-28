import axiosInstance from "@/utils/api";
import {
  Country,
  CreateCountryPayload,
  UpdateCountryPayload,
  SingleCountryResponse,
  MultipleCountryResponse,
} from "@/types/resources/country.types";

// ============================================================================
// COUNTRY SERVICE
// ============================================================================

/**
 * Country Service
 * 
 * This service handles all CRUD operations for the Country module.
 * It provides type-safe API communication with the backend.
 */

const BASE_URL = '/api/countries';

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get all countries
 * @returns Promise<Country[]> - Array of all countries
 */
export async function getAllCountries(): Promise<Country[]> {
  try {
    const response = await axiosInstance.get<MultipleCountryResponse>(BASE_URL);
    return response.data.payload || [];
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }
}

/**
 * Get country by ID
 * @param id - Country ID
 * @returns Promise<Country> - Country data
 */
export async function getCountryById(id: number): Promise<Country> {
  try {
    if (!id) {
      throw new Error('Country ID is required');
    }

    const response = await axiosInstance.get<SingleCountryResponse>(`${BASE_URL}/${id}`);
    return response.data.payload;
  } catch (error) {
    console.error(`Error fetching country with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get active countries only
 * @returns Promise<Country[]> - Array of active countries
 */
export async function getActiveCountries(): Promise<Country[]> {
  try {
    const response = await axiosInstance.get<MultipleCountryResponse>(`${BASE_URL}?disabled=false`);
    return response.data.payload || [];
  } catch (error) {
    console.error('Error fetching active countries:', error);
    throw error;
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new country
 * @param payload - Country creation data
 * @returns Promise<Country> - Created country data
 */
export async function createCountry(payload: CreateCountryPayload): Promise<Country> {
  try {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Country name is required');
    }

    const response = await axiosInstance.post<SingleCountryResponse>(BASE_URL, payload);
    return response.data.payload;
  } catch (error) {
    console.error('Error creating country:', error);
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update an existing country
 * @param id - Country ID
 * @param payload - Country update data
 * @returns Promise<Country> - Updated country data
 */
export async function updateCountry(id: number, payload: UpdateCountryPayload): Promise<Country> {
  try {
    if (!id) {
      throw new Error('Country ID is required');
    }

    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('Country name cannot be empty');
    }

    const response = await axiosInstance.put<SingleCountryResponse>(`${BASE_URL}/${id}`, payload);
    return response.data.payload;
  } catch (error) {
    console.error(`Error updating country with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a country
 * @param id - Country ID
 * @returns Promise<void>
 */
export async function deleteCountry(id: number): Promise<void> {
  try {
    if (!id) {
      throw new Error('Country ID is required');
    }

    await axiosInstance.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting country with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// SEARCH AND FILTER OPERATIONS
// ============================================================================

/**
 * Search countries by name
 * @param searchTerm - Search term for country name
 * @returns Promise<Country[]> - Array of matching countries
 */
export async function searchCountries(searchTerm: string): Promise<Country[]> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return getAllCountries();
    }

    const response = await axiosInstance.get<MultipleCountryResponse>(
      `${BASE_URL}/search?q=${encodeURIComponent(searchTerm.trim())}`
    );
    return response.data.payload || [];
  } catch (error) {
    console.error('Error searching countries:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a country exists by name
 * @param name - Country name to check
 * @returns Promise<boolean> - True if exists, false otherwise
 */
export async function checkCountryExists(name: string): Promise<boolean> {
  try {
    if (!name || name.trim().length === 0) {
      return false;
    }

    const response = await axiosInstance.get<MultipleCountryResponse>(
      `${BASE_URL}?name=${encodeURIComponent(name.trim())}`
    );
    return (response.data.payload || []).length > 0;
  } catch (error) {
    console.error('Error checking country existence:', error);
    return false;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const countryService = {
  // Get operations
  getAllCountries,
  getCountryById,
  getActiveCountries,
  
  // Create operations
  createCountry,
  
  // Update operations
  updateCountry,
  
  // Delete operations
  deleteCountry,
  
  // Search and filter operations
  searchCountries,
  
  // Utility functions
  checkCountryExists,
}; 