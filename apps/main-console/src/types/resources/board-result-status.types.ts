/**
 * Board Result Status Types
 * 
 * This file contains all TypeScript types and interfaces related to the Board Result Status module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Board result type enum that mirrors the backend enum
 */
export enum BoardResultType {
  FAIL = "FAIL",
  PASS = "PASS"
}

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main Board Result Status interface that mirrors the backend model
 */
export interface BoardResultStatus {
    readonly id?: number;
  name: string;
  spclType: string;
  result: BoardResultType;
  sequence?: number | null;
  disabled: boolean;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// ============================================================================
// API PAYLOAD TYPES
// ============================================================================

/**
 * Payload for creating a new board result status
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateBoardResultStatusPayload {
  name: string;
  spclType: string;
  result: BoardResultType;
  sequence?: number | null;
  disabled?: boolean;
}

/**
 * Payload for updating an existing board result status
 * All fields are optional for partial updates
 */
export interface UpdateBoardResultStatusPayload {
  name?: string;
  spclType?: string;
  result?: BoardResultType;
  sequence?: number | null;
  disabled?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for board result status operations
 */
export interface BoardResultStatusApiResponse {
  statusCode: number;
  status: string;
  data: BoardResultStatus | BoardResultStatus[] | null;
  message: string;
}

/**
 * API response for single board result status
 */
export interface SingleBoardResultStatusResponse {
  statusCode: number;
  status: string;
  data: BoardResultStatus;
  message: string;
}

/**
 * API response for multiple board result statuses
 */
export interface MultipleBoardResultStatusResponse {
  statusCode: number;
  status: string;
  data: BoardResultStatus[];
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for board result status forms
 */
export interface BoardResultStatusFormData {
  name: string;
  spclType: string;
  result: BoardResultType;
  sequence: string; // Form input as string, will be converted to number
  disabled: boolean;
}

/**
 * Form validation errors for board result status
 */
export interface BoardResultStatusFormErrors {
  name?: string;
  spclType?: string;
  result?: string;
  sequence?: string;
  disabled?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for board result status management
 */
export interface BoardResultStatusState {
  boardResultStatuses: BoardResultStatus[];
  currentBoardResultStatus: BoardResultStatus | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for board result status state management
 */
export type BoardResultStatusAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_BOARD_RESULT_STATUSES'; payload: BoardResultStatus[] }
  | { type: 'SET_CURRENT_BOARD_RESULT_STATUS'; payload: BoardResultStatus | null }
  | { type: 'ADD_BOARD_RESULT_STATUS'; payload: BoardResultStatus }
  | { type: 'UPDATE_BOARD_RESULT_STATUS'; payload: BoardResultStatus }
  | { type: 'DELETE_BOARD_RESULT_STATUS'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for board result status table
 */
export interface BoardResultStatusTableColumn {
  key: keyof BoardResultStatus;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for board result status
 */
export interface BoardResultStatusFilter {
  name?: string;
  spclType?: string;
  result?: BoardResultType;
  disabled?: boolean;
  search?: string;
}

/**
 * Sort options for board result status
 */
export interface BoardResultStatusSort {
  field: keyof BoardResultStatus;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for board result status ID
 */
export type BoardResultStatusId = number;

/**
 * Type for board result status name
 */
export type BoardResultStatusName = string;

/**
 * Type for board result status special type
 */
export type BoardResultStatusSpclType = string;

/**
 * Type for board result status sequence
 */
export type BoardResultStatusSequence = number | null;

/**
 * Type for board result status disabled state
 */
export type BoardResultStatusDisabled = boolean;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for board result status
 */
export const DEFAULT_BOARD_RESULT_STATUS: CreateBoardResultStatusPayload = {
  name: '',
  spclType: '',
  result: BoardResultType.PASS,
  sequence: null,
  disabled: false,
};

/**
 * Default form data for board result status
 */
export const DEFAULT_BOARD_RESULT_STATUS_FORM: BoardResultStatusFormData = {
  name: '',
  spclType: '',
  result: BoardResultType.PASS,
  sequence: '',
  disabled: false,
};

/**
 * Table columns configuration for board result status
 */
export const BOARD_RESULT_STATUS_TABLE_COLUMNS: BoardResultStatusTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'spclType', label: 'Special Type', sortable: true, filterable: true },
  { key: 'result', label: 'Result', sortable: true, filterable: true, width: '100px' },
  { key: 'sequence', label: 'Sequence', sortable: true, width: '100px' },
  { key: 'disabled', label: 'Status', sortable: true, width: '100px' },
  { key: 'createdAt', label: 'Created At', sortable: true, width: '150px' },
  { key: 'updatedAt', label: 'Updated At', sortable: true, width: '150px' },
];

/**
 * Board result type options for forms
 */
export const BOARD_RESULT_TYPE_OPTIONS = [
  { value: BoardResultType.PASS, label: 'Pass' },
  { value: BoardResultType.FAIL, label: 'Fail' },
] as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a BoardResultStatus
 */
export function isBoardResultStatus(obj: object): obj is BoardResultStatus {
  return (
    obj &&
    typeof (obj as BoardResultStatus).id === 'number' &&
    typeof (obj as BoardResultStatus).name === 'string' &&
    typeof (obj as BoardResultStatus).spclType === 'string' &&
    Object.values(BoardResultType).includes((obj as BoardResultStatus).result) &&
    ((obj as BoardResultStatus).sequence === null || typeof (obj as BoardResultStatus).sequence === 'number') &&
    typeof (obj as BoardResultStatus).disabled === 'boolean' &&
    typeof (obj as BoardResultStatus).createdAt === 'string' &&
    typeof (obj as BoardResultStatus).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateBoardResultStatusPayload
 */
export function isCreateBoardResultStatusPayload(obj: object): obj is CreateBoardResultStatusPayload {
  return (
    obj &&
    typeof (obj as CreateBoardResultStatusPayload).name === 'string' &&
    typeof (obj as CreateBoardResultStatusPayload).spclType === 'string' &&
    Object.values(BoardResultType).includes((obj as CreateBoardResultStatusPayload).result) &&
    ((obj as CreateBoardResultStatusPayload).sequence === undefined || (obj as CreateBoardResultStatusPayload).sequence === null || typeof (obj as CreateBoardResultStatusPayload).sequence === 'number') &&
    ((obj as CreateBoardResultStatusPayload).disabled === undefined || typeof (obj as CreateBoardResultStatusPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if an object is an UpdateBoardResultStatusPayload
 */
export function isUpdateBoardResultStatusPayload(obj: object): obj is UpdateBoardResultStatusPayload {
  return (
    obj &&
    ((obj as UpdateBoardResultStatusPayload).name === undefined || typeof (obj as UpdateBoardResultStatusPayload).name === 'string') &&
    ((obj as UpdateBoardResultStatusPayload).spclType === undefined || typeof (obj as UpdateBoardResultStatusPayload).spclType === 'string') &&
    ((obj as UpdateBoardResultStatusPayload).result === undefined || Object.values(BoardResultType).includes((obj as UpdateBoardResultStatusPayload).result as BoardResultType)) &&
    ((obj as UpdateBoardResultStatusPayload).sequence === undefined || (obj as UpdateBoardResultStatusPayload).sequence === null || typeof (obj as UpdateBoardResultStatusPayload).sequence === 'number') &&
    ((obj as UpdateBoardResultStatusPayload).disabled === undefined || typeof (obj as UpdateBoardResultStatusPayload).disabled === 'boolean')
  );
}

/**
 * Type guard to check if a value is a valid board result type
 */
export function isBoardResultType(value: unknown): value is BoardResultType {
  return Object.values(BoardResultType).includes(value as BoardResultType);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: BoardResultStatusFormData): CreateBoardResultStatusPayload {
  return {
    name: formData.name.trim(),
    spclType: formData.spclType.trim(),
    result: formData.result,
    sequence: formData.sequence ? parseInt(formData.sequence, 10) : null,
    disabled: formData.disabled,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(boardResultStatus: BoardResultStatus): BoardResultStatusFormData {
  return {
    name: boardResultStatus.name,
    spclType: boardResultStatus.spclType,
    result: boardResultStatus.result,
    sequence: boardResultStatus.sequence?.toString() || '',
    disabled: boardResultStatus.disabled,
  };
}

/**
 * Validate board result status name
 */
export function validateBoardResultStatusName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 255;
}

/**
 * Validate board result status special type
 */
export function validateBoardResultStatusSpclType(spclType: string): boolean {
  return spclType.trim().length > 0 && spclType.trim().length <= 255;
}

/**
 * Format board result status name for display
 */
export function formatBoardResultStatusName(name: string): string {
  return name.trim();
}

/**
 * Format board result status special type for display
 */
export function formatBoardResultStatusSpclType(spclType: string): string {
  return spclType.trim();
}

/**
 * Get board result type display text
 */
export function getBoardResultTypeText(result: BoardResultType): string {
  return result === BoardResultType.PASS ? 'Pass' : 'Fail';
}

/**
 * Get board result type color
 */
export function getBoardResultTypeColor(result: BoardResultType): string {
  return result === BoardResultType.PASS ? 'text-green-600' : 'text-red-600';
}

/**
 * Get board result status status text
 */
export function getBoardResultStatusStatusText(disabled: boolean): string {
  return disabled ? 'Inactive' : 'Active';
}

/**
 * Get board result status status color
 */
export function getBoardResultStatusStatusColor(disabled: boolean): string {
  return disabled ? 'text-red-600' : 'text-green-600';
} 