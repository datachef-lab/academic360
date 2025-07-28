/**
 * Institution Types
 * 
 * This file contains all TypeScript types and interfaces related to the Institution module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main Institution interface that mirrors the backend model
 */
export interface Institution {
  id: number;
  name: string;
  degreeId: number;
  addressId?: number | null;
  sequence?: number | null;
  disabled: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Institution with relations (includes related degree and address data)
 */
export interface InstitutionWithRelations extends Institution {
  degree?: {
    id: number;
    name: string;
    level: string;
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
 * Payload for creating a new institution
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateInstitutionPayload {
  name: string;
  degreeId: number;
  addressId?: number | null;
  sequence?: number | null;
  disabled?: boolean;
}

/**
 * Payload for updating an existing institution
 * All fields are optional for partial updates
 */
export interface UpdateInstitutionPayload {
  name?: string;
  degreeId?: number;
  addressId?: number | null;
  sequence?: number | null;
  disabled?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for institution operations
 */
export interface InstitutionApiResponse {
  statusCode: number;
  status: string;
  data: Institution | Institution[] | InstitutionWithRelations | InstitutionWithRelations[] | null;
  message: string;
}

/**
 * API response for single institution
 */
export interface SingleInstitutionResponse {
  statusCode: number;
  status: string;
  data: Institution | InstitutionWithRelations;
  message: string;
}

/**
 * API response for multiple institutions
 */
export interface MultipleInstitutionResponse {
  statusCode: number;
  status: string;
  data: Institution[] | InstitutionWithRelations[];
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for institution forms
 */
export interface InstitutionFormData {
  name: string;
  degreeId: string; // Form input as string, will be converted to number
  addressId: string; // Form input as string, will be converted to number
  sequence: string; // Form input as string, will be converted to number
  disabled: boolean;
}

/**
 * Form validation errors for institution
 */
export interface InstitutionFormErrors {
  name?: string;
  degreeId?: string;
  addressId?: string;
  sequence?: string;
  disabled?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for institution management
 */
export interface InstitutionState {
  institutions: Institution[];
  currentInstitution: Institution | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for institution state management
 */
export type InstitutionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_INSTITUTIONS'; payload: Institution[] }
  | { type: 'SET_CURRENT_INSTITUTION'; payload: Institution | null }
  | { type: 'ADD_INSTITUTION'; payload: Institution }
  | { type: 'UPDATE_INSTITUTION'; payload: Institution }
  | { type: 'DELETE_INSTITUTION'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for institution table
 */
export interface InstitutionTableColumn {
  key: keyof Institution;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for institution
 */
export interface InstitutionFilter {
  name?: string;
  degreeId?: number;
  addressId?: number;
  disabled?: boolean;
  search?: string;
}

/**
 * Sort options for institution
 */
export interface InstitutionSort {
  field: keyof Institution;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for institution ID
 */
export type InstitutionId = number;

/**
 * Type for institution name
 */
export type InstitutionName = string;

/**
 * Type for institution degree ID
 */
export type InstitutionDegreeId = number;

/**
 * Type for institution address ID
 */
export type InstitutionAddressId = number | null;

/**
 * Type for institution sequence
 */
export type InstitutionSequence = number | null;

/**
 * Type for institution disabled state
 */
export type InstitutionDisabled = boolean;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for institution
 */
export const DEFAULT_INSTITUTION: CreateInstitutionPayload = {
  name: '',
  degreeId: 0,
  addressId: null,
  sequence: null,
  disabled: false,
};

/**
 * Default form data for institution
 */
export const DEFAULT_INSTITUTION_FORM: InstitutionFormData = {
  name: '',
  degreeId: '',
  addressId: '',
  sequence: '',
  disabled: false,
};

/**
 * Table columns configuration for institution
 */
export const INSTITUTION_TABLE_COLUMNS: InstitutionTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Institution Name', sortable: true, filterable: true },
  { key: 'degreeId', label: 'Degree', sortable: true, filterable: true, width: '100px' },
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
 * Type guard to check if an object is an Institution
 */
export function isInstitution(obj: object): obj is Institution {
  return (
    obj &&
    typeof (obj as Institution).id === 'number' &&
    typeof (obj as Institution).name === 'string' &&
    typeof (obj as Institution).degreeId === 'number' &&
    ((obj as Institution).addressId === null || typeof (obj as Institution).addressId === 'number') &&
    ((obj as Institution).sequence === null || typeof (obj as Institution).sequence === 'number') &&
    typeof (obj as Institution).disabled === 'boolean' &&
    typeof (obj as Institution).createdAt === 'string' &&
    typeof (obj as Institution).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateInstitutionPayload
 */
export function isCreateInstitutionPayload(obj: object): obj is CreateInstitutionPayload {
  return (
    obj &&
    typeof (obj as CreateInstitutionPayload).name === 'string' &&
    typeof (obj as CreateInstitutionPayload).degreeId === 'number' &&
    ((obj as CreateInstitutionPayload).addressId === undefined || (obj as CreateInstitutionPayload).addressId === null || typeof (obj as CreateInstitutionPayload).addressId === 'number') &&
    ((obj as CreateInstitutionPayload).sequence === undefined || (obj as CreateInstitutionPayload).sequence === null || typeof (obj as CreateInstitutionPayload).sequence === 'number') &&
    ((obj as CreateInstitutionPayload).disabled === undefined || typeof (obj as CreateInstitutionPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an UpdateInstitutionPayload
 */
export function isUpdateInstitutionPayload(obj: object): obj is UpdateInstitutionPayload {
  return (
    obj &&
    ((obj as UpdateInstitutionPayload).name === undefined || typeof (obj as UpdateInstitutionPayload).name === 'string') &&
    ((obj as UpdateInstitutionPayload).degreeId === undefined || typeof (obj as UpdateInstitutionPayload).degreeId === 'number') &&
    ((obj as UpdateInstitutionPayload).addressId === undefined || (obj as UpdateInstitutionPayload).addressId === null || typeof (obj as UpdateInstitutionPayload).addressId === 'number') &&
    ((obj as UpdateInstitutionPayload).sequence === undefined || (obj as UpdateInstitutionPayload).sequence === null || typeof (obj as UpdateInstitutionPayload).sequence === 'number') &&
    ((obj as UpdateInstitutionPayload).disabled === undefined || typeof (obj as UpdateInstitutionPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an InstitutionWithRelations
 */
export function isInstitutionWithRelations(obj: object): obj is InstitutionWithRelations {
  return isInstitution(obj) && (
    'degree' in obj && ((obj as InstitutionWithRelations).degree === undefined || (obj as InstitutionWithRelations).degree === null || typeof (obj as InstitutionWithRelations).degree === 'object')
  ) && (
    'address' in obj && ((obj as InstitutionWithRelations).address === undefined || (obj as InstitutionWithRelations).address === null || typeof (obj as InstitutionWithRelations).address === 'object')
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: InstitutionFormData): CreateInstitutionPayload {
  return {
    name: formData.name.trim(),
    degreeId: parseInt(formData.degreeId, 10),
    addressId: formData.addressId ? parseInt(formData.addressId, 10) : null,
    sequence: formData.sequence ? parseInt(formData.sequence, 10) : null,
    disabled: formData.disabled,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(institution: Institution): InstitutionFormData {
  return {
    name: institution.name,
    degreeId: institution.degreeId.toString(),
    addressId: institution.addressId?.toString() || '',
    sequence: institution.sequence?.toString() || '',
    disabled: institution.disabled,
  };
}

/**
 * Validate institution name
 */
export function validateInstitutionName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 700;
}

/**
 * Validate degree ID
 */
export function validateDegreeId(degreeId: number): boolean {
  return degreeId > 0;
}

/**
 * Format institution name for display
 */
export function formatInstitutionName(name: string): string {
  return name.trim();
}

/**
 * Get institution status text
 */
export function getInstitutionStatusText(disabled: boolean): string {
  return disabled ? 'Inactive' : 'Active';
}

/**
 * Get institution status color
 */
export function getInstitutionStatusColor(disabled: boolean): string {
  return disabled ? 'text-red-600' : 'text-green-600';
}

/**
 * Get degree name from institution with relations
 */
export function getDegreeName(institution: InstitutionWithRelations): string {
  return institution.degree?.name || 'N/A';
}

/**
 * Get degree level from institution with relations
 */
export function getDegreeLevel(institution: InstitutionWithRelations): string {
  return institution.degree?.level || 'N/A';
}

/**
 * Get address info from institution with relations
 */
export function getAddressInfo(institution: InstitutionWithRelations): string {
  return institution.address ? 'Address Available' : 'No Address';
}

/**
 * Get full institution info (Name - Degree)
 */
export function getFullInstitutionInfo(institution: InstitutionWithRelations): string {
  const degreeName = institution.degree?.name || 'Unknown Degree';
  return `${institution.name} - ${degreeName}`;
} 