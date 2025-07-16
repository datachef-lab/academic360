/**
 * Blood Group Types
 * 
 * This file contains all TypeScript types and interfaces related to the Blood Group module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main Blood Group interface that mirrors the backend model
 */
export interface BloodGroup {
  id: number;
  type: string;
  sequence?: number | null;
  disabled: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// ============================================================================
// API PAYLOAD TYPES
// ============================================================================

/**
 * Payload for creating a new blood group
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateBloodGroupPayload {
  type: string;
  sequence?: number | null;
  disabled?: boolean;
}

/**
 * Payload for updating an existing blood group
 * All fields are optional for partial updates
 */
export interface UpdateBloodGroupPayload {
  type?: string;
  sequence?: number | null;
  disabled?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for blood group operations
 */
export interface BloodGroupApiResponse {
  statusCode: number;
  status: string;
  data: BloodGroup | BloodGroup[] | null;
  message: string;
}

/**
 * API response for single blood group
 */
export interface SingleBloodGroupResponse {
  statusCode: number;
  status: string;
  data: BloodGroup;
  message: string;
}

/**
 * API response for multiple blood groups
 */
export interface MultipleBloodGroupResponse {
  statusCode: number;
  status: string;
  data: BloodGroup[];
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for blood group forms
 */
export interface BloodGroupFormData {
  type: string;
  sequence: string; // Form input as string, will be converted to number
  disabled: boolean;
}

/**
 * Form validation errors for blood group
 */
export interface BloodGroupFormErrors {
  type?: string;
  sequence?: string;
  disabled?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for blood group management
 */
export interface BloodGroupState {
  bloodGroups: BloodGroup[];
  currentBloodGroup: BloodGroup | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for blood group state management
 */
export type BloodGroupAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_BLOOD_GROUPS'; payload: BloodGroup[] }
  | { type: 'SET_CURRENT_BLOOD_GROUP'; payload: BloodGroup | null }
  | { type: 'ADD_BLOOD_GROUP'; payload: BloodGroup }
  | { type: 'UPDATE_BLOOD_GROUP'; payload: BloodGroup }
  | { type: 'DELETE_BLOOD_GROUP'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for blood group table
 */
export interface BloodGroupTableColumn {
  key: keyof BloodGroup;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for blood group
 */
export interface BloodGroupFilter {
  type?: string;
  disabled?: boolean;
  search?: string;
}

/**
 * Sort options for blood group
 */
export interface BloodGroupSort {
  field: keyof BloodGroup;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for blood group ID
 */
export type BloodGroupId = number;

/**
 * Type for blood group type
 */
export type BloodGroupType = string;

/**
 * Type for blood group sequence
 */
export type BloodGroupSequence = number | null;

/**
 * Type for blood group disabled state
 */
export type BloodGroupDisabled = boolean;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for blood group
 */
export const DEFAULT_BLOOD_GROUP: CreateBloodGroupPayload = {
  type: '',
  sequence: null,
  disabled: false,
};

/**
 * Default form data for blood group
 */
export const DEFAULT_BLOOD_GROUP_FORM: BloodGroupFormData = {
  type: '',
  sequence: '',
  disabled: false,
};

/**
 * Table columns configuration for blood group
 */
export const BLOOD_GROUP_TABLE_COLUMNS: BloodGroupTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'type', label: 'Blood Group Type', sortable: true, filterable: true },
  { key: 'sequence', label: 'Sequence', sortable: true, width: '100px' },
  { key: 'disabled', label: 'Status', sortable: true, width: '100px' },
  { key: 'createdAt', label: 'Created At', sortable: true, width: '150px' },
  { key: 'updatedAt', label: 'Updated At', sortable: true, width: '150px' },
];

/**
 * Common blood group types for reference
 */
export const COMMON_BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
] as const;

/**
 * Type for common blood group values
 */
export type CommonBloodGroup = typeof COMMON_BLOOD_GROUPS[number];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a BloodGroup
 */
export function isBloodGroup(obj: object): obj is BloodGroup {
  return (
    obj &&
    typeof (obj as BloodGroup).id === 'number' &&
    typeof (obj as BloodGroup).type === 'string' &&
    ((obj as BloodGroup).sequence === null || typeof (obj as BloodGroup).sequence === 'number') &&
    typeof (obj as BloodGroup).disabled === 'boolean' &&
    typeof (obj as BloodGroup).createdAt === 'string' &&
    typeof (obj as BloodGroup).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateBloodGroupPayload
 */
export function isCreateBloodGroupPayload(obj: object): obj is CreateBloodGroupPayload {
  return (
    obj &&
    typeof (obj as CreateBloodGroupPayload).type === 'string' &&
    ((obj as CreateBloodGroupPayload).sequence === undefined || (obj as CreateBloodGroupPayload).sequence === null || typeof (obj as CreateBloodGroupPayload).sequence === 'number') &&
    ((obj as CreateBloodGroupPayload).disabled === undefined || typeof (obj as CreateBloodGroupPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an UpdateBloodGroupPayload
 */
export function isUpdateBloodGroupPayload(obj: object): obj is UpdateBloodGroupPayload {
  return (
    obj &&
    ((obj as UpdateBloodGroupPayload).type === undefined || typeof (obj as UpdateBloodGroupPayload).type === 'string') &&
    ((obj as UpdateBloodGroupPayload).sequence === undefined || (obj as UpdateBloodGroupPayload).sequence === null || typeof (obj as UpdateBloodGroupPayload).sequence === 'number') &&
    ((obj as UpdateBloodGroupPayload).disabled === undefined || typeof (obj as UpdateBloodGroupPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if a string is a common blood group
 */
export function isCommonBloodGroup(value: string): value is CommonBloodGroup {
  return COMMON_BLOOD_GROUPS.includes(value as CommonBloodGroup);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: BloodGroupFormData): CreateBloodGroupPayload {
  return {
    type: formData.type.trim(),
    sequence: formData.sequence ? parseInt(formData.sequence, 10) : null,
    disabled: formData.disabled,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(bloodGroup: BloodGroup): BloodGroupFormData {
  return {
    type: bloodGroup.type,
    sequence: bloodGroup.sequence?.toString() || '',
    disabled: bloodGroup.disabled,
  };
}

/**
 * Validate blood group type format
 */
export function validateBloodGroupType(type: string): boolean {
  // Basic validation - can be enhanced based on business rules
  return type.trim().length > 0 && type.trim().length <= 255;
}

/**
 * Format blood group type for display
 */
export function formatBloodGroupType(type: string): string {
  return type.trim().toUpperCase();
}

/**
 * Get blood group status text
 */
export function getBloodGroupStatusText(disabled: boolean): string {
  return disabled ? 'Inactive' : 'Active';
}

/**
 * Get blood group status color
 */
export function getBloodGroupStatusColor(disabled: boolean): string {
  return disabled ? 'text-red-600' : 'text-green-600';
} 