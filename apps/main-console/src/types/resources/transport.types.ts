/**
 * Transport Types
 * 
 * This file contains all TypeScript types and interfaces related to the Transport module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Transport mode enum that mirrors the backend enum
 */
export enum TransportType {
  BUS = 'BUS',
  TRAIN = 'TRAIN',
  METRO = 'METRO',
  AUTO = 'AUTO',
  TAXI = 'TAXI',
  CYCLE = 'CYCLE',
  WALKING = 'WALKING',
  OTHER = 'OTHER'
}

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main Transport interface that mirrors the backend model
 */
export interface Transport {
  id: number;
  routeName?: string | null;
  mode: TransportType;
  vehicleNumber?: string | null;
  driverName?: string | null;
  providerDetails?: string | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// ============================================================================
// API PAYLOAD TYPES
// ============================================================================

/**
 * Payload for creating a new transport
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreateTransportPayload {
  routeName?: string | null;
  mode: TransportType;
  vehicleNumber?: string | null;
  driverName?: string | null;
  providerDetails?: string | null;
}

/**
 * Payload for updating an existing transport
 * All fields are optional for partial updates
 */
export interface UpdateTransportPayload {
  routeName?: string | null;
  mode?: TransportType;
  vehicleNumber?: string | null;
  driverName?: string | null;
  providerDetails?: string | null;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for transport operations
 */
export interface TransportApiResponse {
  statusCode: number;
  status: string;
  data: Transport | Transport[] | null;
  message: string;
}

/**
 * API response for single transport
 */
export interface SingleTransportResponse {
  statusCode: number;
  status: string;
  data: Transport;
  message: string;
}

/**
 * API response for multiple transports
 */
export interface MultipleTransportResponse {
  statusCode: number;
  status: string;
  data: Transport[];
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for transport forms
 */
export interface TransportFormData {
  routeName: string;
  mode: TransportType;
  vehicleNumber: string;
  driverName: string;
  providerDetails: string;
}

/**
 * Form validation errors for transport
 */
export interface TransportFormErrors {
  routeName?: string;
  mode?: string;
  vehicleNumber?: string;
  driverName?: string;
  providerDetails?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for transport management
 */
export interface TransportState {
  transports: Transport[];
  currentTransport: Transport | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for transport state management
 */
export type TransportAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_TRANSPORTS'; payload: Transport[] }
  | { type: 'SET_CURRENT_TRANSPORT'; payload: Transport | null }
  | { type: 'ADD_TRANSPORT'; payload: Transport }
  | { type: 'UPDATE_TRANSPORT'; payload: Transport }
  | { type: 'DELETE_TRANSPORT'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for transport table
 */
export interface TransportTableColumn {
  key: keyof Transport;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for transport
 */
export interface TransportFilter {
  mode?: TransportType;
  routeName?: string;
  driverName?: string;
  search?: string;
}

/**
 * Sort options for transport
 */
export interface TransportSort {
  field: keyof Transport;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for transport ID
 */
export type TransportId = number;

/**
 * Type for transport mode
 */
export type TransportMode = TransportType;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for transport
 */
export const DEFAULT_TRANSPORT: CreateTransportPayload = {
  routeName: null,
  mode: TransportType.OTHER,
  vehicleNumber: null,
  driverName: null,
  providerDetails: null,
};

/**
 * Default form data for transport
 */
export const DEFAULT_TRANSPORT_FORM: TransportFormData = {
  routeName: '',
  mode: TransportType.OTHER,
  vehicleNumber: '',
  driverName: '',
  providerDetails: '',
};

/**
 * Table columns configuration for transport
 */
export const TRANSPORT_TABLE_COLUMNS: TransportTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'mode', label: 'Mode', sortable: true, filterable: true, width: '100px' },
  { key: 'routeName', label: 'Route Name', sortable: true, filterable: true },
  { key: 'vehicleNumber', label: 'Vehicle Number', sortable: true, width: '150px' },
  { key: 'driverName', label: 'Driver Name', sortable: true, width: '150px' },
  { key: 'providerDetails', label: 'Provider Details', sortable: true, width: '150px' },
  { key: 'createdAt', label: 'Created At', sortable: true, width: '150px' },
  { key: 'updatedAt', label: 'Updated At', sortable: true, width: '150px' },
];

/**
 * Transport mode options for forms
 */
export const TRANSPORT_MODE_OPTIONS = [
  { value: TransportType.BUS, label: 'Bus', icon: '🚌' },
  { value: TransportType.TRAIN, label: 'Train', icon: '🚆' },
  { value: TransportType.METRO, label: 'Metro', icon: '🚇' },
  { value: TransportType.AUTO, label: 'Auto', icon: '🛺' },
  { value: TransportType.TAXI, label: 'Taxi', icon: '🚕' },
  { value: TransportType.CYCLE, label: 'Cycle', icon: '🚲' },
  { value: TransportType.WALKING, label: 'Walking', icon: '🚶' },
  { value: TransportType.OTHER, label: 'Other', icon: '🚗' },
] as const;

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a Transport
 */
export function isTransport(obj: object): obj is Transport {
  return (
    obj &&
    typeof (obj as Transport).id === 'number' &&
    ((obj as Transport).routeName === null || (obj as Transport).routeName === undefined || typeof (obj as Transport).routeName === 'string') &&
    Object.values(TransportType).includes((obj as Transport).mode) &&
    ((obj as Transport).vehicleNumber === null || (obj as Transport).vehicleNumber === undefined || typeof (obj as Transport).vehicleNumber === 'string') &&
    ((obj as Transport).driverName === null || (obj as Transport).driverName === undefined || typeof (obj as Transport).driverName === 'string') &&
    ((obj as Transport).providerDetails === null || (obj as Transport).providerDetails === undefined || typeof (obj as Transport).providerDetails === 'string') &&
    typeof (obj as Transport).createdAt === 'string' &&
    typeof (obj as Transport).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreateTransportPayload
 */
export function isCreateTransportPayload(obj: object): obj is CreateTransportPayload {
  return (
    obj &&
    ((obj as CreateTransportPayload).routeName === undefined || (obj as CreateTransportPayload).routeName === null || typeof (obj as CreateTransportPayload).routeName === 'string') &&
    Object.values(TransportType).includes((obj as CreateTransportPayload).mode) &&
    ((obj as CreateTransportPayload).vehicleNumber === undefined || (obj as CreateTransportPayload).vehicleNumber === null || typeof (obj as CreateTransportPayload).vehicleNumber === 'string') &&
    ((obj as CreateTransportPayload).driverName === undefined || (obj as CreateTransportPayload).driverName === null || typeof (obj as CreateTransportPayload).driverName === 'string') &&
    ((obj as CreateTransportPayload).providerDetails === undefined || (obj as CreateTransportPayload).providerDetails === null || typeof (obj as CreateTransportPayload).providerDetails === 'string')
  );
}

/**
 * Type guard to check if an object is an UpdateTransportPayload
 */
export function isUpdateTransportPayload(obj: object): obj is UpdateTransportPayload {
  return (
    obj &&
    ((obj as UpdateTransportPayload).routeName === undefined || (obj as UpdateTransportPayload).routeName === null || typeof (obj as UpdateTransportPayload).routeName === 'string') &&
    ((obj as UpdateTransportPayload).mode === undefined || Object.values(TransportType).includes((obj as UpdateTransportPayload).mode as TransportType)) &&
    ((obj as UpdateTransportPayload).vehicleNumber === undefined || (obj as UpdateTransportPayload).vehicleNumber === null || typeof (obj as UpdateTransportPayload).vehicleNumber === 'string') &&
    ((obj as UpdateTransportPayload).driverName === undefined || (obj as UpdateTransportPayload).driverName === null || typeof (obj as UpdateTransportPayload).driverName === 'string') &&
    ((obj as UpdateTransportPayload).providerDetails === undefined || (obj as UpdateTransportPayload).providerDetails === null || typeof (obj as UpdateTransportPayload).providerDetails === 'string')
  );
}

/**
 * Type guard to check if a string is a valid transport type
 */
export function isValidTransportType(value: string): value is TransportType {
  return Object.values(TransportType).includes(value as TransportType);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: TransportFormData): CreateTransportPayload {
  return {
    routeName: formData.routeName.trim() || null,
    mode: formData.mode,
    vehicleNumber: formData.vehicleNumber.trim() || null,
    driverName: formData.driverName.trim() || null,
    providerDetails: formData.providerDetails.trim() || null,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(transport: Transport): TransportFormData {
  return {
    routeName: transport.routeName || '',
    mode: transport.mode,
    vehicleNumber: transport.vehicleNumber || '',
    driverName: transport.driverName || '',
    providerDetails: transport.providerDetails || '',
  };
}

/**
 * Validate transport route name
 */
export function validateTransportRouteName(routeName: string): boolean {
  return routeName.trim().length === 0 || routeName.trim().length <= 255;
}

/**
 * Validate transport vehicle number
 */
export function validateTransportVehicleNumber(vehicleNumber: string): boolean {
  return vehicleNumber.trim().length === 0 || vehicleNumber.trim().length <= 255;
}

/**
 * Validate transport driver name
 */
export function validateTransportDriverName(driverName: string): boolean {
  return driverName.trim().length === 0 || driverName.trim().length <= 255;
}

/**
 * Validate transport provider details
 */
export function validateTransportProviderDetails(providerDetails: string): boolean {
  return providerDetails.trim().length === 0 || providerDetails.trim().length <= 255;
}

/**
 * Format transport mode for display
 */
export function formatTransportMode(mode: TransportType): string {
  return mode.charAt(0) + mode.slice(1).toLowerCase();
}

/**
 * Get transport display name
 */
export function getTransportDisplayName(transport: Transport): string {
  const mode = formatTransportMode(transport.mode);
  const route = transport.routeName ? ` - ${transport.routeName}` : '';
  return `${mode}${route}`;
}

/**
 * Get transport mode icon
 */
export function getTransportModeIcon(mode: TransportType): string {
  const iconMap: Record<TransportType, string> = {
    [TransportType.BUS]: '🚌',
    [TransportType.TRAIN]: '🚆',
    [TransportType.METRO]: '🚇',
    [TransportType.AUTO]: '🛺',
    [TransportType.TAXI]: '🚕',
    [TransportType.CYCLE]: '🚲',
    [TransportType.WALKING]: '🚶',
    [TransportType.OTHER]: '🚗',
  };
  
  return iconMap[mode] || '🚗';
}

/**
 * Get transport display with icon
 */
export function getTransportDisplayWithIcon(transport: Transport): string {
  const icon = getTransportModeIcon(transport.mode);
  const name = getTransportDisplayName(transport);
  return `${icon} ${name}`;
}

/**
 * Get transport mode color
 */
export function getTransportModeColor(mode: TransportType): string {
  const colorMap: Record<TransportType, string> = {
    [TransportType.BUS]: 'text-blue-600',
    [TransportType.TRAIN]: 'text-green-600',
    [TransportType.METRO]: 'text-purple-600',
    [TransportType.AUTO]: 'text-yellow-600',
    [TransportType.TAXI]: 'text-orange-600',
    [TransportType.CYCLE]: 'text-red-600',
    [TransportType.WALKING]: 'text-gray-600',
    [TransportType.OTHER]: 'text-gray-500',
  };
  
  return colorMap[mode] || 'text-gray-500';
}

/**
 * Filter transports by mode
 */
export function filterTransportsByMode(transports: Transport[], mode: TransportType): Transport[] {
  return transports.filter(t => t.mode === mode);
}

/**
 * Search transports by route name
 */
export function searchTransportsByRoute(transports: Transport[], searchTerm: string): Transport[] {
  const term = searchTerm.toLowerCase();
  return transports.filter(t => 
    t.routeName?.toLowerCase().includes(term) ||
    t.driverName?.toLowerCase().includes(term) ||
    t.vehicleNumber?.toLowerCase().includes(term)
  );
} 