/**
 * Religion Types
 * 
 * This file contains all TypeScript types and interfaces related to the Religion module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main Religion interface that mirrors the backend model
 */
export interface Religion {
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
 * Payload for creating a new religion
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateReligionPayload {
  name: string;
  sequence?: number | null;
  disabled?: boolean;
}

/**
 * Payload for updating an existing religion
 * All fields are optional for partial updates
 */
export interface UpdateReligionPayload {
  name?: string;
  sequence?: number | null;
  disabled?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for religion operations
 */
export interface ReligionApiResponse {
  statusCode: number;
  status: string;
  data: Religion | Religion[] | null;
  message: string;
}

/**
 * API response for single religion
 */
export interface SingleReligionResponse {
  statusCode: number;
  status: string;
  data: Religion;
  message: string;
}

/**
 * API response for multiple religions
 */
export interface MultipleReligionResponse {
  statusCode: number;
  status: string;
  data: Religion[];
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for religion forms
 */
export interface ReligionFormData {
  name: string;
  sequence: string; // Form field as string, will be converted to number
  disabled: boolean;
}

/**
 * Form validation errors for religion
 */
export interface ReligionFormErrors {
  name?: string;
  sequence?: string;
  disabled?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for religion management
 */
export interface ReligionState {
  religions: Religion[];
  currentReligion: Religion | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for religion state management
 */
export type ReligionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_RELIGIONS'; payload: Religion[] }
  | { type: 'SET_CURRENT_RELIGION'; payload: Religion | null }
  | { type: 'ADD_RELIGION'; payload: Religion }
  | { type: 'UPDATE_RELIGION'; payload: Religion }
  | { type: 'DELETE_RELIGION'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for religion table
 */
export interface ReligionTableColumn {
  key: keyof Religion;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for religion
 */
export interface ReligionFilter {
  name?: string;
  disabled?: boolean;
  search?: string;
}

/**
 * Sort options for religion
 */
export interface ReligionSort {
  field: keyof Religion;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for religion ID
 */
export type ReligionId = number;

/**
 * Type for religion name
 */
export type ReligionName = string;

/**
 * Type for religion sequence
 */
export type ReligionSequence = number | null;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for religion
 */
export const DEFAULT_RELIGION: CreateReligionPayload = {
  name: '',
  sequence: null,
  disabled: false,
};

/**
 * Default form data for religion
 */
export const DEFAULT_RELIGION_FORM: ReligionFormData = {
  name: '',
  sequence: '',
  disabled: false,
};

/**
 * Table columns configuration for religion
 */
export const RELIGION_TABLE_COLUMNS: ReligionTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Religion Name', sortable: true, filterable: true },
  { key: 'sequence', label: 'Sequence', sortable: true, width: '100px' },
  { key: 'disabled', label: 'Status', sortable: true, width: '100px' },
  { key: 'createdAt', label: 'Created At', sortable: true, width: '150px' },
  { key: 'updatedAt', label: 'Updated At', sortable: true, width: '150px' },
];

/**
 * Common religions for reference
 */
export const COMMON_RELIGIONS = [
  'Hinduism', 'Islam', 'Christianity', 'Sikhism', 'Buddhism', 'Jainism',
  'Judaism', 'Zoroastrianism', 'Bahá\'í Faith', 'Atheism', 'Agnosticism',
  'Other', 'Not Specified'
] as const;

/**
 * Type for common religion values
 */
export type CommonReligion = typeof COMMON_RELIGIONS[number];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a Religion
 */
export function isReligion(obj: object): obj is Religion {
  return (
    obj &&
    typeof (obj as Religion).id === 'number' &&
    typeof (obj as Religion).name === 'string' &&
    ((obj as Religion).sequence === null || (obj as Religion).sequence === undefined || typeof (obj as Religion).sequence === 'number') &&
    typeof (obj as Religion).disabled === 'boolean' &&
    typeof (obj as Religion).createdAt === 'string' &&
    typeof (obj as Religion).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateReligionPayload
 */
export function isCreateReligionPayload(obj: object): obj is CreateReligionPayload {
  return (
    obj &&
    typeof (obj as CreateReligionPayload).name === 'string' &&
    ((obj as CreateReligionPayload).sequence === undefined || (obj as CreateReligionPayload).sequence === null || typeof (obj as CreateReligionPayload).sequence === 'number') &&
    ((obj as CreateReligionPayload).disabled === undefined || typeof (obj as CreateReligionPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an UpdateReligionPayload
 */
export function isUpdateReligionPayload(obj: object): obj is UpdateReligionPayload {
  return (
    obj &&
    ((obj as UpdateReligionPayload).name === undefined || typeof (obj as UpdateReligionPayload).name === 'string') &&
    ((obj as UpdateReligionPayload).sequence === undefined || (obj as UpdateReligionPayload).sequence === null || typeof (obj as UpdateReligionPayload).sequence === 'number') &&
    ((obj as UpdateReligionPayload).disabled === undefined || typeof (obj as UpdateReligionPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if a string is a common religion
 */
export function isCommonReligion(value: string): value is CommonReligion {
  return COMMON_RELIGIONS.includes(value as CommonReligion);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: ReligionFormData): CreateReligionPayload {
  return {
    name: formData.name.trim(),
    sequence: formData.sequence ? parseInt(formData.sequence, 10) : null,
    disabled: formData.disabled,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(religion: Religion): ReligionFormData {
  return {
    name: religion.name,
    sequence: religion.sequence?.toString() || '',
    disabled: religion.disabled,
  };
}

/**
 * Validate religion name
 */
export function validateReligionName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 255;
}

/**
 * Validate religion sequence
 */
export function validateReligionSequence(sequence: string): boolean {
  if (!sequence) return true; // Optional field
  const num = parseInt(sequence, 10);
  return !isNaN(num) && num >= 0;
}

/**
 * Format religion name for display
 */
export function formatReligionName(name: string): string {
  return name.trim();
}

/**
 * Get religion display name
 */
export function getReligionDisplayName(religion: Religion): string {
  return formatReligionName(religion.name);
}

/**
 * Get religion status text
 */
export function getReligionStatusText(disabled: boolean): string {
  return disabled ? 'Disabled' : 'Active';
}

/**
 * Get religion status color
 */
export function getReligionStatusColor(disabled: boolean): string {
  return disabled ? 'text-red-600' : 'text-green-600';
}

/**
 * Get religion status badge variant
 */
export function getReligionStatusBadge(disabled: boolean): 'destructive' | 'default' {
  return disabled ? 'destructive' : 'default';
}

/**
 * Sort religions by sequence
 */
export function sortReligionsBySequence(religions: Religion[]): Religion[] {
  return [...religions].sort((a, b) => {
    if ((a.sequence === null || a.sequence === undefined) && (b.sequence === null || b.sequence === undefined)) return 0;
    if (a.sequence === null || a.sequence === undefined) return 1;
    if (b.sequence === null || b.sequence === undefined) return -1;
    return (a.sequence ?? 0) - (b.sequence ?? 0);
  });
}

/**
 * Filter active religions
 */
export function filterActiveReligions(religions: Religion[]): Religion[] {
  return religions.filter(r => !r.disabled);
}

/**
 * Get religion icon (basic implementation)
 */
export function getReligionIcon(religionName: string): string {
  const iconMap: Record<string, string> = {
    'Hinduism': '🕉️',
    'Islam': '☪️',
    'Christianity': '✝️',
    'Sikhism': '☬',
    'Buddhism': '☸️',
    'Jainism': '🕉️',
    'Judaism': '✡️',
    'Zoroastrianism': '🔥',
    'Bahá\'í Faith': '⭐',
    'Atheism': '🚫',
    'Agnosticism': '❓',
    'Other': '🔄',
    'Not Specified': '❓',
  };
  
  return iconMap[religionName] || '🕉️';
}

/**
 * Get religion display with icon
 */
export function getReligionDisplayWithIcon(religion: Religion): string {
  const icon = getReligionIcon(religion.name);
  const name = getReligionDisplayName(religion);
  return `${icon} ${name}`;
}

/**
 * Get religion category (basic categorization)
 */
export function getReligionCategory(religionName: string): string {
  const categoryMap: Record<string, string> = {
    'Hinduism': 'Dharma',
    'Buddhism': 'Dharma',
    'Jainism': 'Dharma',
    'Sikhism': 'Dharma',
    'Islam': 'Abrahamic',
    'Christianity': 'Abrahamic',
    'Judaism': 'Abrahamic',
    'Zoroastrianism': 'Iranian',
    'Bahá\'í Faith': 'Abrahamic',
    'Atheism': 'Non-religious',
    'Agnosticism': 'Non-religious',
    'Other': 'Other',
    'Not Specified': 'Other',
  };
  
  return categoryMap[religionName] || 'Other';
}

/**
 * Get religion category color
 */
export function getReligionCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'Dharma': 'text-orange-600',
    'Abrahamic': 'text-blue-600',
    'Iranian': 'text-purple-600',
    'Non-religious': 'text-gray-600',
    'Other': 'text-gray-500',
  };
  
  return colorMap[category] || 'text-gray-500';
} 