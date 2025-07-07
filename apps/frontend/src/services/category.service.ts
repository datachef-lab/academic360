import axiosInstance from "@/utils/api";
import {
  Category,
  CreateCategoryPayload,
  UpdateCategoryPayload,
  SingleCategoryResponse,
  MultipleCategoryResponse,
} from "@/types/resources/category.types";

// ============================================================================
// CATEGORY SERVICE
// ============================================================================

/**
 * Category Service
 * 
 * This service handles all CRUD operations for the Category module.
 * It provides type-safe API communication with the backend.
 */

const BASE_URL = '/api/categories';

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get all categories
 * @returns Promise<Category[]> - Array of all categories
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    const response = await axiosInstance.get<MultipleCategoryResponse>(BASE_URL);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

/**
 * Get category by ID
 * @param id - Category ID
 * @returns Promise<Category> - Category data
 */
export async function getCategoryById(id: number): Promise<Category> {
  try {
    if (!id) {
      throw new Error('Category ID is required');
    }

    const response = await axiosInstance.get<SingleCategoryResponse>(`${BASE_URL}/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching category with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get active categories only
 * @returns Promise<Category[]> - Array of active categories
 */
export async function getActiveCategories(): Promise<Category[]> {
  try {
    const response = await axiosInstance.get<MultipleCategoryResponse>(`${BASE_URL}?disabled=false`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching active categories:', error);
    throw error;
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new category
 * @param payload - Category creation data
 * @returns Promise<Category> - Created category data
 */
export async function createCategory(payload: CreateCategoryPayload): Promise<Category> {
  try {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Category name is required');
    }

    const response = await axiosInstance.post<SingleCategoryResponse>(BASE_URL, payload);
    return response.data.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update an existing category
 * @param id - Category ID
 * @param payload - Category update data
 * @returns Promise<Category> - Updated category data
 */
export async function updateCategory(id: number, payload: UpdateCategoryPayload): Promise<Category> {
  try {
    if (!id) {
      throw new Error('Category ID is required');
    }

    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }

    const response = await axiosInstance.put<SingleCategoryResponse>(`${BASE_URL}/${id}`, payload);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating category with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a category
 * @param id - Category ID
 * @returns Promise<void>
 */
export async function deleteCategory(id: number): Promise<void> {
  try {
    if (!id) {
      throw new Error('Category ID is required');
    }

    await axiosInstance.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting category with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// SEARCH AND FILTER OPERATIONS
// ============================================================================

/**
 * Search categories by name
 * @param searchTerm - Search term for category name
 * @returns Promise<Category[]> - Array of matching categories
 */
export async function searchCategories(searchTerm: string): Promise<Category[]> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return getAllCategories();
    }

    const response = await axiosInstance.get<MultipleCategoryResponse>(
      `${BASE_URL}/search?q=${encodeURIComponent(searchTerm.trim())}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error searching categories:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a category exists by name
 * @param name - Category name to check
 * @returns Promise<boolean> - True if exists, false otherwise
 */
export async function checkCategoryExists(name: string): Promise<boolean> {
  try {
    if (!name || name.trim().length === 0) {
      return false;
    }

    const response = await axiosInstance.get<MultipleCategoryResponse>(
      `${BASE_URL}?name=${encodeURIComponent(name.trim())}`
    );
    return response.data.data.length > 0;
  } catch (error) {
    console.error('Error checking category existence:', error);
    return false;
  }
}

// ============================================================================
// EXPORT ALL FUNCTIONS
// ============================================================================

export const categoryService = {
  // Get operations
  getAllCategories,
  getCategoryById,
  getActiveCategories,
  
  // Create operations
  createCategory,
  
  // Update operations
  updateCategory,
  
  // Delete operations
  deleteCategory,
  
  // Search and filter operations
  searchCategories,
  
  // Utility functions
  checkCategoryExists,
}; 