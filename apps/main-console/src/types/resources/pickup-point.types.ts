/**
 * Pickup Point Types
 * 
 * This file contains all TypeScript types and interfaces related to the Pickup Point module.
 * These types mirror the backend model structure and provide type safety for frontend operations.
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================

/**
 * Main Pickup Point interface that mirrors the backend model
 */
export interface PickupPoint {
    readonly id?: number;
  name?: string | null;
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// ============================================================================
// API PAYLOAD TYPES
// ============================================================================

/**
 * Payload for creating a new pickup point
 * Excludes auto-generated fields like id, createdAt, and updatedAt
 */
export interface CreatePickupPointPayload {
  name?: string | null;
}

/**
 * Payload for updating an existing pickup point
 * All fields are optional for partial updates
 */
export interface UpdatePickupPointPayload {
  name?: string | null;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response structure for pickup point operations
 */
export interface PickupPointApiResponse {
  statusCode: number;
  status: string;
  data: PickupPoint | PickupPoint[] | null;
  message: string;
}

/**
 * API response for single pickup point
 */
export interface SinglePickupPointResponse {
  statusCode: number;
  status: string;
  data: PickupPoint;
  message: string;
}

/**
 * API response for multiple pickup points
 */
export interface MultiplePickupPointResponse {
  statusCode: number;
  status: string;
  data: PickupPoint[];
  message: string;
}

// ============================================================================
// FORM TYPES
// ============================================================================

/**
 * Form data structure for pickup point forms
 */
export interface PickupPointFormData {
  name: string;
}

/**
 * Form validation errors for pickup point
 */
export interface PickupPointFormErrors {
  name?: string;
}

// ============================================================================
// STATE MANAGEMENT TYPES
// ============================================================================

/**
 * State interface for pickup point management
 */
export interface PickupPointState {
  pickupPoints: PickupPoint[];
  currentPickupPoint: PickupPoint | null;
  loading: boolean;
  error: string | null;
  success: string | null;
}

/**
 * Action types for pickup point state management
 */
export type PickupPointAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SUCCESS'; payload: string | null }
  | { type: 'SET_PICKUP_POINTS'; payload: PickupPoint[] }
  | { type: 'SET_CURRENT_PICKUP_POINT'; payload: PickupPoint | null }
  | { type: 'ADD_PICKUP_POINT'; payload: PickupPoint }
  | { type: 'UPDATE_PICKUP_POINT'; payload: PickupPoint }
  | { type: 'DELETE_PICKUP_POINT'; payload: number }
  | { type: 'CLEAR_STATE' };

// ============================================================================
// TABLE AND DISPLAY TYPES
// ============================================================================

/**
 * Column configuration for pickup point table
 */
export interface PickupPointTableColumn {
  key: keyof PickupPoint;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * Filter options for pickup point
 */
export interface PickupPointFilter {
  name?: string;
  search?: string;
}

/**
 * Sort options for pickup point
 */
export interface PickupPointSort {
  field: keyof PickupPoint;
  direction: 'asc' | 'desc';
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for pickup point ID
 */
export type PickupPointId = number;

/**
 * Type for pickup point name
 */
export type PickupPointName = string | null;

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default values for pickup point
 */
export const DEFAULT_PICKUP_POINT: CreatePickupPointPayload = {
  name: '',
};

/**
 * Default form data for pickup point
 */
export const DEFAULT_PICKUP_POINT_FORM: PickupPointFormData = {
  name: '',
};

/**
 * Table columns configuration for pickup point
 */
export const PICKUP_POINT_TABLE_COLUMNS: PickupPointTableColumn[] = [
  { key: 'id', label: 'ID', sortable: true, width: '80px' },
  { key: 'name', label: 'Pickup Point Name', sortable: true, filterable: true },
  { key: 'createdAt', label: 'Created At', sortable: true, width: '150px' },
  { key: 'updatedAt', label: 'Updated At', sortable: true, width: '150px' },
];

/**
 * Common pickup points for reference
 */
export const COMMON_PICKUP_POINTS = [
  'Main Campus', 'City Center', 'Airport', 'Bus Station', 'Train Station',
  'Shopping Mall', 'Downtown', 'Suburban Center', 'Industrial Area',
  'Residential Area', 'University Campus', 'Hospital', 'Government Office'
] as const;

/**
 * Type for common pickup point values
 */
export type CommonPickupPoint = typeof COMMON_PICKUP_POINTS[number];

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if an object is a PickupPoint
 */
export function isPickupPoint(obj: object): obj is PickupPoint {
  return (
    obj &&
    typeof (obj as PickupPoint).id === 'number' &&
    ((obj as PickupPoint).name === null || typeof (obj as PickupPoint).name === 'string') &&
    typeof (obj as PickupPoint).createdAt === 'string' &&
    typeof (obj as PickupPoint).updatedAt === 'string'
  );
}

/**
 * Type guard to check if an object is a CreatePickupPointPayload
 */
export function isCreatePickupPointPayload(obj: object): obj is CreatePickupPointPayload {
  return (
    obj &&
    ((obj as CreatePickupPointPayload).name === undefined || (obj as CreatePickupPointPayload).name === null || typeof (obj as CreatePickupPointPayload).name === 'string')
  );
}

/**
 * Type guard to check if an object is an UpdatePickupPointPayload
 */
export function isUpdatePickupPointPayload(obj: object): obj is UpdatePickupPointPayload {
  return (
    obj &&
    ((obj as UpdatePickupPointPayload).name === undefined || (obj as UpdatePickupPointPayload).name === null || typeof (obj as UpdatePickupPointPayload).name === 'string')
  );
}

/**
 * Type guard to check if a string is a common pickup point
 */
export function isCommonPickupPoint(value: string): value is CommonPickupPoint {
  return COMMON_PICKUP_POINTS.includes(value as CommonPickupPoint);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert form data to API payload
 */
export function formDataToPayload(formData: PickupPointFormData): CreatePickupPointPayload {
  return {
    name: formData.name.trim() || null,
  };
}

/**
 * Convert API data to form data
 */
export function apiDataToFormData(pickupPoint: PickupPoint): PickupPointFormData {
  return {
    name: pickupPoint.name || '',
  };
}

/**
 * Validate pickup point name
 */
export function validatePickupPointName(name: string): boolean {
  return name.trim().length === 0 || name.trim().length <= 255;
}

/**
 * Format pickup point name for display
 */
export function formatPickupPointName(name: string | null): string {
  return name?.trim() || 'Unnamed Pickup Point';
}

/**
 * Get pickup point display name
 */
export function getPickupPointDisplayName(pickupPoint: PickupPoint): string {
  return formatPickupPointName(pickupPoint.name ?? null);
}

/**
 * Get pickup point icon (basic implementation)
 */
export function getPickupPointIcon(pickupPointName: string | null): string {
  if (!pickupPointName) return '📍';
  
  const iconMap: Record<string, string> = {
    'Main Campus': '🏫',
    'City Center': '🏙️',
    'Airport': '✈️',
    'Bus Station': '🚌',
    'Train Station': '🚆',
    'Shopping Mall': '🛍️',
    'Downtown': '🏢',
    'Suburban Center': '🏘️',
    'Industrial Area': '🏭',
    'Residential Area': '🏠',
    'University Campus': '🎓',
    'Hospital': '🏥',
    'Government Office': '🏛️',
  };
  
  return iconMap[pickupPointName] || '📍';
}

/**
 * Get pickup point display with icon
 */
export function getPickupPointDisplayWithIcon(pickupPoint: PickupPoint): string {
  const icon = getPickupPointIcon(pickupPoint.name ?? null);
  const name = getPickupPointDisplayName(pickupPoint);
  return `${icon} ${name}`;
}

/**
 * Get pickup point category (basic categorization)
 */
export function getPickupPointCategory(pickupPointName: string | null): string {
  if (!pickupPointName) return 'Other';
  
  const categoryMap: Record<string, string> = {
    'Main Campus': 'Educational',
    'University Campus': 'Educational',
    'City Center': 'Commercial',
    'Shopping Mall': 'Commercial',
    'Downtown': 'Commercial',
    'Airport': 'Transportation',
    'Bus Station': 'Transportation',
    'Train Station': 'Transportation',
    'Suburban Center': 'Residential',
    'Residential Area': 'Residential',
    'Industrial Area': 'Industrial',
    'Hospital': 'Healthcare',
    'Government Office': 'Government',
  };
  
  return categoryMap[pickupPointName] || 'Other';
}

/**
 * Get pickup point category color
 */
export function getPickupPointCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    'Educational': 'text-blue-600',
    'Commercial': 'text-green-600',
    'Transportation': 'text-purple-600',
    'Residential': 'text-orange-600',
    'Industrial': 'text-gray-600',
    'Healthcare': 'text-red-600',
    'Government': 'text-indigo-600',
    'Other': 'text-gray-500',
  };
  
  return colorMap[category] || 'text-gray-500';
} 