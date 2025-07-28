/**
 * Degree Types
 * 
 * This file contains all TypeScript types and interfaces related to the Degree module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Degree level enum that mirrors the backend enum
 */
export enum DegreeLevel {
  SECONDARY = "SECONDARY",
  HIGHER_SECONDARY = "HIGHER_SECONDARY",
  UNDER_GRADUATE = "UNDER_GRADUATE",
  POST_GRADUATE = "POST_GRADUATE"
}

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main Degree interface that mirrors the backend model
 */
export interface Degree {
  id: number;
  name: string;
  level: DegreeLevel;
  sequence?: number | null;
  disabled: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// ============================================================================
// API PAYLOAD TYPES
// ============================================================================

/**
 * Payload for creating a new degree
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateDegreePayload {
  name: string;
  level: DegreeLevel;
  sequence?: number | null;
  disabled?: boolean;
}

/**
 * Payload for updating an existing degree
 * All fields are optional for partial updates
 */
export interface UpdateDegreePayload {
  name?: string;
  level?: DegreeLevel;
  sequence?: number | null;
  disabled?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for degree operations
 */
export interface DegreeApiResponse {
  statusCode: number;
  status: string;
  data: Degree | Degree[] | null;
  message: string;
}

/**
 * API response for single degree
 */
export interface SingleDegreeResponse {
  statusCode: number;
  status: string;
  data: Degree;
  message: string;
}

/**
 * API response for multiple degrees
 */
export interface MultipleDegreeResponse {
  httpStatusCode: number;
  payload: Degree[];
  httpStatus: string;
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for degree forms
 */
export interface DegreeFormData {
  name: string;
  level: DegreeLevel;
  sequence: string; // Form input as string, will be converted to number
  disabled: boolean;
}

/**
 * Form validation errors for degree
 */
export interface DegreeFormErrors {
  name?: string;
  level?: string;
  sequence?: string;
  disabled?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for degree management
 */
export interface DegreeState {
  degrees: Degree[];
  currentDegree: Degree | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for degree state management
 */
export type DegreeAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_DEGREES'; payload: Degree[] }
  | { type: 'SET_CURRENT_DEGREE'; payload: Degree | null }
  | { type: 'ADD_DEGREE'; payload: Degree }
  | { type: 'UPDATE_DEGREE'; payload: Degree }
  | { type: 'DELETE_DEGREE'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for degree table
 */
export interface DegreeTableColumn {
  key: keyof Degree;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for degree
 */
export interface DegreeFilter {
  name?: string;
  level?: DegreeLevel;
  disabled?: boolean;
  search?: string;
}

/**
 * Sort options for degree
 */
export interface DegreeSort {
  field: keyof Degree;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for degree ID
 */
export type DegreeId = number;

/**
 * Type for degree name
 */
export type DegreeName = string;

/**
 * Type for degree level
 */
export type DegreeLevelType = DegreeLevel;

/**
 * Type for degree sequence
 */
export type DegreeSequence = number | null;

/**
 * Type for degree disabled state
 */
export type DegreeDisabled = boolean;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for degree
 */
export const DEFAULT_DEGREE: CreateDegreePayload = {
  name: '',
  level: DegreeLevel.UNDER_GRADUATE,
  sequence: null,
  disabled: false,
};

/**
 * Default form data for degree
 */
export const DEFAULT_DEGREE_FORM: DegreeFormData = {
  name: '',
  level: DegreeLevel.UNDER_GRADUATE,
  sequence: '',
  disabled: false,
};

/**
 * Table columns configuration for degree
 */
export const DEGREE_TABLE_COLUMNS: DegreeTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Degree Name', sortable: true, filterable: true },
  { key: 'level', label: 'Level', sortable: true, filterable: true, width: '150px' },
  { key: 'sequence', label: 'Sequence', sortable: true, width: '100px' },
  { key: 'disabled', label: 'Status', sortable: true, width: '100px' },
  { key: 'createdAt', label: 'Created At', sortable: true, width: '150px' },
  { key: 'updatedAt', label: 'Updated At', sortable: true, width: '150px' },
];

/**
 * Degree level options for forms
 */
export const DEGREE_LEVEL_OPTIONS = [
  { value: DegreeLevel.SECONDARY, label: 'Secondary' },
  { value: DegreeLevel.HIGHER_SECONDARY, label: 'Higher Secondary' },
  { value: DegreeLevel.UNDER_GRADUATE, label: 'Under Graduate' },
  { value: DegreeLevel.POST_GRADUATE, label: 'Post Graduate' },
] as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a Degree
 */
export function isDegree(obj: object): obj is Degree {
  return (
    obj &&
    typeof (obj as Degree).id === 'number' &&
    typeof (obj as Degree).name === 'string' &&
    Object.values(DegreeLevel).includes((obj as Degree).level) &&
    ((obj as Degree).sequence === null || typeof (obj as Degree).sequence === 'number') &&
    typeof (obj as Degree).disabled === 'boolean' &&
    typeof (obj as Degree).createdAt === 'string' &&
    typeof (obj as Degree).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateDegreePayload
 */
export function isCreateDegreePayload(obj: object): obj is CreateDegreePayload {
  return (
    obj &&
    typeof (obj as CreateDegreePayload).name === 'string' &&
    Object.values(DegreeLevel).includes((obj as CreateDegreePayload).level) &&
    ((obj as CreateDegreePayload).sequence === undefined || (obj as CreateDegreePayload).sequence === null || typeof (obj as CreateDegreePayload).sequence === 'number') &&
    ((obj as CreateDegreePayload).disabled === undefined || typeof (obj as CreateDegreePayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an UpdateDegreePayload
 */
export function isUpdateDegreePayload(obj: object): obj is UpdateDegreePayload {
  return (
    obj &&
    ((obj as UpdateDegreePayload).name === undefined || typeof (obj as UpdateDegreePayload).name === 'string') &&
    ((obj as UpdateDegreePayload).level === undefined || Object.values(DegreeLevel).includes((obj as UpdateDegreePayload).level as DegreeLevel)) &&
    ((obj as UpdateDegreePayload).sequence === undefined || (obj as UpdateDegreePayload).sequence === null || typeof (obj as UpdateDegreePayload).sequence === 'number') &&
    ((obj as UpdateDegreePayload).disabled === undefined || typeof (obj as UpdateDegreePayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if a value is a valid degree level
 */
export function isDegreeLevel(value: unknown): value is DegreeLevel {
  return Object.values(DegreeLevel).includes(value as DegreeLevel);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: DegreeFormData): CreateDegreePayload {
  return {
    name: formData.name.trim(),
    level: formData.level,
    sequence: formData.sequence ? parseInt(formData.sequence, 10) : null,
    disabled: formData.disabled,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(degree: Degree): DegreeFormData {
  return {
    name: degree.name,
    level: degree.level,
    sequence: degree.sequence?.toString() || '',
    disabled: degree.disabled,
  };
}

/**
 * Validate degree name
 */
export function validateDegreeName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 255;
}

/**
 * Format degree name for display
 */
export function formatDegreeName(name: string): string {
  return name.trim();
}

/**
 * Get degree level display text
 */
export function getDegreeLevelText(level: DegreeLevel): string {
  const levelMap: Record<DegreeLevel, string> = {
    [DegreeLevel.SECONDARY]: 'Secondary',
    [DegreeLevel.HIGHER_SECONDARY]: 'Higher Secondary',
    [DegreeLevel.UNDER_GRADUATE]: 'Under Graduate',
    [DegreeLevel.POST_GRADUATE]: 'Post Graduate',
  };
  return levelMap[level] || level;
}

/**
 * Get degree level color
 */
export function getDegreeLevelColor(level: DegreeLevel): string {
  const colorMap: Record<DegreeLevel, string> = {
    [DegreeLevel.SECONDARY]: 'text-blue-600',
    [DegreeLevel.HIGHER_SECONDARY]: 'text-green-600',
    [DegreeLevel.UNDER_GRADUATE]: 'text-purple-600',
    [DegreeLevel.POST_GRADUATE]: 'text-orange-600',
  };
  return colorMap[level] || 'text-gray-600';
}

/**
 * Get degree status text
 */
export function getDegreeStatusText(disabled: boolean): string {
  return disabled ? 'Inactive' : 'Active';
}

/**
 * Get degree status color
 */
export function getDegreeStatusColor(disabled: boolean): string {
  return disabled ? 'text-red-600' : 'text-green-600';
}

/**
 * Get degree level order for sorting
 */
export function getDegreeLevelOrder(level: DegreeLevel): number {
  const orderMap: Record<DegreeLevel, number> = {
    [DegreeLevel.SECONDARY]: 1,
    [DegreeLevel.HIGHER_SECONDARY]: 2,
    [DegreeLevel.UNDER_GRADUATE]: 3,
    [DegreeLevel.POST_GRADUATE]: 4,
  };
  return orderMap[level] || 0;
} 