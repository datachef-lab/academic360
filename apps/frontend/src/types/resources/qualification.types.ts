/**
 * Qualification Types
 * 
 * This file contains all TypeScript types and interfaces related to the Qualification module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main Qualification interface that mirrors the backend model
 */
export interface Qualification {
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
 * Payload for creating a new qualification
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateQualificationPayload {
  name: string;
  sequence?: number | null;
  disabled?: boolean;
}

/**
 * Payload for updating an existing qualification
 * All fields are optional for partial updates
 */
export interface UpdateQualificationPayload {
  name?: string;
  sequence?: number | null;
  disabled?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for qualification operations
 */
export interface QualificationApiResponse {
  statusCode: number;
  status: string;
  data: Qualification | Qualification[] | null;
  message: string;
}

/**
 * API response for single qualification
 */
export interface SingleQualificationResponse {
  statusCode: number;
  status: string;
  data: Qualification;
  message: string;
}

/**
 * API response for multiple qualifications
 */
export interface MultipleQualificationResponse {
  statusCode: number;
  status: string;
  data: Qualification[];
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for qualification forms
 */
export interface QualificationFormData {
  name: string;
  sequence: string; // Form field as string, will be converted to number
  disabled: boolean;
}

/**
 * Form validation errors for qualification
 */
export interface QualificationFormErrors {
  name?: string;
  sequence?: string;
  disabled?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for qualification management
 */
export interface QualificationState {
  qualifications: Qualification[];
  currentQualification: Qualification | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for qualification state management
 */
export type QualificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_QUALIFICATIONS'; payload: Qualification[] }
  | { type: 'SET_CURRENT_QUALIFICATION'; payload: Qualification | null }
  | { type: 'ADD_QUALIFICATION'; payload: Qualification }
  | { type: 'UPDATE_QUALIFICATION'; payload: Qualification }
  | { type: 'DELETE_QUALIFICATION'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for qualification table
 */
export interface QualificationTableColumn {
  key: keyof Qualification;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for qualification
 */
export interface QualificationFilter {
  name?: string;
  disabled?: boolean;
  search?: string;
}

/**
 * Sort options for qualification
 */
export interface QualificationSort {
  field: keyof Qualification;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for qualification ID
 */
export type QualificationId = number;

/**
 * Type for qualification name
 */
export type QualificationName = string;

/**
 * Type for qualification sequence
 */
export type QualificationSequence = number | null;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for qualification
 */
export const DEFAULT_QUALIFICATION: CreateQualificationPayload = {
  name: '',
  sequence: null,
  disabled: false,
};

/**
 * Default form data for qualification
 */
export const DEFAULT_QUALIFICATION_FORM: QualificationFormData = {
  name: '',
  sequence: '',
  disabled: false,
};

/**
 * Table columns configuration for qualification
 */
export const QUALIFICATION_TABLE_COLUMNS: QualificationTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Qualification Name', sortable: true, filterable: true },
  { key: 'sequence', label: 'Sequence', sortable: true, width: '100px' },
  { key: 'disabled', label: 'Status', sortable: true, width: '100px' },
  { key: 'createdAt', label: 'Created At', sortable: true, width: '150px' },
  { key: 'updatedAt', label: 'Updated At', sortable: true, width: '150px' },
];

/**
 * Common qualifications for reference
 */
export const COMMON_QUALIFICATIONS = [
  'High School', 'Associate Degree', 'Bachelor\'s Degree', 'Master\'s Degree',
  'Doctorate', 'Diploma', 'Certificate', 'Professional Certification',
  'Trade School', 'Vocational Training', 'Apprenticeship', 'GED'
] as const;

/**
 * Type for common qualification values
 */
export type CommonQualification = typeof COMMON_QUALIFICATIONS[number];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a Qualification
 */
export function isQualification(obj: object): obj is Qualification {
  return (
    obj &&
    typeof (obj as Qualification).id === 'number' &&
    typeof (obj as Qualification).name === 'string' &&
    ((obj as Qualification).sequence === null || typeof (obj as Qualification).sequence === 'number') &&
    typeof (obj as Qualification).disabled === 'boolean' &&
    typeof (obj as Qualification).createdAt === 'string' &&
    typeof (obj as Qualification).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateQualificationPayload
 */
export function isCreateQualificationPayload(obj: object): obj is CreateQualificationPayload {
  return (
    obj &&
    typeof (obj as CreateQualificationPayload).name === 'string' &&
    ((obj as CreateQualificationPayload).sequence === undefined || (obj as CreateQualificationPayload).sequence === null || typeof (obj as CreateQualificationPayload).sequence === 'number') &&
    ((obj as CreateQualificationPayload).disabled === undefined || typeof (obj as CreateQualificationPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an UpdateQualificationPayload
 */
export function isUpdateQualificationPayload(obj: object): obj is UpdateQualificationPayload {
  return (
    obj &&
    ((obj as UpdateQualificationPayload).name === undefined || typeof (obj as UpdateQualificationPayload).name === 'string') &&
    ((obj as UpdateQualificationPayload).sequence === undefined || (obj as UpdateQualificationPayload).sequence === null || typeof (obj as UpdateQualificationPayload).sequence === 'number') &&
    ((obj as UpdateQualificationPayload).disabled === undefined || typeof (obj as UpdateQualificationPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if a string is a common qualification
 */
export function isCommonQualification(value: string): value is CommonQualification {
  return COMMON_QUALIFICATIONS.includes(value as CommonQualification);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: QualificationFormData): CreateQualificationPayload {
  return {
    name: formData.name.trim(),
    sequence: formData.sequence ? parseInt(formData.sequence, 10) : null,
    disabled: formData.disabled,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(qualification: Qualification): QualificationFormData {
  return {
    name: qualification.name,
    sequence: qualification.sequence?.toString() || '',
    disabled: qualification.disabled,
  };
}

/**
 * Validate qualification name
 */
export function validateQualificationName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 255;
}

/**
 * Validate qualification sequence
 */
export function validateQualificationSequence(sequence: string): boolean {
  if (!sequence) return true; // Optional field
  const num = parseInt(sequence, 10);
  return !isNaN(num) && num >= 0;
}

/**
 * Format qualification name for display
 */
export function formatQualificationName(name: string): string {
  return name.trim();
}

/**
 * Get qualification display name
 */
export function getQualificationDisplayName(qualification: Qualification): string {
  return formatQualificationName(qualification.name);
}

/**
 * Get qualification status text
 */
export function getQualificationStatusText(disabled: boolean): string {
  return disabled ? 'Disabled' : 'Active';
}

/**
 * Get qualification status color
 */
export function getQualificationStatusColor(disabled: boolean): string {
  return disabled ? 'text-red-600' : 'text-green-600';
}

/**
 * Get qualification status badge variant
 */
export function getQualificationStatusBadge(disabled: boolean): 'destructive' | 'default' {
  return disabled ? 'destructive' : 'default';
}

/**
 * Sort qualifications by sequence
 */
export function sortQualificationsBySequence(qualifications: Qualification[]): Qualification[] {
  return [...qualifications].sort((a, b) => {
    if ((a.sequence === null || a.sequence === undefined) && (b.sequence === null || b.sequence === undefined)) return 0;
    if (a.sequence === null || a.sequence === undefined) return 1;
    if (b.sequence === null || b.sequence === undefined) return -1;
    return (a.sequence ?? 0) - (b.sequence ?? 0);
  });
}

/**
 * Filter active qualifications
 */
export function filterActiveQualifications(qualifications: Qualification[]): Qualification[] {
  return qualifications.filter(q => !q.disabled);
}

/**
 * Get qualification level (basic categorization based on name)
 */
export function getQualificationLevel(qualificationName: string): string {
  const name = qualificationName.toLowerCase();
  
  if (name.includes('doctorate') || name.includes('phd')) return 'Doctorate';
  if (name.includes('master')) return 'Master\'s';
  if (name.includes('bachelor') || name.includes('bachelor\'s')) return 'Bachelor\'s';
  if (name.includes('associate')) return 'Associate';
  if (name.includes('diploma')) return 'Diploma';
  if (name.includes('certificate') || name.includes('certification')) return 'Certificate';
  if (name.includes('high school') || name.includes('secondary')) return 'Secondary';
  
  return 'Other';
}

/**
 * Get qualification level color
 */
export function getQualificationLevelColor(level: string): string {
  const colorMap: Record<string, string> = {
    'Doctorate': 'text-purple-600',
    'Master\'s': 'text-blue-600',
    'Bachelor\'s': 'text-green-600',
    'Associate': 'text-orange-600',
    'Diploma': 'text-yellow-600',
    'Certificate': 'text-indigo-600',
    'Secondary': 'text-gray-600',
    'Other': 'text-gray-500',
  };
  
  return colorMap[level] || 'text-gray-500';
} 