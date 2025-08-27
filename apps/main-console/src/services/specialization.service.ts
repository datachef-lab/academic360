import axiosInstance from "@/utils/api";
import { Specialization } from "@/types/resources/specialization";

const BASE_URL = "/api/specializations";

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get all specializations
 * @returns Promise<Specialization[]> - Array of all specializations
 */
export async function getAllSpecializations(): Promise<Specialization[]> {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data.payload;
  } catch (error) {
    console.error('Error fetching specializations:', error);
    throw error;
  }
}

/**
 * Get specialization by ID
 * @param id - Specialization ID
 * @returns Promise<Specialization> - Specialization data
 */
export async function getSpecializationById(id: number): Promise<Specialization> {
  try {
    if (!id) {
      throw new Error('Specialization ID is required');
    }

    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data.payload;
  } catch (error) {
    console.error(`Error fetching specialization with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get active specializations only
 * @returns Promise<Specialization[]> - Array of active specializations
 */
export async function getActiveSpecializations(): Promise<Specialization[]> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}?disabled=false`);
    return response.data.payload;
  } catch (error) {
    console.error('Error fetching active specializations:', error);
    throw error;
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new specialization
 * @param payload - Specialization creation data
 * @returns Promise<Specialization> - Created specialization data
 */
export async function createSpecialization(payload: Partial<Specialization>): Promise<Specialization> {
  try {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Specialization name is required');
    }

    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data.payload;
  } catch (error) {
    console.error('Error creating specialization:', error);
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update an existing specialization
 * @param id - Specialization ID
 * @param payload - Specialization update data
 * @returns Promise<Specialization> - Updated specialization data
 */
export async function updateSpecialization(id: number, payload: Partial<Specialization>): Promise<Specialization> {
  try {
    if (!id) {
      throw new Error('Specialization ID is required');
    }

    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('Specialization name cannot be empty');
    }

    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data.payload;
  } catch (error) {
    console.error(`Error updating specialization with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a specialization
 * @param id - Specialization ID
 * @returns Promise<void>
 */
export async function deleteSpecialization(id: number): Promise<void> {
  try {
    if (!id) {
      throw new Error('Specialization ID is required');
    }

    await axiosInstance.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting specialization with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Create multiple specializations
 * @param payloads - Array of specialization creation data
 * @returns Promise<Specialization[]> - Array of created specializations
 */
export async function createMultipleSpecializations(payloads: Partial<Specialization>[]): Promise<Specialization[]> {
  try {
    if (!payloads || payloads.length === 0) {
      throw new Error('At least one specialization payload is required');
    }

    const response = await axiosInstance.post(`${BASE_URL}/bulk`, payloads);
    return response.data.payload;
  } catch (error) {
    console.error('Error creating multiple specializations:', error);
    throw error;
  }
}

/**
 * Update multiple specializations
 * @param updates - Array of objects containing id and update data
 * @returns Promise<Specialization[]> - Array of updated specializations
 */
export async function updateMultipleSpecializations(
  updates: Array<{ id: number; payload: Partial<Specialization> }>
): Promise<Specialization[]> {
  try {
    if (!updates || updates.length === 0) {
      throw new Error('At least one specialization update is required');
    }

    const response = await axiosInstance.put(`${BASE_URL}/bulk`, updates);
    return response.data.payload;
  } catch (error) {
    console.error('Error updating multiple specializations:', error);
    throw error;
  }
}

// ============================================================================
// SEARCH AND FILTER OPERATIONS
// ============================================================================

/**
 * Search specializations by name
 * @param searchTerm - Search term for specialization name
 * @returns Promise<Specialization[]> - Array of matching specializations
 */
export async function searchSpecializations(searchTerm: string): Promise<Specialization[]> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return getAllSpecializations();
    }

    const response = await axiosInstance.get(
      `${BASE_URL}/search?q=${encodeURIComponent(searchTerm.trim())}`
    );
    return response.data.payload;
  } catch (error) {
    console.error('Error searching specializations:', error);
    throw error;
  }
}

/**
 * Get specializations with pagination
 * @param page - Page number (1-based)
 * @param limit - Number of items per page
 * @returns Promise<{ data: Specialization[]; total: number; page: number; limit: number }>
 */
export async function getSpecializationsPaginated(
  page: number = 1,
  limit: number = 10
): Promise<{ data: Specialization[]; total: number; page: number; limit: number }> {
  try {
    const response = await axiosInstance.get(
      `${BASE_URL}?page=${page}&limit=${limit}`
    );
    
    // Extract pagination info from response headers or data
    const total = parseInt(response.headers['x-total-count'] || '0');
    
    return {
      data: response.data.payload,
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error('Error fetching paginated specializations:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a specialization exists by name
 * @param name - Specialization name to check
 * @returns Promise<boolean> - True if exists, false otherwise
 */
export async function checkSpecializationExists(name: string): Promise<boolean> {
  try {
    if (!name || name.trim().length === 0) {
      return false;
    }

    const response = await axiosInstance.get(
      `${BASE_URL}?name=${encodeURIComponent(name.trim())}`
    );
    return response.data.payload.length > 0;
  } catch (error) {
    console.error('Error checking specialization existence:', error);
    return false;
  }
}

/**
 * Get specialization statistics
 * @returns Promise<{ total: number; active: number; disabled: number }>
 */
export async function getSpecializationStats(): Promise<{ total: number; active: number; disabled: number }> {
  try {
    const [allResponse, activeResponse] = await Promise.all([
      axiosInstance.get(BASE_URL),
      axiosInstance.get(`${BASE_URL}?disabled=false`),
    ]);

    const total = allResponse.data.payload.length;
    const active = activeResponse.data.payload.length;
    const disabled = total - active;

    return { total, active, disabled };
  } catch (error) {
    console.error('Error fetching specialization statistics:', error);
    throw error;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const specializationService = {
  // Get operations
  getAllSpecializations,
  getSpecializationById,
  getActiveSpecializations,
  
  // Create operations
  createSpecialization,
  
  // Update operations
  updateSpecialization,
  
  // Delete operations
  deleteSpecialization,
  
  // Bulk operations
  createMultipleSpecializations,
  updateMultipleSpecializations,
  
  // Search and filter operations
  searchSpecializations,
  getSpecializationsPaginated,
  
  // Utility functions
  checkSpecializationExists,
  getSpecializationStats,
};
