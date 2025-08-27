/**
 * City Types
 * 
 * This file contains all TypeScript types and interfaces related to the City module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main City interface that mirrors the backend model
 */
export interface City {
    readonly id?: number;
  stateId: number;
  name: string;
  documentRequired: boolean;
  code: string;
  sequence?: number | null;
  disabled: boolean;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

/**
 * City with relations (includes related state data)
 */
export interface CityWithRelations extends City {
  state?: {
    id: number;
    name: string;
    // Add other state fields as needed
  } | null;
}

// ============================================================================
// API PAYLOAD TYPES
// ============================================================================

/**
 * Payload for creating a new city
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateCityPayload {
  stateId: number;
  name: string;
  documentRequired: boolean;
  code: string;
  sequence?: number | null;
  disabled?: boolean;
}

/**
 * Payload for updating an existing city
 * All fields are optional for partial updates
 */
export interface UpdateCityPayload {
  stateId?: number;
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
 * Standard API response structure for city operations
 */
export interface CityApiResponse {
  statusCode: number;
  status: string;
  data: City | City[] | CityWithRelations | CityWithRelations[] | null;
  message: string;
}

/**
 * API response for single city
 */
export interface SingleCityResponse {
  statusCode: number;
  status: string;
  data: City | CityWithRelations;
  message: string;
}

/**
 * API response for multiple cities
 */
export interface MultipleCityResponse {
  httpStatusCode: number;
  payload: City[] | CityWithRelations[];
  httpStatus: string;
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for city forms
 */
export interface CityFormData {
  stateId: string; // Form input as string, will be converted to number
  name: string;
  documentRequired: boolean;
  code: string;
  sequence: string; // Form input as string, will be converted to number
  disabled: boolean;
}

/**
 * Form validation errors for city
 */
export interface CityFormErrors {
  stateId?: string;
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
 * State interface for city management
 */
export interface CityState {
  cities: City[];
  currentCity: City | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for city state management
 */
export type CityAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_CITIES'; payload: City[] }
  | { type: 'SET_CURRENT_CITY'; payload: City | null }
  | { type: 'ADD_CITY'; payload: City }
  | { type: 'UPDATE_CITY'; payload: City }
  | { type: 'DELETE_CITY'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for city table
 */
export interface CityTableColumn {
  key: keyof City;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for city
 */
export interface CityFilter {
  stateId?: number;
  name?: string;
  code?: string;
  documentRequired?: boolean;
  disabled?: boolean;
  search?: string;
}

/**
 * Sort options for city
 */
export interface CitySort {
  field: keyof City;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for city ID
 */
export type CityId = number;

/**
 * Type for city state ID
 */
export type CityStateId = number;

/**
 * Type for city name
 */
export type CityName = string;

/**
 * Type for city document required flag
 */
export type CityDocumentRequired = boolean;

/**
 * Type for city code
 */
export type CityCode = string;

/**
 * Type for city sequence
 */
export type CitySequence = number | null;

/**
 * Type for city disabled state
 */
export type CityDisabled = boolean;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for city
 */
export const DEFAULT_CITY: CreateCityPayload = {
  stateId: 0,
  name: '',
  documentRequired: false,
  code: '',
  sequence: null,
  disabled: false,
};

/**
 * Default form data for city
 */
export const DEFAULT_CITY_FORM: CityFormData = {
  stateId: '',
  name: '',
  documentRequired: false,
  code: '',
  sequence: '',
  disabled: false,
};

/**
 * Table columns configuration for city
 */
export const CITY_TABLE_COLUMNS: CityTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'stateId', label: 'State', sortable: true, filterable: true, width: '100px' },
  { key: 'name', label: 'City Name', sortable: true, filterable: true },
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
 * Type guard to check if an object is a City
 */
export function isCity(obj: object): obj is City {
  return (
    obj &&
    typeof (obj as City).id === 'number' &&
    typeof (obj as City).stateId === 'number' &&
    typeof (obj as City).name === 'string' &&
    typeof (obj as City).documentRequired === 'boolean' &&
    typeof (obj as City).code === 'string' &&
    ((obj as City).sequence === null || typeof (obj as City).sequence === 'number') &&
    typeof (obj as City).disabled === 'boolean' &&
    typeof (obj as City).createdAt === 'string' &&
    typeof (obj as City).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateCityPayload
 */
export function isCreateCityPayload(obj: object): obj is CreateCityPayload {
  return (
    obj &&
    typeof (obj as CreateCityPayload).stateId === 'number' &&
    typeof (obj as CreateCityPayload).name === 'string' &&
    typeof (obj as CreateCityPayload).documentRequired === 'boolean' &&
    typeof (obj as CreateCityPayload).code === 'string' &&
    ((obj as CreateCityPayload).sequence === undefined || (obj as CreateCityPayload).sequence === null || typeof (obj as CreateCityPayload).sequence === 'number') &&
    ((obj as CreateCityPayload).disabled === undefined || typeof (obj as CreateCityPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an UpdateCityPayload
 */
export function isUpdateCityPayload(obj: object): obj is UpdateCityPayload {
  return (
    obj &&
    ((obj as UpdateCityPayload).stateId === undefined || typeof (obj as UpdateCityPayload).stateId === 'number') &&
    ((obj as UpdateCityPayload).name === undefined || typeof (obj as UpdateCityPayload).name === 'string') &&
    ((obj as UpdateCityPayload).documentRequired === undefined || typeof (obj as UpdateCityPayload).documentRequired === 'boolean') &&
    ((obj as UpdateCityPayload).code === undefined || typeof (obj as UpdateCityPayload).code === 'string') &&
    ((obj as UpdateCityPayload).sequence === undefined || (obj as UpdateCityPayload).sequence === null || typeof (obj as UpdateCityPayload).sequence === 'number') &&
    ((obj as UpdateCityPayload).disabled === undefined || typeof (obj as UpdateCityPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is a CityWithRelations
 */
export function isCityWithRelations(obj: object): obj is CityWithRelations {
  return isCity(obj) && (
    'state' in obj && ((obj as CityWithRelations).state === undefined || (obj as CityWithRelations).state === null || typeof (obj as CityWithRelations).state === 'object')
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: CityFormData): CreateCityPayload {
  return {
    stateId: parseInt(formData.stateId, 10),
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
export function apiDataToFormData(city: City): CityFormData {
  return {
    stateId: city.stateId.toString(),
    name: city.name,
    documentRequired: city.documentRequired,
    code: city.code,
    sequence: city.sequence?.toString() || '',
    disabled: city.disabled,
  };
}

/**
 * Validate city name
 */
export function validateCityName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 255;
}

/**
 * Validate city code
 */
export function validateCityCode(code: string): boolean {
  return code.trim().length > 0 && code.trim().length <= 10;
}

/**
 * Validate state ID
 */
export function validateStateId(stateId: number): boolean {
  return stateId > 0;
}

/**
 * Format city name for display
 */
export function formatCityName(name: string): string {
  return name.trim();
}

/**
 * Format city code for display
 */
export function formatCityCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Get city document required text
 */
export function getCityDocumentRequiredText(documentRequired: boolean): string {
  return documentRequired ? 'Required' : 'Not Required';
}

/**
 * Get city document required color
 */
export function getCityDocumentRequiredColor(documentRequired: boolean): string {
  return documentRequired ? 'text-red-600' : 'text-green-600';
}

/**
 * Get city status text
 */
export function getCityStatusText(disabled: boolean): string {
  return disabled ? 'Inactive' : 'Active';
}

/**
 * Get city status color
 */
export function getCityStatusColor(disabled: boolean): string {
  return disabled ? 'text-red-600' : 'text-green-600';
}

/**
 * Get state name from city with relations
 */
export function getStateName(city: CityWithRelations): string {
  return city.state?.name || 'N/A';
}

/**
 * Get full location string (State - City)
 */
export function getFullLocation(city: CityWithRelations): string {
  const stateName = city.state?.name || 'Unknown State';
  return `${stateName} - ${city.name}`;
} 