/**
 * Country Types
 * 
 * This file contains all TypeScript types and interfaces related to the Country module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main Country interface that mirrors the backend model
 */
export interface Country {
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
 * Payload for creating a new country
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateCountryPayload {
  name: string;
  sequence?: number | null;
  disabled?: boolean;
}

/**
 * Payload for updating an existing country
 * All fields are optional for partial updates
 */
export interface UpdateCountryPayload {
  name?: string;
  sequence?: number | null;
  disabled?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for country operations
 */
export interface CountryApiResponse {
  statusCode: number;
  status: string;
  payload: Country | Country[] | null;
  message: string;
}

/**
 * API response for single country
 */
export interface SingleCountryResponse {
  statusCode: number;
  status: string;
  payload: Country;
  message: string;
}

/**
 * API response for multiple countries
 */
export interface MultipleCountryResponse {
  statusCode: number;
  status: string;
  payload: Country[];
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for country forms
 */
export interface CountryFormData {
  name: string;
  sequence: string; // Form input as string, will be converted to number
  disabled: boolean;
}

/**
 * Form validation errors for country
 */
export interface CountryFormErrors {
  name?: string;
  sequence?: string;
  disabled?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for country management
 */
export interface CountryState {
  countries: Country[];
  currentCountry: Country | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for country state management
 */
export type CountryAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_COUNTRIES'; payload: Country[] }
  | { type: 'SET_CURRENT_COUNTRY'; payload: Country | null }
  | { type: 'ADD_COUNTRY'; payload: Country }
  | { type: 'UPDATE_COUNTRY'; payload: Country }
  | { type: 'DELETE_COUNTRY'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for country table
 */
export interface CountryTableColumn {
  key: keyof Country;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for country
 */
export interface CountryFilter {
  name?: string;
  disabled?: boolean;
  search?: string;
}

/**
 * Sort options for country
 */
export interface CountrySort {
  field: keyof Country;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for country ID
 */
export type CountryId = number;

/**
 * Type for country name
 */
export type CountryName = string;

/**
 * Type for country sequence
 */
export type CountrySequence = number | null;

/**
 * Type for country disabled state
 */
export type CountryDisabled = boolean;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for country
 */
export const DEFAULT_COUNTRY: CreateCountryPayload = {
  name: '',
  sequence: null,
  disabled: false,
};

/**
 * Default form data for country
 */
export const DEFAULT_COUNTRY_FORM: CountryFormData = {
  name: '',
  sequence: '',
  disabled: false,
};

/**
 * Table columns configuration for country
 */
export const COUNTRY_TABLE_COLUMNS: CountryTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Country Name', sortable: true, filterable: true },
  { key: 'sequence', label: 'Sequence', sortable: true, width: '100px' },
  { key: 'disabled', label: 'Status', sortable: true, width: '100px' },
  { key: 'createdAt', label: 'Created At', sortable: true, width: '150px' },
  { key: 'updatedAt', label: 'Updated At', sortable: true, width: '150px' },
];

/**
 * Common countries for reference
 */
export const COMMON_COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Japan', 'China', 'Brazil', 'Mexico', 'South Africa'
] as const;

/**
 * Type for common country values
 */
export type CommonCountry = typeof COMMON_COUNTRIES[number];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a Country
 */
export function isCountry(obj: object): obj is Country {
  return (
    obj &&
    typeof (obj as Country).id === 'number' &&
    typeof (obj as Country).name === 'string' &&
    ((obj as Country).sequence === null || typeof (obj as Country).sequence === 'number') &&
    typeof (obj as Country).disabled === 'boolean' &&
    typeof (obj as Country).createdAt === 'string' &&
    typeof (obj as Country).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateCountryPayload
 */
export function isCreateCountryPayload(obj: object): obj is CreateCountryPayload {
  return (
    obj &&
    typeof (obj as CreateCountryPayload).name === 'string' &&
    ((obj as CreateCountryPayload).sequence === undefined || (obj as CreateCountryPayload).sequence === null || typeof (obj as CreateCountryPayload).sequence === 'number') &&
    ((obj as CreateCountryPayload).disabled === undefined || typeof (obj as CreateCountryPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an UpdateCountryPayload
 */
export function isUpdateCountryPayload(obj: object): obj is UpdateCountryPayload {
  return (
    obj &&
    ((obj as UpdateCountryPayload).name === undefined || typeof (obj as UpdateCountryPayload).name === 'string') &&
    ((obj as UpdateCountryPayload).sequence === undefined || (obj as UpdateCountryPayload).sequence === null || typeof (obj as UpdateCountryPayload).sequence === 'number') &&
    ((obj as UpdateCountryPayload).disabled === undefined || typeof (obj as UpdateCountryPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if a string is a common country
 */
export function isCommonCountry(value: string): value is CommonCountry {
  return COMMON_COUNTRIES.includes(value as CommonCountry);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: CountryFormData): CreateCountryPayload {
  return {
    name: formData.name.trim(),
    sequence: formData.sequence ? parseInt(formData.sequence, 10) : null,
    disabled: formData.disabled,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(country: Country): CountryFormData {
  return {
    name: country.name,
    sequence: country.sequence?.toString() || '',
    disabled: country.disabled,
  };
}

/**
 * Validate country name
 */
export function validateCountryName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 255;
}

/**
 * Format country name for display
 */
export function formatCountryName(name: string): string {
  return name.trim();
}

/**
 * Get country status text
 */
export function getCountryStatusText(disabled: boolean): string {
  return disabled ? 'Inactive' : 'Active';
}

/**
 * Get country status color
 */
export function getCountryStatusColor(disabled: boolean): string {
  return disabled ? 'text-red-600' : 'text-green-600';
}

/**
 * Get country flag emoji (basic implementation)
 */
export function getCountryFlag(countryName: string): string {
  const flagMap: Record<string, string> = {
    'India': '🇮🇳',
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    'Canada': '🇨🇦',
    'Australia': '🇦🇺',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Japan': '🇯🇵',
    'China': '🇨🇳',
    'Brazil': '🇧🇷',
    'Mexico': '🇲🇽',
    'South Africa': '🇿🇦',
  };
  
  return flagMap[countryName] || '🌍';
}

/**
 * Get country display name with flag
 */
export function getCountryDisplayName(countryName: string): string {
  const flag = getCountryFlag(countryName);
  return `${flag} ${countryName}`;
} 