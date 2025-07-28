import axiosInstance from "@/utils/api";
import {
  City,
  CreateCityPayload,
  UpdateCityPayload,
  SingleCityResponse,
  MultipleCityResponse,
} from "@/types/resources/city.types";

// ============================================================================
// CITY SERVICE
// ============================================================================

/**
 * City Service
 * 
 * This service handles all CRUD operations for the City module.
 * It provides type-safe API communication with the backend.
 */

const BASE_URL = '/api/cities';

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get all cities
 * @returns Promise<City[]> - Array of all cities
 */
export async function getAllCities(): Promise<City[]> {
  try {
    const response = await axiosInstance.get<MultipleCityResponse>(BASE_URL);
    return response.data.payload || [];
  } catch (error) {
    console.error('Error fetching cities:', error);
    throw error;
  }
}

/**
 * Get city by ID
 * @param id - City ID
 * @returns Promise<City> - City data
 */
export async function getCityById(id: number): Promise<City> {
  try {
    if (!id) {
      throw new Error('City ID is required');
    }

    const response = await axiosInstance.get<SingleCityResponse>(`${BASE_URL}/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching city with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get active cities only
 * @returns Promise<City[]> - Array of active cities
 */
export async function getActiveCities(): Promise<City[]> {
  try {
    const response = await axiosInstance.get<MultipleCityResponse>(`${BASE_URL}?disabled=false`);
    return response.data.payload || [];
  } catch (error) {
    console.error('Error fetching active cities:', error);
    throw error;
  }
}

/**
 * Get cities by state ID
 * @param stateId - State ID
 * @returns Promise<City[]> - Array of cities in the state
 */
export async function getCitiesByState(stateId: number): Promise<City[]> {
  try {
    if (!stateId) {
      throw new Error('State ID is required');
    }

    const response = await axiosInstance.get<MultipleCityResponse>(`${BASE_URL}?stateId=${stateId}`);
    return response.data.payload || [];
  } catch (error) {
    console.error(`Error fetching cities for state ID ${stateId}:`, error);
    throw error;
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new city
 * @param payload - City creation data
 * @returns Promise<City> - Created city data
 */
export async function createCity(payload: CreateCityPayload): Promise<City> {
  try {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('City name is required');
    }

    if (!payload.stateId) {
      throw new Error('State ID is required');
    }

    const response = await axiosInstance.post<SingleCityResponse>(BASE_URL, payload);
    return response.data.data;
  } catch (error) {
    console.error('Error creating city:', error);
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update an existing city
 * @param id - City ID
 * @param payload - City update data
 * @returns Promise<City> - Updated city data
 */
export async function updateCity(id: number, payload: UpdateCityPayload): Promise<City> {
  try {
    if (!id) {
      throw new Error('City ID is required');
    }

    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('City name cannot be empty');
    }

    const response = await axiosInstance.put<SingleCityResponse>(`${BASE_URL}/${id}`, payload);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating city with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a city
 * @param id - City ID
 * @returns Promise<void>
 */
export async function deleteCity(id: number): Promise<void> {
  try {
    if (!id) {
      throw new Error('City ID is required');
    }

    await axiosInstance.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting city with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// SEARCH AND FILTER OPERATIONS
// ============================================================================

/**
 * Search cities by name
 * @param searchTerm - Search term for city name
 * @returns Promise<City[]> - Array of matching cities
 */
export async function searchCities(searchTerm: string): Promise<City[]> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return getAllCities();
    }

    const response = await axiosInstance.get<MultipleCityResponse>(
      `${BASE_URL}/search?q=${encodeURIComponent(searchTerm.trim())}`
    );
    return response.data.payload || [];
  } catch (error) {
    console.error('Error searching cities:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a city exists by name
 * @param name - City name to check
 * @returns Promise<boolean> - True if exists, false otherwise
 */
export async function checkCityExists(name: string): Promise<boolean> {
  try {
    if (!name || name.trim().length === 0) {
      return false;
    }

    const response = await axiosInstance.get<MultipleCityResponse>(
      `${BASE_URL}?name=${encodeURIComponent(name.trim())}`
    );
    return (response.data.payload || []).length > 0;
  } catch (error) {
    console.error('Error checking city existence:', error);
    return false;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const cityService = {
  // Get operations
  getAllCities,
  getCityById,
  getActiveCities,
  getCitiesByState,
  
  // Create operations
  createCity,
  
  // Update operations
  updateCity,
  
  // Delete operations
  deleteCity,
  
  // Search and filter operations
  searchCities,
  
  // Utility functions
  checkCityExists,
}; 