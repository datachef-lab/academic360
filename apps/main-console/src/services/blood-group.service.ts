import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";
import { BloodGroup, CreateBloodGroupPayload, UpdateBloodGroupPayload } from "@/types/resources/blood-group.types";
import type { BloodGroupDto } from "@repo/db/dtos/resources";

// ============================================================================
// BLOOD GROUP SERVICE
// ============================================================================

/**
 * Blood Group Service
 *
 * This service handles all CRUD operations for the Blood Group module.
 * It provides type-safe API communication with the backend.
 */

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get all blood groups
 * @returns Promise<BloodGroup[]> - Array of all blood groups
 */
export async function getAllBloodGroups(): Promise<BloodGroupDto[]> {
  try {
    const response = await axiosInstance.get("/api/blood-groups");
    return response.data.payload;
  } catch (error) {
    console.error("Error fetching blood groups:", error);
    throw error;
  }
}

/**
 * Get blood group by ID
 * @param id - Blood group ID
 * @returns Promise<BloodGroup> - Blood group data
 */
export async function getBloodGroupById(id: number): Promise<BloodGroup> {
  try {
    if (!id) {
      throw new Error("Blood group ID is required");
    }

    const response = await axiosInstance.get(`/api/blood-groups/${id}`);
    return response.data.payload;
  } catch (error) {
    console.error(`Error fetching blood group with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get active blood groups only
 * @returns Promise<BloodGroup[]> - Array of active blood groups
 */
export async function getActiveBloodGroups(): Promise<BloodGroup[]> {
  try {
    const response = await axiosInstance.get("/api/blood-groups?disabled=false");
    const bloodGroupDtos: BloodGroupDto[] = response.data.payload;
    return bloodGroupDtos.map((dto) => ({
      id: dto.id,
      type: dto.type,
      sequence: dto.sequence,
      disabled: !dto.isActive,
      createdAt: dto.createdAt?.toISOString(),
      updatedAt: dto.updatedAt?.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching active blood groups:", error);
    throw error;
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new blood group
 * @param payload - Blood group creation data
 * @returns Promise<BloodGroup> - Created blood group data
 */
export async function createBloodGroup(payload: CreateBloodGroupPayload): Promise<BloodGroup> {
  try {
    if (!payload.type || payload.type.trim().length === 0) {
      throw new Error("Blood group type is required");
    }

    const response = await axiosInstance.post("/api/blood-groups", payload);
    return response.data.payload;
  } catch (error) {
    console.error("Error creating blood group:", error);
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update an existing blood group
 * @param id - Blood group ID
 * @param payload - Blood group update data
 * @returns Promise<BloodGroup> - Updated blood group data
 */
export async function updateBloodGroup(id: number, payload: UpdateBloodGroupPayload): Promise<BloodGroup> {
  try {
    if (!id) {
      throw new Error("Blood group ID is required");
    }

    if (payload.type !== undefined && payload.type.trim().length === 0) {
      throw new Error("Blood group type cannot be empty");
    }

    const response = await axiosInstance.put(`/api/blood-groups/${id}`, payload);
    return response.data.payload;
  } catch (error) {
    console.error(`Error updating blood group with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Update blood group type only (legacy function for backward compatibility)
 * @param data - Object containing id and type
 * @returns Promise<ApiResponse<BloodGroup[]>> - API response
 */
export async function updateBloodGroupType(data: { id: number; type: string }): Promise<ApiResponse<BloodGroup[]>> {
  try {
    console.log("blood group is coming....", data);
    const response = await axiosInstance.put(`/api/blood-groups/${data.id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating blood group type for ID ${data.id}:`, error);
    throw error;
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a blood group
 * @param id - Blood group ID
 * @returns Promise<void>
 */
export async function deleteBloodGroup(id: number): Promise<void> {
  try {
    if (!id) {
      throw new Error("Blood group ID is required");
    }

    await axiosInstance.delete(`/api/blood-groups/${id}`);
  } catch (error) {
    console.error(`Error deleting blood group with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// BULK OPERATIONS
// ============================================================================

/**
 * Create multiple blood groups
 * @param payloads - Array of blood group creation data
 * @returns Promise<BloodGroup[]> - Array of created blood groups
 */
export async function createMultipleBloodGroups(payloads: CreateBloodGroupPayload[]): Promise<BloodGroup[]> {
  try {
    if (!payloads || payloads.length === 0) {
      throw new Error("At least one blood group payload is required");
    }

    const response = await axiosInstance.post("/api/blood-groups/bulk", payloads);
    const bloodGroupDtos: BloodGroupDto[] = response.data.payload;
    return bloodGroupDtos.map((dto) => ({
      id: dto.id,
      type: dto.type,
      sequence: dto.sequence,
      disabled: !dto.isActive,
      createdAt: dto.createdAt?.toISOString(),
      updatedAt: dto.updatedAt?.toISOString(),
    }));
  } catch (error) {
    console.error("Error creating multiple blood groups:", error);
    throw error;
  }
}

/**
 * Update multiple blood groups
 * @param updates - Array of objects containing id and update data
 * @returns Promise<BloodGroup[]> - Array of updated blood groups
 */
export async function updateMultipleBloodGroups(
  updates: Array<{ id: number; payload: UpdateBloodGroupPayload }>,
): Promise<BloodGroup[]> {
  try {
    if (!updates || updates.length === 0) {
      throw new Error("At least one blood group update is required");
    }

    const response = await axiosInstance.put("/api/blood-groups/bulk", updates);
    const bloodGroupDtos: BloodGroupDto[] = response.data.payload;
    return bloodGroupDtos.map((dto) => ({
      id: dto.id,
      type: dto.type,
      sequence: dto.sequence,
      disabled: !dto.isActive,
      createdAt: dto.createdAt?.toISOString(),
      updatedAt: dto.updatedAt?.toISOString(),
    }));
  } catch (error) {
    console.error("Error updating multiple blood groups:", error);
    throw error;
  }
}

// ============================================================================
// SEARCH AND FILTER OPERATIONS
// ============================================================================

/**
 * Search blood groups by type
 * @param searchTerm - Search term for blood group type
 * @returns Promise<BloodGroup[]> - Array of matching blood groups
 */
export async function searchBloodGroups(searchTerm: string): Promise<BloodGroup[]> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      const bloodGroupDtos = await getAllBloodGroups();
      return bloodGroupDtos.map((dto) => ({
        id: dto.id,
        type: dto.type,
        sequence: dto.sequence,
        disabled: !dto.isActive,
        createdAt: dto.createdAt?.toISOString(),
        updatedAt: dto.updatedAt?.toISOString(),
      }));
    }

    const response = await axiosInstance.get(`/api/blood-groups/search?q=${encodeURIComponent(searchTerm.trim())}`);
    const bloodGroupDtos: BloodGroupDto[] = response.data.payload;
    return bloodGroupDtos.map((dto) => ({
      id: dto.id,
      type: dto.type,
      sequence: dto.sequence,
      disabled: !dto.isActive,
      createdAt: dto.createdAt?.toISOString(),
      updatedAt: dto.updatedAt?.toISOString(),
    }));
  } catch (error) {
    console.error("Error searching blood groups:", error);
    throw error;
  }
}

/**
 * Get blood groups with pagination
 * @param page - Page number (1-based)
 * @param limit - Number of items per page
 * @returns Promise<{ data: BloodGroup[]; total: number; page: number; limit: number }>
 */
export async function getBloodGroupsPaginated(
  page: number = 1,
  limit: number = 10,
): Promise<{ data: BloodGroup[]; total: number; page: number; limit: number }> {
  try {
    const response = await axiosInstance.get(`/api/blood-groups?page=${page}&limit=${limit}`);

    // Extract pagination info from response headers or data
    const total = parseInt(response.headers["x-total-count"] || "0");

    return {
      data: response.data.payload,
      total,
      page,
      limit,
    };
  } catch (error) {
    console.error("Error fetching paginated blood groups:", error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a blood group exists by type
 * @param type - Blood group type to check
 * @returns Promise<boolean> - True if exists, false otherwise
 */
export async function checkBloodGroupExists(type: string): Promise<boolean> {
  try {
    if (!type || type.trim().length === 0) {
      return false;
    }

    const response = await axiosInstance.get(`/api/blood-groups?type=${encodeURIComponent(type.trim())}`);
    return response.data.payload.length > 0;
  } catch (error) {
    console.error("Error checking blood group existence:", error);
    return false;
  }
}

/**
 * Get blood group statistics
 * @returns Promise<{ total: number; active: number; disabled: number }>
 */
export async function getBloodGroupStats(): Promise<{ total: number; active: number; disabled: number }> {
  try {
    const [allResponse, activeResponse] = await Promise.all([
      axiosInstance.get("/api/blood-groups"),
      axiosInstance.get("/api/blood-groups?disabled=false"),
    ]);

    const total = allResponse.data.payload.length;
    const active = activeResponse.data.payload.length;
    const disabled = total - active;

    return { total, active, disabled };
  } catch (error) {
    console.error("Error fetching blood group statistics:", error);
    throw error;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const bloodGroupService = {
  // Get operations
  getAllBloodGroups,
  getBloodGroupById,
  getActiveBloodGroups,

  // Create operations
  createBloodGroup,

  // Update operations
  updateBloodGroup,
  updateBloodGroupType, // Legacy function

  // Delete operations
  deleteBloodGroup,

  // Bulk operations
  createMultipleBloodGroups,
  updateMultipleBloodGroups,

  // Search and filter operations
  searchBloodGroups,
  getBloodGroupsPaginated,

  // Utility functions
  checkBloodGroupExists,
  getBloodGroupStats,
};
