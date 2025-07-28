/**
 * State Types
 * 
 * This file contains all TypeScript types and interfaces related to the State module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main State interface that mirrors the backend model
 */
export interface State {
  id: number;
  countryId: number;
  name: string;
  sequence?: number | null;
  disabled: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  country?: Country; // Optional relation
}

/**
 * Country interface for the relation
 */
export interface Country {
  id: number;
  name: string;
  code?: string | null;
  // Add other country fields as needed
}

// ============================================================================
// API PAYLOAD TYPES
// ============================================================================

/**
 * Payload for creating a new state
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateStatePayload {
  countryId: number;
  name: string;
  sequence?: number | null;
  disabled?: boolean;
}

/**
 * Payload for updating an existing state
 * All fields are optional for partial updates
 */
export interface UpdateStatePayload {
  countryId?: number;
  name?: string;
  sequence?: number | null;
  disabled?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for state operations
 */
export interface StateApiResponse {
  statusCode: number;
  status: string;
  data: State | State[] | null;
  message: string;
}

/**
 * API response for single state
 */
export interface SingleStateResponse {
  statusCode: number;
  status: string;
  data: State;
  message: string;
}

/**
 * API response for multiple states
 */
export interface MultipleStateResponse {
  httpStatusCode: number;
  payload: State[];
  httpStatus: string;
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for state forms
 */
export interface StateFormData {
  countryId: string; // Form field as string, will be converted to number
  name: string;
  sequence: string; // Form field as string, will be converted to number
  disabled: boolean;
}

/**
 * Form validation errors for state
 */
export interface StateFormErrors {
  countryId?: string;
  name?: string;
  sequence?: string;
  disabled?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for state management
 */
export interface StateState {
  states: State[];
  currentState: State | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for state state management
 */
export type StateAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_STATES'; payload: State[] }
  | { type: 'SET_CURRENT_STATE'; payload: State | null }
  | { type: 'ADD_STATE'; payload: State }
  | { type: 'UPDATE_STATE'; payload: State }
  | { type: 'DELETE_STATE'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for state table
 */
export interface StateTableColumn {
  key: keyof State;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for state
 */
export interface StateFilter {
  countryId?: number;
  name?: string;
  disabled?: boolean;
  search?: string;
}

/**
 * Sort options for state
 */
export interface StateSort {
  field: keyof State;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for state ID
 */
export type StateId = number;

/**
 * Type for state name
 */
export type StateName = string;

/**
 * Type for state sequence
 */
export type StateSequence = number | null;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for state
 */
export const DEFAULT_STATE: CreateStatePayload = {
  countryId: 0,
  name: '',
  sequence: null,
  disabled: false,
};

/**
 * Default form data for state
 */
export const DEFAULT_STATE_FORM: StateFormData = {
  countryId: '',
  name: '',
  sequence: '',
  disabled: false,
};

/**
 * Table columns configuration for state
 */
export const STATE_TABLE_COLUMNS: StateTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'countryId', label: 'Country ID', sortable: true, width: '100px' },
  { key: 'name', label: 'State Name', sortable: true, filterable: true },
  { key: 'sequence', label: 'Sequence', sortable: true, width: '100px' },
  { key: 'disabled', label: 'Status', sortable: true, width: '100px' },
  { key: 'createdAt', label: 'Created At', sortable: true, width: '150px' },
  { key: 'updatedAt', label: 'Updated At', sortable: true, width: '150px' },
];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a State
 */
export function isState(obj: object): obj is State {
  return (
    obj &&
    typeof (obj as State).id === 'number' &&
    typeof (obj as State).countryId === 'number' &&
    typeof (obj as State).name === 'string' &&
    ((obj as State).sequence === null || (obj as State).sequence === undefined || typeof (obj as State).sequence === 'number') &&
    typeof (obj as State).disabled === 'boolean' &&
    typeof (obj as State).createdAt === 'string' &&
    typeof (obj as State).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateStatePayload
 */
export function isCreateStatePayload(obj: object): obj is CreateStatePayload {
  return (
    obj &&
    typeof (obj as CreateStatePayload).countryId === 'number' &&
    typeof (obj as CreateStatePayload).name === 'string' &&
    ((obj as CreateStatePayload).sequence === undefined || (obj as CreateStatePayload).sequence === null || typeof (obj as CreateStatePayload).sequence === 'number') &&
    ((obj as CreateStatePayload).disabled === undefined || typeof (obj as CreateStatePayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an UpdateStatePayload
 */
export function isUpdateStatePayload(obj: object): obj is UpdateStatePayload {
  return (
    obj &&
    ((obj as UpdateStatePayload).countryId === undefined || typeof (obj as UpdateStatePayload).countryId === 'number') &&
    ((obj as UpdateStatePayload).name === undefined || typeof (obj as UpdateStatePayload).name === 'string') &&
    ((obj as UpdateStatePayload).sequence === undefined || (obj as UpdateStatePayload).sequence === null || typeof (obj as UpdateStatePayload).sequence === 'number') &&
    ((obj as UpdateStatePayload).disabled === undefined || typeof (obj as UpdateStatePayload).disabled === 'boolean')
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: StateFormData): CreateStatePayload {
  return {
    countryId: parseInt(formData.countryId, 10),
    name: formData.name.trim(),
    sequence: formData.sequence ? parseInt(formData.sequence, 10) : null,
    disabled: formData.disabled,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(state: State): StateFormData {
  return {
    countryId: state.countryId.toString(),
    name: state.name,
    sequence: state.sequence?.toString() || '',
    disabled: state.disabled,
  };
}

/**
 * Validate state name
 */
export function validateStateName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 255;
}

/**
 * Validate state sequence
 */
export function validateStateSequence(sequence: string): boolean {
  if (!sequence) return true; // Optional field
  const num = parseInt(sequence, 10);
  return !isNaN(num) && num >= 0;
}

/**
 * Validate country ID
 */
export function validateCountryId(countryId: string): boolean {
  const num = parseInt(countryId, 10);
  return !isNaN(num) && num > 0;
}

/**
 * Format state name for display
 */
export function formatStateName(name: string): string {
  return name.trim();
}

/**
 * Get state display name
 */
export function getStateDisplayName(state: State): string {
  return formatStateName(state.name);
}

/**
 * Get state status text
 */
export function getStateStatusText(disabled: boolean): string {
  return disabled ? 'Disabled' : 'Active';
}

/**
 * Get state status color
 */
export function getStateStatusColor(disabled: boolean): string {
  return disabled ? 'text-red-600' : 'text-green-600';
}

/**
 * Get state status badge variant
 */
export function getStateStatusBadge(disabled: boolean): 'destructive' | 'default' {
  return disabled ? 'destructive' : 'default';
}

/**
 * Sort states by sequence
 */
export function sortStatesBySequence(states: State[]): State[] {
  return [...states].sort((a, b) => {
    if ((a.sequence === null || a.sequence === undefined) && (b.sequence === null || b.sequence === undefined)) return 0;
    if (a.sequence === null || a.sequence === undefined) return 1;
    if (b.sequence === null || b.sequence === undefined) return -1;
    return (a.sequence ?? 0) - (b.sequence ?? 0);
  });
}

/**
 * Filter active states
 */
export function filterActiveStates(states: State[]): State[] {
  return states.filter(s => !s.disabled);
}

/**
 * Filter states by country
 */
export function filterStatesByCountry(states: State[], countryId: number): State[] {
  return states.filter(s => s.countryId === countryId);
}

/**
 * Get state with country name
 */
export function getStateWithCountryName(state: State): string {
  const countryName = state.country?.name || `Country ${state.countryId}`;
  return `${state.name}, ${countryName}`;
} 