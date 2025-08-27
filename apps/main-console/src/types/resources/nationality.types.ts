/**
 * Nationality Types
 * 
 * This file contains all TypeScript types and interfaces related to the Nationality module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main Nationality interface that mirrors the backend model
 */
export interface Nationality {
  readonly id?: number;
  name: string;
  code?: number | null;
  sequence?: number | null;
  disabled: boolean;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// ============================================================================
// API PAYLOAD TYPES
// ============================================================================

/**
 * Payload for creating a new nationality
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateNationalityPayload {
  name: string;
  code?: number | null;
  sequence?: number | null;
  disabled?: boolean;
}

/**
 * Payload for updating an existing nationality
 * All fields are optional for partial updates
 */
export interface UpdateNationalityPayload {
  name?: string;
  code?: number | null;
  sequence?: number | null;
  disabled?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for nationality operations
 */
export interface NationalityApiResponse {
  statusCode: number;
  status: string;
  data: Nationality | Nationality[] | null;
  message: string;
}

/**
 * API response for single nationality
 */
export interface SingleNationalityResponse {
  statusCode: number;
  status: string;
  data: Nationality;
  message: string;
}

/**
 * API response for multiple nationalities
 */
export interface MultipleNationalityResponse {
  statusCode: number;
  status: string;
  data: Nationality[];
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for nationality forms
 */
export interface NationalityFormData {
  name: string;
  code: string; // Form input as string, will be converted to number
  sequence: string; // Form input as string, will be converted to number
  disabled: boolean;
}

/**
 * Form validation errors for nationality
 */
export interface NationalityFormErrors {
  name?: string;
  code?: string;
  sequence?: string;
  disabled?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for nationality management
 */
export interface NationalityState {
  nationalities: Nationality[];
  currentNationality: Nationality | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for nationality state management
 */
export type NationalityAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_NATIONALITIES'; payload: Nationality[] }
  | { type: 'SET_CURRENT_NATIONALITY'; payload: Nationality | null }
  | { type: 'ADD_NATIONALITY'; payload: Nationality }
  | { type: 'UPDATE_NATIONALITY'; payload: Nationality }
  | { type: 'DELETE_NATIONALITY'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for nationality table
 */
export interface NationalityTableColumn {
  key: keyof Nationality;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for nationality
 */
export interface NationalityFilter {
  name?: string;
  code?: number;
  disabled?: boolean;
  search?: string;
}

/**
 * Sort options for nationality
 */
export interface NationalitySort {
  field: keyof Nationality;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for nationality ID
 */
export type NationalityId = number;

/**
 * Type for nationality name
 */
export type NationalityName = string;

/**
 * Type for nationality code
 */
export type NationalityCode = number | null;

/**
 * Type for nationality sequence
 */
export type NationalitySequence = number | null;

/**
 * Type for nationality disabled state
 */
export type NationalityDisabled = boolean;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for nationality
 */
export const DEFAULT_NATIONALITY: CreateNationalityPayload = {
  name: '',
  code: null,
  sequence: null,
  disabled: false,
};

/**
 * Default form data for nationality
 */
export const DEFAULT_NATIONALITY_FORM: NationalityFormData = {
  name: '',
  code: '',
  sequence: '',
  disabled: false,
};

/**
 * Table columns configuration for nationality
 */
export const NATIONALITY_TABLE_COLUMNS: NationalityTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Nationality', sortable: true, filterable: true },
  { key: 'code', label: 'Code', sortable: true, filterable: true, width: '100px' },
  { key: 'sequence', label: 'Sequence', sortable: true, width: '100px' },
  { key: 'disabled', label: 'Status', sortable: true, width: '100px' },
  { key: 'createdAt', label: 'Created At', sortable: true, width: '150px' },
  { key: 'updatedAt', label: 'Updated At', sortable: true, width: '150px' },
];

/**
 * Common nationalities for reference
 */
export const COMMON_NATIONALITIES = [
  'Indian', 'American', 'British', 'Canadian', 'Australian', 'German',
  'French', 'Japanese', 'Chinese', 'Brazilian', 'Mexican', 'South African'
] as const;

/**
 * Type for common nationality values
 */
export type CommonNationality = typeof COMMON_NATIONALITIES[number];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a Nationality
 */
export function isNationality(obj: object): obj is Nationality {
  return (
    obj &&
    typeof (obj as Nationality).id === 'number' &&
    typeof (obj as Nationality).name === 'string' &&
    ((obj as Nationality).code === null || typeof (obj as Nationality).code === 'number') &&
    ((obj as Nationality).sequence === null || typeof (obj as Nationality).sequence === 'number') &&
    typeof (obj as Nationality).disabled === 'boolean' &&
    typeof (obj as Nationality).createdAt === 'string' &&
    typeof (obj as Nationality).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateNationalityPayload
 */
export function isCreateNationalityPayload(obj: object): obj is CreateNationalityPayload {
  return (
    obj &&
    typeof (obj as CreateNationalityPayload).name === 'string' &&
    ((obj as CreateNationalityPayload).code === undefined || (obj as CreateNationalityPayload).code === null || typeof (obj as CreateNationalityPayload).code === 'number') &&
    ((obj as CreateNationalityPayload).sequence === undefined || (obj as CreateNationalityPayload).sequence === null || typeof (obj as CreateNationalityPayload).sequence === 'number') &&
    ((obj as CreateNationalityPayload).disabled === undefined || typeof (obj as CreateNationalityPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an UpdateNationalityPayload
 */
export function isUpdateNationalityPayload(obj: object): obj is UpdateNationalityPayload {
  return (
    obj &&
    ((obj as UpdateNationalityPayload).name === undefined || typeof (obj as UpdateNationalityPayload).name === 'string') &&
    ((obj as UpdateNationalityPayload).code === undefined || (obj as UpdateNationalityPayload).code === null || typeof (obj as UpdateNationalityPayload).code === 'number') &&
    ((obj as UpdateNationalityPayload).sequence === undefined || (obj as UpdateNationalityPayload).sequence === null || typeof (obj as UpdateNationalityPayload).sequence === 'number') &&
    ((obj as UpdateNationalityPayload).disabled === undefined || typeof (obj as UpdateNationalityPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if a string is a common nationality
 */
export function isCommonNationality(value: string): value is CommonNationality {
  return COMMON_NATIONALITIES.includes(value as CommonNationality);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: NationalityFormData): CreateNationalityPayload {
  return {
    name: formData.name.trim(),
    code: formData.code ? parseInt(formData.code, 10) : null,
    sequence: formData.sequence ? parseInt(formData.sequence, 10) : null,
    disabled: formData.disabled,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(nationality: Nationality): NationalityFormData {
  return {
    name: nationality.name,
    code: nationality.code?.toString() || '',
    sequence: nationality.sequence?.toString() || '',
    disabled: nationality.disabled,
  };
}

/**
 * Validate nationality name
 */
export function validateNationalityName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 255;
}

/**
 * Validate nationality code
 */
export function validateNationalityCode(code: number): boolean {
  return code >= 0;
}

/**
 * Format nationality name for display
 */
export function formatNationalityName(name: string): string {
  return name.trim();
}

/**
 * Get nationality status text
 */
export function getNationalityStatusText(disabled: boolean): string {
  return disabled ? 'Inactive' : 'Active';
}

/**
 * Get nationality status color
 */
export function getNationalityStatusColor(disabled: boolean): string {
  return disabled ? 'text-red-600' : 'text-green-600';
}

/**
 * Get nationality flag emoji (basic implementation)
 */
export function getNationalityFlag(nationalityName: string): string {
  const flagMap: Record<string, string> = {
    'Indian': '🇮🇳',
    'American': '🇺🇸',
    'British': '🇬🇧',
    'Canadian': '🇨🇦',
    'Australian': '🇦🇺',
    'German': '🇩🇪',
    'French': '🇫🇷',
    'Japanese': '🇯🇵',
    'Chinese': '🇨🇳',
    'Brazilian': '🇧🇷',
    'Mexican': '🇲🇽',
    'South African': '🇿🇦',
  };
  
  return flagMap[nationalityName] || '🌍';
}

/**
 * Get nationality display name with flag
 */
export function getNationalityDisplayName(nationalityName: string): string {
  const flag = getNationalityFlag(nationalityName);
  return `${flag} ${nationalityName}`;
} 