/**
 * Board University Types
 * 
 * This file contains all TypeScript types and interfaces related to the Board University module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main Board University interface that mirrors the backend model
 */
export interface BoardUniversity {
  id: number;
  name: string;
  degreeId?: number | null;
  passingMarks?: number | null;
  code?: string | null;
  addressId?: number | null;
  sequence?: number | null;
  disabled: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Board University with relations (includes related degree and address data)
 */
export interface BoardUniversityWithRelations extends BoardUniversity {
  degree?: {
    id: number;
    name: string;
    // Add other degree fields as needed
  } | null;
  address?: {
    id: number;
    // Add other address fields as needed
  } | null;
}

// ============================================================================
// API PAYLOAD TYPES
// ============================================================================

/**
 * Payload for creating a new board university
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateBoardUniversityPayload {
  name: string;
  degreeId?: number | null;
  passingMarks?: number | null;
  code?: string | null;
  addressId?: number | null;
  sequence?: number | null;
  disabled?: boolean;
}

/**
 * Payload for updating an existing board university
 * All fields are optional for partial updates
 */
export interface UpdateBoardUniversityPayload {
  name?: string;
  degreeId?: number | null;
  passingMarks?: number | null;
  code?: string | null;
  addressId?: number | null;
  sequence?: number | null;
  disabled?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for board university operations
 */
export interface BoardUniversityApiResponse {
  statusCode: number;
  status: string;
  data: BoardUniversity | BoardUniversity[] | BoardUniversityWithRelations | BoardUniversityWithRelations[] | null;
  message: string;
}

/**
 * API response for single board university
 */
export interface SingleBoardUniversityResponse {
  statusCode: number;
  status: string;
  data: BoardUniversity | BoardUniversityWithRelations;
  message: string;
}

/**
 * API response for multiple board universities
 */
export interface MultipleBoardUniversityResponse {
  statusCode: number;
  status: string;
  data: BoardUniversity[] | BoardUniversityWithRelations[];
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for board university forms
 */
export interface BoardUniversityFormData {
  name: string;
  degreeId: string; // Form input as string, will be converted to number
  passingMarks: string; // Form input as string, will be converted to number
  code: string;
  addressId: string; // Form input as string, will be converted to number
  sequence: string; // Form input as string, will be converted to number
  disabled: boolean;
}

/**
 * Form validation errors for board university
 */
export interface BoardUniversityFormErrors {
  name?: string;
  degreeId?: string;
  passingMarks?: string;
  code?: string;
  addressId?: string;
  sequence?: string;
  disabled?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for board university management
 */
export interface BoardUniversityState {
  boardUniversities: BoardUniversity[];
  currentBoardUniversity: BoardUniversity | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for board university state management
 */
export type BoardUniversityAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_BOARD_UNIVERSITIES'; payload: BoardUniversity[] }
  | { type: 'SET_CURRENT_BOARD_UNIVERSITY'; payload: BoardUniversity | null }
  | { type: 'ADD_BOARD_UNIVERSITY'; payload: BoardUniversity }
  | { type: 'UPDATE_BOARD_UNIVERSITY'; payload: BoardUniversity }
  | { type: 'DELETE_BOARD_UNIVERSITY'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for board university table
 */
export interface BoardUniversityTableColumn {
  key: keyof BoardUniversity;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for board university
 */
export interface BoardUniversityFilter {
  name?: string;
  degreeId?: number;
  code?: string;
  addressId?: number;
  disabled?: boolean;
  search?: string;
}

/**
 * Sort options for board university
 */
export interface BoardUniversitySort {
  field: keyof BoardUniversity;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for board university ID
 */
export type BoardUniversityId = number;

/**
 * Type for board university name
 */
export type BoardUniversityName = string;

/**
 * Type for board university degree ID
 */
export type BoardUniversityDegreeId = number | null;

/**
 * Type for board university passing marks
 */
export type BoardUniversityPassingMarks = number | null;

/**
 * Type for board university code
 */
export type BoardUniversityCode = string | null;

/**
 * Type for board university address ID
 */
export type BoardUniversityAddressId = number | null;

/**
 * Type for board university sequence
 */
export type BoardUniversitySequence = number | null;

/**
 * Type for board university disabled state
 */
export type BoardUniversityDisabled = boolean;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for board university
 */
export const DEFAULT_BOARD_UNIVERSITY: CreateBoardUniversityPayload = {
  name: '',
  degreeId: null,
  passingMarks: null,
  code: '',
  addressId: null,
  sequence: null,
  disabled: false,
};

/**
 * Default form data for board university
 */
export const DEFAULT_BOARD_UNIVERSITY_FORM: BoardUniversityFormData = {
  name: '',
  degreeId: '',
  passingMarks: '',
  code: '',
  addressId: '',
  sequence: '',
  disabled: false,
};

/**
 * Table columns configuration for board university
 */
export const BOARD_UNIVERSITY_TABLE_COLUMNS: BoardUniversityTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'degreeId', label: 'Degree', sortable: true, filterable: true, width: '100px' },
  { key: 'passingMarks', label: 'Passing Marks', sortable: true, width: '120px' },
  { key: 'code', label: 'Code', sortable: true, filterable: true, width: '100px' },
  { key: 'addressId', label: 'Address', sortable: true, filterable: true, width: '100px' },
  { key: 'sequence', label: 'Sequence', sortable: true, width: '100px' },
  { key: 'disabled', label: 'Status', sortable: true, width: '100px' },
  { key: 'createdAt', label: 'Created At', sortable: true, width: '150px' },
  { key: 'updatedAt', label: 'Updated At', sortable: true, width: '150px' },
];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a BoardUniversity
 */
export function isBoardUniversity(obj: object): obj is BoardUniversity {
  return (
    obj &&
    typeof (obj as BoardUniversity).id === 'number' &&
    typeof (obj as BoardUniversity).name === 'string' &&
    ((obj as BoardUniversity).degreeId === null || typeof (obj as BoardUniversity).degreeId === 'number') &&
    ((obj as BoardUniversity).passingMarks === null || typeof (obj as BoardUniversity).passingMarks === 'number') &&
    ((obj as BoardUniversity).code === null || typeof (obj as BoardUniversity).code === 'string') &&
    ((obj as BoardUniversity).addressId === null || typeof (obj as BoardUniversity).addressId === 'number') &&
    ((obj as BoardUniversity).sequence === null || typeof (obj as BoardUniversity).sequence === 'number') &&
    typeof (obj as BoardUniversity).disabled === 'boolean' &&
    typeof (obj as BoardUniversity).createdAt === 'string' &&
    typeof (obj as BoardUniversity).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateBoardUniversityPayload
 */
export function isCreateBoardUniversityPayload(obj: object): obj is CreateBoardUniversityPayload {
  return (
    obj &&
    typeof (obj as CreateBoardUniversityPayload).name === 'string' &&
    ((obj as CreateBoardUniversityPayload).degreeId === undefined || (obj as CreateBoardUniversityPayload).degreeId === null || typeof (obj as CreateBoardUniversityPayload).degreeId === 'number') &&
    ((obj as CreateBoardUniversityPayload).passingMarks === undefined || (obj as CreateBoardUniversityPayload).passingMarks === null || typeof (obj as CreateBoardUniversityPayload).passingMarks === 'number') &&
    ((obj as CreateBoardUniversityPayload).code === undefined || (obj as CreateBoardUniversityPayload).code === null || typeof (obj as CreateBoardUniversityPayload).code === 'string') &&
    ((obj as CreateBoardUniversityPayload).addressId === undefined || (obj as CreateBoardUniversityPayload).addressId === null || typeof (obj as CreateBoardUniversityPayload).addressId === 'number') &&
    ((obj as CreateBoardUniversityPayload).sequence === undefined || (obj as CreateBoardUniversityPayload).sequence === null || typeof (obj as CreateBoardUniversityPayload).sequence === 'number') &&
    ((obj as CreateBoardUniversityPayload).disabled === undefined || typeof (obj as CreateBoardUniversityPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an UpdateBoardUniversityPayload
 */
export function isUpdateBoardUniversityPayload(obj: object): obj is UpdateBoardUniversityPayload {
  return (
    obj &&
    ((obj as UpdateBoardUniversityPayload).name === undefined || typeof (obj as UpdateBoardUniversityPayload).name === 'string') &&
    ((obj as UpdateBoardUniversityPayload).degreeId === undefined || (obj as UpdateBoardUniversityPayload).degreeId === null || typeof (obj as UpdateBoardUniversityPayload).degreeId === 'number') &&
    ((obj as UpdateBoardUniversityPayload).passingMarks === undefined || (obj as UpdateBoardUniversityPayload).passingMarks === null || typeof (obj as UpdateBoardUniversityPayload).passingMarks === 'number') &&
    ((obj as UpdateBoardUniversityPayload).code === undefined || (obj as UpdateBoardUniversityPayload).code === null || typeof (obj as UpdateBoardUniversityPayload).code === 'string') &&
    ((obj as UpdateBoardUniversityPayload).addressId === undefined || (obj as UpdateBoardUniversityPayload).addressId === null || typeof (obj as UpdateBoardUniversityPayload).addressId === 'number') &&
    ((obj as UpdateBoardUniversityPayload).sequence === undefined || (obj as UpdateBoardUniversityPayload).sequence === null || typeof (obj as UpdateBoardUniversityPayload).sequence === 'number') &&
    ((obj as UpdateBoardUniversityPayload).disabled === undefined || typeof (obj as UpdateBoardUniversityPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is a BoardUniversityWithRelations
 */
export function isBoardUniversityWithRelations(obj: object): obj is BoardUniversityWithRelations {
  return isBoardUniversity(obj) && (
    'degree' in obj && ((obj as BoardUniversityWithRelations).degree === undefined || (obj as BoardUniversityWithRelations).degree === null || typeof (obj as BoardUniversityWithRelations).degree === 'object')
  ) && (
    'address' in obj && ((obj as BoardUniversityWithRelations).address === undefined || (obj as BoardUniversityWithRelations).address === null || typeof (obj as BoardUniversityWithRelations).address === 'object')
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: BoardUniversityFormData): CreateBoardUniversityPayload {
  return {
    name: formData.name.trim(),
    degreeId: formData.degreeId ? parseInt(formData.degreeId, 10) : null,
    passingMarks: formData.passingMarks ? parseInt(formData.passingMarks, 10) : null,
    code: formData.code.trim() || null,
    addressId: formData.addressId ? parseInt(formData.addressId, 10) : null,
    sequence: formData.sequence ? parseInt(formData.sequence, 10) : null,
    disabled: formData.disabled,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(boardUniversity: BoardUniversity): BoardUniversityFormData {
  return {
    name: boardUniversity.name,
    degreeId: boardUniversity.degreeId?.toString() || '',
    passingMarks: boardUniversity.passingMarks?.toString() || '',
    code: boardUniversity.code || '',
    addressId: boardUniversity.addressId?.toString() || '',
    sequence: boardUniversity.sequence?.toString() || '',
    disabled: boardUniversity.disabled,
  };
}

/**
 * Validate board university name
 */
export function validateBoardUniversityName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 700;
}

/**
 * Validate board university code
 */
export function validateBoardUniversityCode(code: string): boolean {
  return code.trim().length === 0 || code.trim().length <= 255;
}

/**
 * Validate passing marks
 */
export function validatePassingMarks(marks: number): boolean {
  return marks >= 0 && marks <= 100;
}

/**
 * Format board university name for display
 */
export function formatBoardUniversityName(name: string): string {
  return name.trim();
}

/**
 * Format board university code for display
 */
export function formatBoardUniversityCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Get board university status text
 */
export function getBoardUniversityStatusText(disabled: boolean): string {
  return disabled ? 'Inactive' : 'Active';
}

/**
 * Get board university status color
 */
export function getBoardUniversityStatusColor(disabled: boolean): string {
  return disabled ? 'text-red-600' : 'text-green-600';
}

/**
 * Get degree name from board university with relations
 */
export function getDegreeName(boardUniversity: BoardUniversityWithRelations): string {
  return boardUniversity.degree?.name || 'N/A';
}

/**
 * Get address info from board university with relations
 */
export function getAddressInfo(boardUniversity: BoardUniversityWithRelations): string {
  return boardUniversity.address ? 'Address Available' : 'No Address';
} 