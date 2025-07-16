/**
 * Annual Income Types
 * 
 * This file contains all TypeScript types and interfaces related to the Annual Income module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main Annual Income interface that mirrors the backend model
 */
export interface AnnualIncome {
  id: number;
  range: string;
  sequence?: number | null;
  disabled: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// ============================================================================
// API PAYLOAD TYPES
// ============================================================================

/**
 * Payload for creating a new annual income
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateAnnualIncomePayload {
  range: string;
  sequence?: number | null;
  disabled?: boolean;
}

/**
 * Payload for updating an existing annual income
 * All fields are optional for partial updates
 */
export interface UpdateAnnualIncomePayload {
  range?: string;
  sequence?: number | null;
  disabled?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for annual income operations
 */
export interface AnnualIncomeApiResponse {
  statusCode: number;
  status: string;
  data: AnnualIncome | AnnualIncome[] | null;
  message: string;
}

/**
 * API response for single annual income
 */
export interface SingleAnnualIncomeResponse {
  statusCode: number;
  status: string;
  data: AnnualIncome;
  message: string;
}

/**
 * API response for multiple annual incomes
 */
export interface MultipleAnnualIncomeResponse {
  statusCode: number;
  status: string;
  data: AnnualIncome[];
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for annual income forms
 */
export interface AnnualIncomeFormData {
  range: string;
  sequence: string; // Form input as string, will be converted to number
  disabled: boolean;
}

/**
 * Form validation errors for annual income
 */
export interface AnnualIncomeFormErrors {
  range?: string;
  sequence?: string;
  disabled?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for annual income management
 */
export interface AnnualIncomeState {
  annualIncomes: AnnualIncome[];
  currentAnnualIncome: AnnualIncome | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for annual income state management
 */
export type AnnualIncomeAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_ANNUAL_INCOMES'; payload: AnnualIncome[] }
  | { type: 'SET_CURRENT_ANNUAL_INCOME'; payload: AnnualIncome | null }
  | { type: 'ADD_ANNUAL_INCOME'; payload: AnnualIncome }
  | { type: 'UPDATE_ANNUAL_INCOME'; payload: AnnualIncome }
  | { type: 'DELETE_ANNUAL_INCOME'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for annual income table
 */
export interface AnnualIncomeTableColumn {
  key: keyof AnnualIncome;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for annual income
 */
export interface AnnualIncomeFilter {
  range?: string;
  disabled?: boolean;
  search?: string;
}

/**
 * Sort options for annual income
 */
export interface AnnualIncomeSort {
  field: keyof AnnualIncome;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for annual income ID
 */
export type AnnualIncomeId = number;

/**
 * Type for annual income range
 */
export type AnnualIncomeRange = string;

/**
 * Type for annual income sequence
 */
export type AnnualIncomeSequence = number | null;

/**
 * Type for annual income disabled state
 */
export type AnnualIncomeDisabled = boolean;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for annual income
 */
export const DEFAULT_ANNUAL_INCOME: CreateAnnualIncomePayload = {
  range: '',
  sequence: null,
  disabled: false,
};

/**
 * Default form data for annual income
 */
export const DEFAULT_ANNUAL_INCOME_FORM: AnnualIncomeFormData = {
  range: '',
  sequence: '',
  disabled: false,
};

/**
 * Table columns configuration for annual income
 */
export const ANNUAL_INCOME_TABLE_COLUMNS: AnnualIncomeTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'range', label: 'Income Range', sortable: true, filterable: true },
  { key: 'sequence', label: 'Sequence', sortable: true, width: '100px' },
  { key: 'disabled', label: 'Status', sortable: true, width: '100px' },
  { key: 'createdAt', label: 'Created At', sortable: true, width: '150px' },
  { key: 'updatedAt', label: 'Updated At', sortable: true, width: '150px' },
];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is an AnnualIncome
 */
export function isAnnualIncome(obj: object): obj is AnnualIncome {
  return (
    obj &&
    typeof (obj as AnnualIncome).id === 'number' &&
    typeof (obj as AnnualIncome).range === 'string' &&
    ((obj as AnnualIncome).sequence === null || typeof (obj as AnnualIncome).sequence === 'number') &&
    typeof (obj as AnnualIncome).disabled === 'boolean' &&
    typeof (obj as AnnualIncome).createdAt === 'string' &&
    typeof (obj as AnnualIncome).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateAnnualIncomePayload
 */
export function isCreateAnnualIncomePayload(obj: object): obj is CreateAnnualIncomePayload {
  return (
    obj &&
    typeof (obj as CreateAnnualIncomePayload).range === 'string' &&
    ((obj as CreateAnnualIncomePayload).sequence === undefined || (obj as CreateAnnualIncomePayload).sequence === null || typeof (obj as CreateAnnualIncomePayload).sequence === 'number') &&
    ((obj as CreateAnnualIncomePayload).disabled === undefined || typeof (obj as CreateAnnualIncomePayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an UpdateAnnualIncomePayload
 */
export function isUpdateAnnualIncomePayload(obj: object): obj is UpdateAnnualIncomePayload {
  return (
    obj &&
    ((obj as UpdateAnnualIncomePayload).range === undefined || typeof (obj as UpdateAnnualIncomePayload).range === 'string') &&
    ((obj as UpdateAnnualIncomePayload).sequence === undefined || (obj as UpdateAnnualIncomePayload).sequence === null || typeof (obj as UpdateAnnualIncomePayload).sequence === 'number') &&
    ((obj as UpdateAnnualIncomePayload).disabled === undefined || typeof (obj as UpdateAnnualIncomePayload).disabled === 'boolean')
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: AnnualIncomeFormData): CreateAnnualIncomePayload {
  return {
    range: formData.range.trim(),
    sequence: formData.sequence ? parseInt(formData.sequence, 10) : null,
    disabled: formData.disabled,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(annualIncome: AnnualIncome): AnnualIncomeFormData {
  return {
    range: annualIncome.range,
    sequence: annualIncome.sequence?.toString() || '',
    disabled: annualIncome.disabled,
  };
}

/**
 * Validate annual income range format
 */
export function validateIncomeRange(range: string): boolean {
  // Basic validation - can be enhanced based on business rules
  return range.trim().length > 0 && range.trim().length <= 255;
}

/**
 * Format income range for display
 */
export function formatIncomeRange(range: string): string {
  return range.trim();
} 