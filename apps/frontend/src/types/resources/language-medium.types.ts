/**
 * Language Medium Types
 * 
 * This file contains all TypeScript types and interfaces related to the Language Medium module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main Language Medium interface that mirrors the backend model
 */
export interface LanguageMedium {
  id: number;
  name: string;
  sequence?: number | null;
  disabled: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// ============================================================================
// API PAYLOAD TYPES
// ============================================================================

/**
 * Payload for creating a new language medium
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateLanguageMediumPayload {
  name: string;
  sequence?: number | null;
  disabled?: boolean;
}

/**
 * Payload for updating an existing language medium
 * All fields are optional for partial updates
 */
export interface UpdateLanguageMediumPayload {
  name?: string;
  sequence?: number | null;
  disabled?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for language medium operations
 */
export interface LanguageMediumApiResponse {
  statusCode: number;
  status: string;
  data: LanguageMedium | LanguageMedium[] | null;
  message: string;
}

/**
 * API response for single language medium
 */
export interface SingleLanguageMediumResponse {
  statusCode: number;
  status: string;
  data: LanguageMedium;
  message: string;
}

/**
 * API response for multiple language mediums
 */
export interface MultipleLanguageMediumResponse {
  statusCode: number;
  status: string;
  data: LanguageMedium[];
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for language medium forms
 */
export interface LanguageMediumFormData {
  name: string;
  sequence: string; // Form input as string, will be converted to number
  disabled: boolean;
}

/**
 * Form validation errors for language medium
 */
export interface LanguageMediumFormErrors {
  name?: string;
  sequence?: string;
  disabled?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for language medium management
 */
export interface LanguageMediumState {
  languageMediums: LanguageMedium[];
  currentLanguageMedium: LanguageMedium | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for language medium state management
 */
export type LanguageMediumAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_LANGUAGE_MEDIUMS'; payload: LanguageMedium[] }
  | { type: 'SET_CURRENT_LANGUAGE_MEDIUM'; payload: LanguageMedium | null }
  | { type: 'ADD_LANGUAGE_MEDIUM'; payload: LanguageMedium }
  | { type: 'UPDATE_LANGUAGE_MEDIUM'; payload: LanguageMedium }
  | { type: 'DELETE_LANGUAGE_MEDIUM'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for language medium table
 */
export interface LanguageMediumTableColumn {
  key: keyof LanguageMedium;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for language medium
 */
export interface LanguageMediumFilter {
  name?: string;
  disabled?: boolean;
  search?: string;
}

/**
 * Sort options for language medium
 */
export interface LanguageMediumSort {
  field: keyof LanguageMedium;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for language medium ID
 */
export type LanguageMediumId = number;

/**
 * Type for language medium name
 */
export type LanguageMediumName = string;

/**
 * Type for language medium sequence
 */
export type LanguageMediumSequence = number | null;

/**
 * Type for language medium disabled state
 */
export type LanguageMediumDisabled = boolean;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for language medium
 */
export const DEFAULT_LANGUAGE_MEDIUM: CreateLanguageMediumPayload = {
  name: '',
  sequence: null,
  disabled: false,
};

/**
 * Default form data for language medium
 */
export const DEFAULT_LANGUAGE_MEDIUM_FORM: LanguageMediumFormData = {
  name: '',
  sequence: '',
  disabled: false,
};

/**
 * Table columns configuration for language medium
 */
export const LANGUAGE_MEDIUM_TABLE_COLUMNS: LanguageMediumTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Language Medium', sortable: true, filterable: true },
  { key: 'sequence', label: 'Sequence', sortable: true, width: '100px' },
  { key: 'disabled', label: 'Status', sortable: true, width: '100px' },
  { key: 'createdAt', label: 'Created At', sortable: true, width: '150px' },
  { key: 'updatedAt', label: 'Updated At', sortable: true, width: '150px' },
];

/**
 * Common language mediums for reference
 */
export const COMMON_LANGUAGE_MEDIUMS = [
  'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Gujarati',
  'Kannada', 'Odia', 'Malayalam', 'Punjabi', 'Assamese', 'Sanskrit'
] as const;

/**
 * Type for common language medium values
 */
export type CommonLanguageMedium = typeof COMMON_LANGUAGE_MEDIUMS[number];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a LanguageMedium
 */
export function isLanguageMedium(obj: object): obj is LanguageMedium {
  return (
    obj &&
    typeof (obj as LanguageMedium).id === 'number' &&
    typeof (obj as LanguageMedium).name === 'string' &&
    ((obj as LanguageMedium).sequence === null || typeof (obj as LanguageMedium).sequence === 'number') &&
    typeof (obj as LanguageMedium).disabled === 'boolean' &&
    typeof (obj as LanguageMedium).createdAt === 'string' &&
    typeof (obj as LanguageMedium).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateLanguageMediumPayload
 */
export function isCreateLanguageMediumPayload(obj: object): obj is CreateLanguageMediumPayload {
  return (
    obj &&
    typeof (obj as CreateLanguageMediumPayload).name === 'string' &&
    ((obj as CreateLanguageMediumPayload).sequence === undefined || (obj as CreateLanguageMediumPayload).sequence === null || typeof (obj as CreateLanguageMediumPayload).sequence === 'number') &&
    ((obj as CreateLanguageMediumPayload).disabled === undefined || typeof (obj as CreateLanguageMediumPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an UpdateLanguageMediumPayload
 */
export function isUpdateLanguageMediumPayload(obj: object): obj is UpdateLanguageMediumPayload {
  return (
    obj &&
    ((obj as UpdateLanguageMediumPayload).name === undefined || typeof (obj as UpdateLanguageMediumPayload).name === 'string') &&
    ((obj as UpdateLanguageMediumPayload).sequence === undefined || (obj as UpdateLanguageMediumPayload).sequence === null || typeof (obj as UpdateLanguageMediumPayload).sequence === 'number') &&
    ((obj as UpdateLanguageMediumPayload).disabled === undefined || typeof (obj as UpdateLanguageMediumPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if a string is a common language medium
 */
export function isCommonLanguageMedium(value: string): value is CommonLanguageMedium {
  return COMMON_LANGUAGE_MEDIUMS.includes(value as CommonLanguageMedium);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: LanguageMediumFormData): CreateLanguageMediumPayload {
  return {
    name: formData.name.trim(),
    sequence: formData.sequence ? parseInt(formData.sequence, 10) : null,
    disabled: formData.disabled,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(languageMedium: LanguageMedium): LanguageMediumFormData {
  return {
    name: languageMedium.name,
    sequence: languageMedium.sequence?.toString() || '',
    disabled: languageMedium.disabled,
  };
}

/**
 * Validate language medium name
 */
export function validateLanguageMediumName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 255;
}

/**
 * Format language medium name for display
 */
export function formatLanguageMediumName(name: string): string {
  return name.trim();
}

/**
 * Get language medium status text
 */
export function getLanguageMediumStatusText(disabled: boolean): string {
  return disabled ? 'Inactive' : 'Active';
}

/**
 * Get language medium status color
 */
export function getLanguageMediumStatusColor(disabled: boolean): string {
  return disabled ? 'text-red-600' : 'text-green-600';
}

/**
 * Get language flag emoji (basic implementation)
 */
export function getLanguageFlag(languageName: string): string {
  const flagMap: Record<string, string> = {
    'English': '🇺🇸',
    'Hindi': '🇮🇳',
    'Bengali': '🇧🇩',
    'Telugu': '🇮🇳',
    'Marathi': '🇮🇳',
    'Tamil': '🇮🇳',
    'Gujarati': '🇮🇳',
    'Kannada': '🇮🇳',
    'Odia': '🇮🇳',
    'Malayalam': '🇮🇳',
    'Punjabi': '🇮🇳',
    'Assamese': '🇮🇳',
    'Sanskrit': '🇮🇳',
  };
  
  return flagMap[languageName] || '🌐';
}

/**
 * Get language medium display name with flag
 */
export function getLanguageMediumDisplayName(languageName: string): string {
  const flag = getLanguageFlag(languageName);
  return `${flag} ${languageName}`;
} 