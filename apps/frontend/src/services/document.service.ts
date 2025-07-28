import axiosInstance from "@/utils/api";
import { Document } from "@/types/resources/document";

// ============================================================================
// DOCUMENT SERVICE
// ============================================================================

/**
 * Document Service
 * 
 * This service handles all CRUD operations for the Document module.
 * It provides type-safe API communication with the backend.
 */

const BASE_URL = '/api/documents';

// ============================================================================
// GET OPERATIONS
// ============================================================================

/**
 * Get all documents
 * @returns Promise<Document[]> - Array of all documents
 */
export async function getAllDocuments(): Promise<Document[]> {
  try {
    const response = await axiosInstance.get(BASE_URL);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}

/**
 * Get document by ID
 * @param id - Document ID
 * @returns Promise<Document> - Document data
 */
export async function getDocumentById(id: number): Promise<Document> {
  try {
    if (!id) {
      throw new Error('Document ID is required');
    }

    const response = await axiosInstance.get(`${BASE_URL}/${id}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching document with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get active documents only
 * @returns Promise<Document[]> - Array of active documents
 */
export async function getActiveDocuments(): Promise<Document[]> {
  try {
    const response = await axiosInstance.get(`${BASE_URL}?disabled=false`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching active documents:', error);
    throw error;
  }
}

// ============================================================================
// CREATE OPERATIONS
// ============================================================================

/**
 * Create a new document
 * @param payload - Document creation data
 * @returns Promise<Document> - Created document data
 */
export async function createDocument(payload: {
  name: string;
  description?: string | null;
  sequence?: number | null;
  disabled?: boolean;
}): Promise<Document> {
  try {
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Document name is required');
    }

    const response = await axiosInstance.post(BASE_URL, payload);
    return response.data.data;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
}

// ============================================================================
// UPDATE OPERATIONS
// ============================================================================

/**
 * Update an existing document
 * @param id - Document ID
 * @param payload - Document update data
 * @returns Promise<Document> - Updated document data
 */
export async function updateDocument(
  id: number, 
  payload: {
    name?: string;
    description?: string | null;
    sequence?: number | null;
    disabled?: boolean;
  }
): Promise<Document> {
  try {
    if (!id) {
      throw new Error('Document ID is required');
    }

    if (payload.name !== undefined && payload.name.trim().length === 0) {
      throw new Error('Document name cannot be empty');
    }

    const response = await axiosInstance.put(`${BASE_URL}/${id}`, payload);
    return response.data.data;
  } catch (error) {
    console.error(`Error updating document with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// DELETE OPERATIONS
// ============================================================================

/**
 * Delete a document
 * @param id - Document ID
 * @returns Promise<void>
 */
export async function deleteDocument(id: number): Promise<void> {
  try {
    if (!id) {
      throw new Error('Document ID is required');
    }

    await axiosInstance.delete(`${BASE_URL}/${id}`);
  } catch (error) {
    console.error(`Error deleting document with ID ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// SEARCH AND FILTER OPERATIONS
// ============================================================================

/**
 * Search documents by name
 * @param searchTerm - Search term for document name
 * @returns Promise<Document[]> - Array of matching documents
 */
export async function searchDocuments(searchTerm: string): Promise<Document[]> {
  try {
    if (!searchTerm || searchTerm.trim().length === 0) {
      return getAllDocuments();
    }

    const response = await axiosInstance.get(
      `${BASE_URL}/search?q=${encodeURIComponent(searchTerm.trim())}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a document exists by name
 * @param name - Document name to check
 * @returns Promise<boolean> - True if exists, false otherwise
 */
export async function checkDocumentExists(name: string): Promise<boolean> {
  try {
    if (!name || name.trim().length === 0) {
      return false;
    }

    const response = await axiosInstance.get(
      `${BASE_URL}?name=${encodeURIComponent(name.trim())}`
    );
    return response.data.data.length > 0;
  } catch (error) {
    console.error('Error checking document existence:', error);
    return false;
  }
} 