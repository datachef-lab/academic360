/**
 * Occupation Types
 * 
 * This file contains all TypeScript types and interfaces related to the Occupation module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main Occupation interface that mirrors the backend model
 */
export interface Occupation {
    readonly id?: number;
  name: string;
  sequence?: number | null;
  disabled: boolean;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// ============================================================================
// API PAYLOAD TYPES
// ============================================================================

/**
 * Payload for creating a new occupation
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateOccupationPayload {
  name: string;
  sequence?: number | null;
  disabled?: boolean;
}

/**
 * Payload for updating an existing occupation
 * All fields are optional for partial updates
 */
export interface UpdateOccupationPayload {
  name?: string;
  sequence?: number | null;
  disabled?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for occupation operations
 */
export interface OccupationApiResponse {
  statusCode: number;
  status: string;
  data: Occupation | Occupation[] | null;
  message: string;
}

/**
 * API response for single occupation
 */
export interface SingleOccupationResponse {
  statusCode: number;
  status: string;
  data: Occupation;
  message: string;
}

/**
 * API response for multiple occupations
 */
export interface MultipleOccupationResponse {
  statusCode: number;
  status: string;
  data: Occupation[];
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for occupation forms
 */
export interface OccupationFormData {
  name: string;
  sequence: string; // Form input as string, will be converted to number
  disabled: boolean;
}

/**
 * Form validation errors for occupation
 */
export interface OccupationFormErrors {
  name?: string;
  sequence?: string;
  disabled?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for occupation management
 */
export interface OccupationState {
  occupations: Occupation[];
  currentOccupation: Occupation | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for occupation state management
 */
export type OccupationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_OCCUPATIONS'; payload: Occupation[] }
  | { type: 'SET_CURRENT_OCCUPATION'; payload: Occupation | null }
  | { type: 'ADD_OCCUPATION'; payload: Occupation }
  | { type: 'UPDATE_OCCUPATION'; payload: Occupation }
  | { type: 'DELETE_OCCUPATION'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for occupation table
 */
export interface OccupationTableColumn {
  key: keyof Occupation;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for occupation
 */
export interface OccupationFilter {
  name?: string;
  disabled?: boolean;
  search?: string;
}

/**
 * Sort options for occupation
 */
export interface OccupationSort {
  field: keyof Occupation;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for occupation ID
 */
export type OccupationId = number;

/**
 * Type for occupation name
 */
export type OccupationName = string;

/**
 * Type for occupation sequence
 */
export type OccupationSequence = number | null;

/**
 * Type for occupation disabled state
 */
export type OccupationDisabled = boolean;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for occupation
 */
export const DEFAULT_OCCUPATION: CreateOccupationPayload = {
  name: '',
  sequence: null,
  disabled: false,
};

/**
 * Default form data for occupation
 */
export const DEFAULT_OCCUPATION_FORM: OccupationFormData = {
  name: '',
  sequence: '',
  disabled: false,
};

/**
 * Table columns configuration for occupation
 */
export const OCCUPATION_TABLE_COLUMNS: OccupationTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Occupation', sortable: true, filterable: true },
  { key: 'sequence', label: 'Sequence', sortable: true, width: '100px' },
  { key: 'disabled', label: 'Status', sortable: true, width: '100px' },
  { key: 'createdAt', label: 'Created At', sortable: true, width: '150px' },
  { key: 'updatedAt', label: 'Updated At', sortable: true, width: '150px' },
];

/**
 * Common occupations for reference
 */
export const COMMON_OCCUPATIONS = [
  'Student', 'Teacher', 'Engineer', 'Doctor', 'Lawyer', 'Accountant',
  'Business Owner', 'Manager', 'Administrator', 'Sales Representative',
  'Marketing Specialist', 'IT Professional', 'Designer', 'Writer',
  'Consultant', 'Entrepreneur', 'Government Employee', 'Retired',
  'Homemaker', 'Unemployed', 'Other'
] as const;

/**
 * Type for common occupation values
 */
export type CommonOccupation = typeof COMMON_OCCUPATIONS[number];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is an Occupation
 */
export function isOccupation(obj: object): obj is Occupation {
  return (
    obj &&
    typeof (obj as Occupation).id === 'number' &&
    typeof (obj as Occupation).name === 'string' &&
    ((obj as Occupation).sequence === null || typeof (obj as Occupation).sequence === 'number') &&
    typeof (obj as Occupation).disabled === 'boolean' &&
    typeof (obj as Occupation).createdAt === 'string' &&
    typeof (obj as Occupation).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateOccupationPayload
 */
export function isCreateOccupationPayload(obj: object): obj is CreateOccupationPayload {
  return (
    obj &&
    typeof (obj as CreateOccupationPayload).name === 'string' &&
    ((obj as CreateOccupationPayload).sequence === undefined || (obj as CreateOccupationPayload).sequence === null || typeof (obj as CreateOccupationPayload).sequence === 'number') &&
    ((obj as CreateOccupationPayload).disabled === undefined || typeof (obj as CreateOccupationPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an UpdateOccupationPayload
 */
export function isUpdateOccupationPayload(obj: object): obj is UpdateOccupationPayload {
  return (
    obj &&
    ((obj as UpdateOccupationPayload).name === undefined || typeof (obj as UpdateOccupationPayload).name === 'string') &&
    ((obj as UpdateOccupationPayload).sequence === undefined || (obj as UpdateOccupationPayload).sequence === null || typeof (obj as UpdateOccupationPayload).sequence === 'number') &&
    ((obj as UpdateOccupationPayload).disabled === undefined || typeof (obj as UpdateOccupationPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if a string is a common occupation
 */
export function isCommonOccupation(value: string): value is CommonOccupation {
  return COMMON_OCCUPATIONS.includes(value as CommonOccupation);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: OccupationFormData): CreateOccupationPayload {
  return {
    name: formData.name.trim(),
    sequence: formData.sequence ? parseInt(formData.sequence, 10) : null,
    disabled: formData.disabled,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(occupation: Occupation): OccupationFormData {
  return {
    name: occupation.name,
    sequence: occupation.sequence?.toString() || '',
    disabled: occupation.disabled,
  };
}

/**
 * Validate occupation name
 */
export function validateOccupationName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 255;
}

/**
 * Format occupation name for display
 */
export function formatOccupationName(name: string): string {
  return name.trim();
}

/**
 * Get occupation status text
 */
export function getOccupationStatusText(disabled: boolean): string {
  return disabled ? 'Inactive' : 'Active';
}

/**
 * Get occupation status color
 */
export function getOccupationStatusColor(disabled: boolean): string {
  return disabled ? 'text-red-600' : 'text-green-600';
}

/**
 * Get occupation category (basic categorization)
 */
export function getOccupationCategory(occupationName: string): string {
  const categoryMap: Record<string, string> = {
    'Student': 'Education',
    'Teacher': 'Education',
    'Engineer': 'Technology',
    'Doctor': 'Healthcare',
    'Lawyer': 'Legal',
    'Accountant': 'Finance',
    'Business Owner': 'Business',
    'Manager': 'Management',
    'Administrator': 'Administration',
    'Sales Representative': 'Sales',
    'Marketing Specialist': 'Marketing',
    'IT Professional': 'Technology',
    'Designer': 'Creative',
    'Writer': 'Creative',
    'Consultant': 'Professional Services',
    'Entrepreneur': 'Business',
    'Government Employee': 'Government',
    'Retired': 'Retirement',
    'Homemaker': 'Home',
    'Unemployed': 'Employment Status',
    'Other': 'Other',
  };
  
  return categoryMap[occupationName] || 'Other';
}

/**
 * Get occupation category color
 */
export function getOccupationCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'Education': 'text-blue-600',
    'Technology': 'text-purple-600',
    'Healthcare': 'text-red-600',
    'Legal': 'text-gray-600',
    'Finance': 'text-green-600',
    'Business': 'text-orange-600',
    'Management': 'text-indigo-600',
    'Administration': 'text-pink-600',
    'Sales': 'text-yellow-600',
    'Marketing': 'text-teal-600',
    'Creative': 'text-rose-600',
    'Professional Services': 'text-cyan-600',
    'Government': 'text-slate-600',
    'Retirement': 'text-amber-600',
    'Home': 'text-emerald-600',
    'Employment Status': 'text-neutral-600',
    'Other': 'text-gray-500',
  };
  
  return colorMap[category] || 'text-gray-500';
} 