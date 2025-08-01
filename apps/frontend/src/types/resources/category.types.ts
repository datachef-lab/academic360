/**
 * Category Types
 * 
 * This file contains all TypeScript types and interfaces related to the Category module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main Category interface that mirrors the backend model
 */
export interface Category {
    readonly id?: number;
  name: string;
  documentRequired: boolean;
  code: string;
  sequence?: number | null;
  disabled: boolean;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// ============================================================================
// API PAYLOAD TYPES
// ============================================================================

/**
 * Payload for creating a new category
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateCategoryPayload {
  name: string;
  documentRequired: boolean;
  code: string;
  sequence?: number | null;
  disabled?: boolean;
}

/**
 * Payload for updating an existing category
 * All fields are optional for partial updates
 */
export interface UpdateCategoryPayload {
  name?: string;
  documentRequired?: boolean;
  code?: string;
  sequence?: number | null;
  disabled?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for category operations
 */
export interface CategoryApiResponse {
  statusCode: number;
  status: string;
  data: Category | Category[] | null;
  message: string;
}

/**
 * API response for single category
 */
export interface SingleCategoryResponse {
  statusCode: number;
  status: string;
  data: Category;
  message: string;
}

/**
 * API response for multiple categories
 */
export interface MultipleCategoryResponse {
  statusCode: number;
  status: string;
  data: Category[];
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for category forms
 */
export interface CategoryFormData {
  name: string;
  documentRequired: boolean;
  code: string;
  sequence: string; // Form input as string, will be converted to number
  disabled: boolean;
}

/**
 * Form validation errors for category
 */
export interface CategoryFormErrors {
  name?: string;
  documentRequired?: string;
  code?: string;
  sequence?: string;
  disabled?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for category management
 */
export interface CategoryState {
  categories: Category[];
  currentCategory: Category | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for category state management
 */
export type CategoryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_CURRENT_CATEGORY'; payload: Category | null }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for category table
 */
export interface CategoryTableColumn {
  key: keyof Category;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for category
 */
export interface CategoryFilter {
  name?: string;
  code?: string;
  documentRequired?: boolean;
  disabled?: boolean;
  search?: string;
}

/**
 * Sort options for category
 */
export interface CategorySort {
  field: keyof Category;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for category ID
 */
export type CategoryId = number;

/**
 * Type for category name
 */
export type CategoryName = string;

/**
 * Type for category document required flag
 */
export type CategoryDocumentRequired = boolean;

/**
 * Type for category code
 */
export type CategoryCode = string;

/**
 * Type for category sequence
 */
export type CategorySequence = number | null;

/**
 * Type for category disabled state
 */
export type CategoryDisabled = boolean;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for category
 */
export const DEFAULT_CATEGORY: CreateCategoryPayload = {
  name: '',
  documentRequired: false,
  code: '',
  sequence: null,
  disabled: false,
};

/**
 * Default form data for category
 */
export const DEFAULT_CATEGORY_FORM: CategoryFormData = {
  name: '',
  documentRequired: false,
  code: '',
  sequence: '',
  disabled: false,
};

/**
 * Table columns configuration for category
 */
export const CATEGORY_TABLE_COLUMNS: CategoryTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'code', label: 'Code', sortable: true, filterable: true, width: '100px' },
  { key: 'documentRequired', label: 'Document Required', sortable: true, width: '150px' },
  { key: 'sequence', label: 'Sequence', sortable: true, width: '100px' },
  { key: 'disabled', label: 'Status', sortable: true, width: '100px' },
  { key: 'createdAt', label: 'Created At', sortable: true, width: '150px' },
  { key: 'updatedAt', label: 'Updated At', sortable: true, width: '150px' },
];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a Category
 */
export function isCategory(obj: object): obj is Category {
  return (
    obj &&
    typeof (obj as Category).id === 'number' &&
    typeof (obj as Category).name === 'string' &&
    typeof (obj as Category).documentRequired === 'boolean' &&
    typeof (obj as Category).code === 'string' &&
    ((obj as Category).sequence === null || typeof (obj as Category).sequence === 'number') &&
    typeof (obj as Category).disabled === 'boolean' &&
    typeof (obj as Category).createdAt === 'string' &&
    typeof (obj as Category).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateCategoryPayload
 */
export function isCreateCategoryPayload(obj: object): obj is CreateCategoryPayload {
  return (
    obj &&
    typeof (obj as CreateCategoryPayload).name === 'string' &&
    typeof (obj as CreateCategoryPayload).documentRequired === 'boolean' &&
    typeof (obj as CreateCategoryPayload).code === 'string' &&
    ((obj as CreateCategoryPayload).sequence === undefined || (obj as CreateCategoryPayload).sequence === null || typeof (obj as CreateCategoryPayload).sequence === 'number') &&
    ((obj as CreateCategoryPayload).disabled === undefined || typeof (obj as CreateCategoryPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an UpdateCategoryPayload
 */
export function isUpdateCategoryPayload(obj: object): obj is UpdateCategoryPayload {
  return (
    obj &&
    ((obj as UpdateCategoryPayload).name === undefined || typeof (obj as UpdateCategoryPayload).name === 'string') &&
    ((obj as UpdateCategoryPayload).documentRequired === undefined || typeof (obj as UpdateCategoryPayload).documentRequired === 'boolean') &&
    ((obj as UpdateCategoryPayload).code === undefined || typeof (obj as UpdateCategoryPayload).code === 'string') &&
    ((obj as UpdateCategoryPayload).sequence === undefined || (obj as UpdateCategoryPayload).sequence === null || typeof (obj as UpdateCategoryPayload).sequence === 'number') &&
    ((obj as UpdateCategoryPayload).disabled === undefined || typeof (obj as UpdateCategoryPayload).disabled === 'boolean')
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: CategoryFormData): CreateCategoryPayload {
  return {
    name: formData.name.trim(),
    documentRequired: formData.documentRequired,
    code: formData.code.trim(),
    sequence: formData.sequence ? parseInt(formData.sequence, 10) : null,
    disabled: formData.disabled,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(category: Category): CategoryFormData {
  return {
    name: category.name,
    documentRequired: category.documentRequired,
    code: category.code,
    sequence: category.sequence?.toString() || '',
    disabled: category.disabled,
  };
}

/**
 * Validate category name
 */
export function validateCategoryName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 255;
}

/**
 * Validate category code
 */
export function validateCategoryCode(code: string): boolean {
  return code.trim().length > 0 && code.trim().length <= 10;
}

/**
 * Format category name for display
 */
export function formatCategoryName(name: string): string {
  return name.trim();
}

/**
 * Format category code for display
 */
export function formatCategoryCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Get category document required text
 */
export function getCategoryDocumentRequiredText(documentRequired: boolean): string {
  return documentRequired ? 'Required' : 'Not Required';
}

/**
 * Get category document required color
 */
export function getCategoryDocumentRequiredColor(documentRequired: boolean): string {
  return documentRequired ? 'text-red-600' : 'text-green-600';
}

/**
 * Get category status text
 */
export function getCategoryStatusText(disabled: boolean): string {
  return disabled ? 'Inactive' : 'Active';
}

/**
 * Get category status color
 */
export function getCategoryStatusColor(disabled: boolean): string {
  return disabled ? 'text-red-600' : 'text-green-600';
} 