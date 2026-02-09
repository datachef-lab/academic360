import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";
import {
  FeesHead,
  FeesSlab,
  FeesReceiptType,
  AddOn,
  FeesComponent,
  FeesSlabMapping,
  CreateFeesStructureDto,
} from "@/types/fees";
import {
  CreateFeeStructureDto,
  FeeStructureDto,
  FeeCategoryDto,
  FeeGroupPromotionMappingDto,
  FeeGroupDto,
} from "@repo/db/dtos/fees";
import { FeeStudentMappingDto } from "@repo/db/dtos/fees/index";
import { PaginatedResponse } from "@/types/pagination";
import { AcademicYear } from "@/types/academics/academic-year";
import type { FeeSlabT } from "@/schemas";

const BASE_PATH = "/api/v1/fees";

// ==================== FEES STRUCTURE APIs ====================

export interface NewFeesStructure {
  closingDate?: Date | null;
  semester?: number | null;
  advanceForSemester?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  onlineStartDate?: Date | null;
  onlineEndDate?: Date | null;
  numberOfInstalments?: number | null;
  instalmentStartDate?: Date | null;
  instalmentEndDate?: Date | null;
  feesReceiptTypeId?: number | null;
  shift?: "MORNING" | "EVENING" | null;
  academicYearId?: number;
  courseId?: number;
  advanceForCourseId?: number | null;
  components?: Omit<FeesComponent, "id" | "feesStructureId" | "createdAt" | "updatedAt">[];
}

// Get all fees structures (paginated)
export async function getAllFeesStructures(
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    academicYearId?: number;
    classId?: number;
    receiptTypeId?: number;
    programCourseId?: number;
    shiftId?: number;
  },
): Promise<ApiResponse<PaginatedResponse<FeeStructureDto>>> {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  if (filters) {
    if (filters.academicYearId) {
      params.append("academicYearId", filters.academicYearId.toString());
    }
    if (filters.classId) {
      params.append("classId", filters.classId.toString());
    }
    if (filters.receiptTypeId) {
      params.append("receiptTypeId", filters.receiptTypeId.toString());
    }
    if (filters.programCourseId) {
      params.append("programCourseId", filters.programCourseId.toString());
    }
    if (filters.shiftId) {
      params.append("shiftId", filters.shiftId.toString());
    }
  }

  const response = await axiosInstance.get(`${BASE_PATH}/structure?${params.toString()}`);
  return response.data;
}

// Get a single fees structure
export async function getFeesStructure(feesStructureId: number): Promise<ApiResponse<FeeStructureDto>> {
  const response = await axiosInstance.get(`${BASE_PATH}/structure/${feesStructureId}`);
  return response.data;
}

// Create a new fees structure
export async function createFeesStructure(
  newFeesStructure: CreateFeeStructureDto | CreateFeesStructureDto,
): Promise<ApiResponse<FeeStructureDto>> {
  const response = await axiosInstance.post(`${BASE_PATH}/structure`, newFeesStructure);
  return response.data;
}

// Create fee structures by DTO (bulk creation for multiple program courses and shifts)
export async function createFeeStructureByDto(
  createFeeStructureDto: CreateFeeStructureDto,
): Promise<ApiResponse<FeeStructureDto[]>> {
  const response = await axiosInstance.post(`${BASE_PATH}/structure/by-dto`, createFeeStructureDto);
  return response.data;
}

// Update fee structure by DTO (with upsert for components, concession slabs, and installments)
export async function updateFeeStructureByDto(
  feeStructureId: number,
  updateFeeStructureDto: CreateFeeStructureDto,
): Promise<ApiResponse<FeeStructureDto>> {
  const response = await axiosInstance.put(`${BASE_PATH}/structure/by-dto/${feeStructureId}`, updateFeeStructureDto);
  return response.data;
}

// Check unique fee structure amounts
export interface CheckUniqueAmountsRequest {
  academicYearId: number;
  classId: number;
  programCourseIds: number[];
  shiftIds: number[];
  baseAmount: number;
  feeStructureSlabs: Array<{
    feeSlabId: number;
    concessionRate: number;
  }>;
  excludeFeeStructureId?: number;
  page?: number;
  pageSize?: number;
}

export interface CheckUniqueAmountsResponse {
  isUnique: boolean;
  conflicts: PaginatedResponse<{
    programCourseId: number;
    shiftId: number;
    concessionSlabId: number;
    concessionSlabName: string;
    conflictingAmount: number;
    conflictingFeeStructureId: number;
    academicYearId: number;
    academicYearName: string | null;
    classId: number;
    className: string | null;
    receiptTypeId: number;
    receiptTypeName: string | null;
  }>;
}

export async function checkUniqueFeeStructureAmounts(
  request: CheckUniqueAmountsRequest,
): Promise<ApiResponse<CheckUniqueAmountsResponse>> {
  const response = await axiosInstance.post(`${BASE_PATH}/structure/check-unique-amounts`, request);
  return response.data;
}

// Check if a fees structure exists (duplicate prevention)
export async function checkFeesStructureExists(payload: {
  academicYearId?: number;
  courseId?: number;
  semester?: number | null;
  shiftId?: number | null;
  feesReceiptTypeId?: number | null;
}): Promise<{ exists: boolean }> {
  const response = await axiosInstance.post(`${BASE_PATH}/structure/exists`, payload);
  return response.data;
}

// Update a fees structure
export async function updateFeesStructure(
  feesStructureId: number,
  feesStructure: Partial<FeeStructureDto>,
): Promise<ApiResponse<FeeStructureDto>> {
  const response = await axiosInstance.put(`${BASE_PATH}/structure/${feesStructureId}`, feesStructure);
  return response.data;
}

// Delete a fees structure
export async function deleteFeesStructure(feesStructureId: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`${BASE_PATH}/structure/${feesStructureId}`);
  return response.data;
}

// ==================== FEES HEADS APIs ====================

export interface NewFeesHead {
  name: string;
  defaultPercentage: number;
  sequence: number;
  remarks?: string | null;
}

// Get all fees heads
export async function getAllFeesHeads(): Promise<FeesHead[]> {
  const response = await axiosInstance.get(`${BASE_PATH}/heads`);
  // Backend returns ApiResponse with { httpStatusCode, httpStatus, payload, message }
  if (response.data && response.data.payload !== undefined) {
    return response.data.payload || [];
  }
  // Fallback for direct array response
  return Array.isArray(response.data) ? response.data : [];
}

// Get a single fees head
export async function getFeesHead(feesHeadId: number): Promise<ApiResponse<FeesHead>> {
  const response = await axiosInstance.get(`${BASE_PATH}/heads/${feesHeadId}`);
  // Backend returns ApiResponse format
  if (response.data && response.data.httpStatus) {
    return {
      httpStatusCode: response.data.httpStatusCode || 200,
      httpStatus: response.data.httpStatus,
      message: response.data.message || "",
      payload: response.data.payload,
    };
  }
  return response.data;
}

// Create a new fees head
export async function createFeesHead(newFeesHead: NewFeesHead): Promise<ApiResponse<FeesHead>> {
  const response = await axiosInstance.post(`${BASE_PATH}/heads`, newFeesHead);
  // Backend returns ApiResponse format
  if (response.data && response.data.httpStatus) {
    return {
      httpStatusCode: response.data.httpStatusCode || 201,
      httpStatus: response.data.httpStatus,
      message: response.data.message || "",
      payload: response.data.payload,
    };
  }
  throw new Error(response.data?.message || "Failed to create fees head");
}

// Update a fees head
export async function updateFeesHead(
  feesHeadId: number,
  feesHead: Partial<NewFeesHead>,
): Promise<ApiResponse<FeesHead>> {
  const response = await axiosInstance.put(`${BASE_PATH}/heads/${feesHeadId}`, feesHead);
  // Backend returns ApiResponse format
  if (response.data && response.data.httpStatus) {
    return {
      httpStatusCode: response.data.httpStatusCode || 200,
      httpStatus: response.data.httpStatus,
      message: response.data.message || "",
      payload: response.data.payload,
    };
  }
  throw new Error(response.data?.message || "Failed to update fees head");
}

// Delete a fees head
export async function deleteFeesHead(feesHeadId: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`${BASE_PATH}/heads/${feesHeadId}`);
  // Backend returns ApiResponse format
  if (response.data && response.data.httpStatus) {
    return {
      httpStatusCode: response.data.httpStatusCode || 200,
      httpStatus: response.data.httpStatus,
      message: response.data.message || "",
      payload: undefined as void,
    };
  }
  throw new Error(response.data?.message || "Failed to delete fees head");
}

// ==================== FEES SLABS APIs ====================

export interface NewFeesSlab {
  name: string;
  description?: string | null;
  sequence: number;
}

// Get all fees slabs
export async function getAllFeesSlabs(): Promise<ApiResponse<FeesSlab[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/slabs`);

  // Backend returns ApiResponse with { httpStatusCode, httpStatus, payload, message }
  if (response.data && response.data.httpStatus && response.data.httpStatus === "SUCCESS") {
    return {
      httpStatusCode: response.data.httpStatusCode || 200,
      httpStatus: response.data.httpStatus,
      message: response.data.message || "",
      payload: response.data.payload || [],
    };
  }
  // Return error response
  return {
    httpStatusCode: response.status || 500,
    httpStatus: "ERROR",
    message: response.data?.message || "Failed to fetch fees slabs",
    payload: [],
  };
}

// Get a single fees slab
export async function getFeesSlab(feesSlabId: number): Promise<ApiResponse<FeesSlab>> {
  const response = await axiosInstance.get(`${BASE_PATH}/slabs/${feesSlabId}`);
  return response.data;
}

// Create a new fees slab
export async function createFeesSlab(newFeesSlab: NewFeesSlab): Promise<ApiResponse<FeesSlab>> {
  const response = await axiosInstance.post(`${BASE_PATH}/slabs`, newFeesSlab);
  return response.data;
}

// Update a fees slab
export async function updateFeesSlab(
  feesSlabId: number,
  feesSlab: Partial<NewFeesSlab>,
): Promise<ApiResponse<FeesSlab>> {
  const response = await axiosInstance.put(`${BASE_PATH}/slabs/${feesSlabId}`, feesSlab);
  return response.data;
}

// Delete a fees slab
export async function deleteFeesSlab(feesSlabId: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`${BASE_PATH}/slabs/${feesSlabId}`);
  return response.data;
}

// ==================== FEES RECEIPT TYPES APIs ====================

export interface NewFeesReceiptType {
  name: string;
  chk?: string | null;
  chkMisc?: string | null;
  printChln?: string | null;
  splType?: string | null;
  addOnId?: number | null;
  printReceipt?: string | null;
  chkOnline?: string | null;
  chkOnSequence?: string | null;
}

// Get all fees receipt types
export async function getAllFeesReceiptTypes(): Promise<FeesReceiptType[]> {
  const response = await axiosInstance.get(`${BASE_PATH}/receipt-types`);
  // Backend returns ApiResponse with { httpStatusCode, status, payload, message }
  return response.data?.payload || response.data || [];
}

// Get a single fees receipt type
export async function getFeesReceiptType(feesReceiptTypeId: number): Promise<ApiResponse<FeesReceiptType>> {
  const response = await axiosInstance.get(`${BASE_PATH}/receipt-types/${feesReceiptTypeId}`);
  return response.data;
}

// Create a new fees receipt type
export async function createFeesReceiptType(
  newFeesReceiptType: NewFeesReceiptType,
): Promise<ApiResponse<FeesReceiptType>> {
  const response = await axiosInstance.post(`${BASE_PATH}/receipt-types`, newFeesReceiptType);
  return response.data;
}

// Update a fees receipt type
export async function updateFeesReceiptType(
  feesReceiptTypeId: number,
  feesReceiptType: Partial<NewFeesReceiptType>,
): Promise<ApiResponse<FeesReceiptType>> {
  const response = await axiosInstance.put(`${BASE_PATH}/receipt-types/${feesReceiptTypeId}`, feesReceiptType);
  return response.data;
}

// Delete a fees receipt type
export async function deleteFeesReceiptType(feesReceiptTypeId: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`${BASE_PATH}/receipt-types/${feesReceiptTypeId}`);
  return response.data;
}

// ==================== ADDONS APIs ====================

export interface NewAddOn {
  name: string;
}

// Get all addons
export async function getAllAddons(): Promise<ApiResponse<AddOn[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/addons`);

  if (response.data && response.data.httpStatus && response.data.httpStatus === "SUCCESS") {
    return {
      httpStatusCode: response.data.httpStatusCode || 200,
      httpStatus: response.data.httpStatus,
      message: response.data.message || "",
      payload: response.data.payload || [],
    };
  }
  // Return error response
  return {
    httpStatusCode: response.status || 500,
    httpStatus: "ERROR",
    message: response.data?.message || "Failed to fetch fee concession slabs",
    payload: [],
  };
}

// Get a single addon
export async function getAddon(addonId: number): Promise<ApiResponse<AddOn>> {
  const response = await axiosInstance.get(`${BASE_PATH}/addons/${addonId}`);

  if (response.data && response.data.httpStatus && response.data.httpStatus === "SUCCESS") {
    return {
      httpStatusCode: response.data.httpStatusCode || 200,
      httpStatus: response.data.httpStatus,
      message: response.data.message || "",
      payload: response.data.payload,
    };
  }
  throw new Error(response.data?.message || "Failed to fetch addon");
}

// Create a new addon
export async function createAddon(newAddon: NewAddOn): Promise<ApiResponse<AddOn>> {
  const response = await axiosInstance.post(`${BASE_PATH}/addons`, newAddon);

  if (response.data && response.data.httpStatus && response.data.httpStatus === "SUCCESS") {
    return {
      httpStatusCode: response.data.httpStatusCode || 201,
      httpStatus: response.data.httpStatus,
      message: response.data.message || "",
      payload: response.data.payload,
    };
  }
  throw new Error(response.data?.message || "Failed to create addon");
}

// Update an addon
export async function updateAddon(addonId: number, addon: Partial<NewAddOn>): Promise<ApiResponse<AddOn>> {
  const response = await axiosInstance.put(`${BASE_PATH}/addons/${addonId}`, addon);

  if (response.data && response.data.httpStatus && response.data.httpStatus === "SUCCESS") {
    return {
      httpStatusCode: response.data.httpStatusCode || 200,
      httpStatus: response.data.httpStatus,
      message: response.data.message || "",
      payload: response.data.payload,
    };
  }
  throw new Error(response.data?.message || "Failed to update addon");
}

// Delete an addon
export async function deleteAddon(addonId: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`${BASE_PATH}/addons/${addonId}`);
  // Backend returns { success, message, data }
  if (
    response.data &&
    response.data.httpStatus &&
    (response.data.httpStatus === "SUCCESS" || response.data.httpStatus === "DELETED")
  ) {
    return {
      httpStatusCode: response.data.httpStatusCode || 200,
      httpStatus: response.data.httpStatus,
      message: response.data.message || "",
      payload: undefined as void,
    };
  }
  throw new Error(response.data?.message || "Failed to delete Addon");
}

// ==================== FEE CONCESSION SLABS APIs (Legacy - now uses FeeSlab) ====================

export interface NewFeeConcessionSlab {
  name: string;
  description?: string | null;
  defaultConcessionRate?: number; // Frontend uses this name for UI clarity
  defaultRate?: number; // Backend expects this name
  sequence?: number | null;
  legacyFeeSlabId?: number | null;
}

// Get all fee concession slabs (legacy - uses /slabs endpoint)
export async function getAllFeeConcessionSlabs(): Promise<ApiResponse<FeeSlabT[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/slabs`);

  // Backend returns ApiResponse with { httpStatusCode, httpStatus, payload, message }
  if (response.data && response.data.httpStatus && response.data.httpStatus === "SUCCESS") {
    return {
      httpStatusCode: response.data.httpStatusCode || 200,
      httpStatus: response.data.httpStatus,
      message: response.data.message || "",
      payload: response.data.payload || [],
    };
  }
  // Return error response
  return {
    httpStatusCode: response.status || 500,
    httpStatus: "ERROR",
    message: response.data?.message || "Failed to fetch fee concession slabs",
    payload: [],
  };
}

// Get a single fee concession slab (legacy - uses /slabs endpoint)
export async function getFeeConcessionSlab(slabId: number): Promise<ApiResponse<FeeSlabT>> {
  const response = await axiosInstance.get(`${BASE_PATH}/slabs/${slabId}`);

  // Backend returns ApiResponse format
  if (response.data && response.data.httpStatus && response.data.httpStatus === "SUCCESS") {
    return {
      httpStatusCode: response.data.httpStatusCode || 200,
      httpStatus: response.data.httpStatus,
      message: response.data.message || "",
      payload: response.data.payload,
    };
  }
  throw new Error(response.data?.message || "Failed to fetch fee concession slab");
}

// Create a new fee concession slab (legacy - uses /slabs endpoint)
export async function createFeeConcessionSlab(newSlab: NewFeeConcessionSlab): Promise<ApiResponse<FeeSlabT>> {
  // Map defaultConcessionRate to defaultRate for backend compatibility
  const payload: any = {
    name: newSlab.name,
    description: newSlab.description,
    defaultRate: newSlab.defaultRate ?? newSlab.defaultConcessionRate ?? 0,
    legacyFeeSlabId: newSlab.legacyFeeSlabId ?? null,
  };

  // Only include sequence if it's provided (not undefined/null)
  if (newSlab.sequence !== undefined && newSlab.sequence !== null) {
    payload.sequence = newSlab.sequence;
  }

  const response = await axiosInstance.post(`${BASE_PATH}/slabs`, payload);

  // Backend returns ApiResponse format
  if (response.data && response.data.httpStatus && response.data.httpStatus === "SUCCESS") {
    return {
      httpStatusCode: response.data.httpStatusCode || 201,
      httpStatus: response.data.httpStatus,
      message: response.data.message || "",
      payload: response.data.payload,
    };
  }
  throw new Error(response.data?.message || "Failed to create fee concession slab");
}

// Update a fee concession slab (legacy - uses /slabs endpoint)
export async function updateFeeConcessionSlab(
  slabId: number,
  slab: Partial<NewFeeConcessionSlab>,
): Promise<ApiResponse<FeeSlabT>> {
  // Map defaultConcessionRate to defaultRate if present
  const payload: any = {};
  if (slab.name !== undefined) payload.name = slab.name;
  if (slab.description !== undefined) payload.description = slab.description;
  if (slab.defaultRate !== undefined) {
    payload.defaultRate = slab.defaultRate;
  } else if (slab.defaultConcessionRate !== undefined) {
    payload.defaultRate = slab.defaultConcessionRate;
  }
  // Only include sequence if it's provided (not undefined/null)
  if (slab.sequence !== undefined && slab.sequence !== null) {
    payload.sequence = slab.sequence;
  }
  if (slab.legacyFeeSlabId !== undefined) payload.legacyFeeSlabId = slab.legacyFeeSlabId ?? null;

  const response = await axiosInstance.put(`${BASE_PATH}/slabs/${slabId}`, payload);

  // Backend returns ApiResponse format
  if (response.data && response.data.httpStatus && response.data.httpStatus === "SUCCESS") {
    return {
      httpStatusCode: response.data.httpStatusCode || 200,
      httpStatus: response.data.httpStatus,
      message: response.data.message || "",
      payload: response.data.payload,
    };
  }
  throw new Error(response.data?.message || "Failed to update fee concession slab");
}

// Delete a fee concession slab (legacy - uses /slabs endpoint)
export async function deleteFeeConcessionSlab(slabId: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`${BASE_PATH}/slabs/${slabId}`);

  // Backend returns ApiResponse format
  if (
    response.data &&
    response.data.httpStatus &&
    (response.data.httpStatus === "SUCCESS" || response.data.httpStatus === "DELETED")
  ) {
    return {
      httpStatusCode: response.data.httpStatusCode || 200,
      httpStatus: response.data.httpStatus,
      message: response.data.message || "",
      payload: undefined as void,
    };
  }
  throw new Error(response.data?.message || "Failed to delete fee concession slab");
}

// ==================== FEES COMPONENTS APIs ====================

export interface NewFeesComponent {
  feesStructureId: number;
  feesHeadId: number;
  isConcessionApplicable: boolean;
  amount: number;
  sequence: number;
  remarks?: string | null;
}

// Get all fees components
export async function getAllFeesComponents(): Promise<ApiResponse<FeesComponent[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/components`);
  return response.data;
}

// Get a single fees component
export async function getFeesComponent(feesComponentId: number): Promise<ApiResponse<FeesComponent>> {
  const response = await axiosInstance.get(`${BASE_PATH}/components/${feesComponentId}`);
  return response.data;
}

// Create a new fees component
export async function createFeesComponent(newFeesComponent: NewFeesComponent): Promise<ApiResponse<FeesComponent>> {
  const response = await axiosInstance.post(`${BASE_PATH}/components`, newFeesComponent);
  return response.data;
}

// Update a fees component
export async function updateFeesComponent(
  feesComponentId: number,
  feesComponent: Partial<NewFeesComponent>,
): Promise<ApiResponse<FeesComponent>> {
  const response = await axiosInstance.put(`${BASE_PATH}/components/${feesComponentId}`, feesComponent);
  return response.data;
}

// Delete a fees component
export async function deleteFeesComponent(feesComponentId: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`${BASE_PATH}/components/${feesComponentId}`);
  return response.data;
}

// ==================== STUDENT FEES MAPPING APIs ====================

export interface NewStudentFeesMapping {
  studentId: number;
  feesStructureId: number;
  type: "FULL" | "INSTALMENT";
  instalmentNumber?: number | null;
  baseAmount: number;
  lateFee: number;
  totalPayable: number;
  amountPaid?: number | null;
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
  paymentMode: "CASH" | "CHEQUE" | "ONLINE";
  transactionRef?: string | null;
  transactionDate?: Date | null;
  receiptNumber?: string | null;
}

// Get all student fees mappings
export async function getAllStudentFeesMappings(): Promise<ApiResponse<FeeStudentMappingDto[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/student-mappings`);
  return response.data;
}

// Get a single student fees mapping
export async function getStudentFeesMapping(studentFeesMappingId: number): Promise<ApiResponse<FeeStudentMappingDto>> {
  const response = await axiosInstance.get(`${BASE_PATH}/student-mappings/${studentFeesMappingId}`);
  return response.data;
}

// Create a new student fees mapping
export async function createStudentFeesMapping(
  newStudentFeesMapping: Partial<FeeStudentMappingDto>,
): Promise<ApiResponse<FeeStudentMappingDto>> {
  const response = await axiosInstance.post(`${BASE_PATH}/student-mappings`, newStudentFeesMapping);
  return response.data;
}

// Update a student fees mapping
export async function updateStudentFeesMapping(
  studentFeesMappingId: number,
  studentFeesMapping: Partial<FeeStudentMappingDto>,
): Promise<ApiResponse<FeeStudentMappingDto>> {
  const response = await axiosInstance.put(`${BASE_PATH}/student-mappings/${studentFeesMappingId}`, studentFeesMapping);
  return response.data;
}

// Delete a student fees mapping
export async function deleteStudentFeesMapping(studentFeesMappingId: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`${BASE_PATH}/student-mappings/${studentFeesMappingId}`);
  return response.data;
}

// Get fee student mappings by student ID
export async function getFeeStudentMappingsByStudentId(
  studentId: number,
): Promise<ApiResponse<FeeStudentMappingDto[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/student-mappings/student/${studentId}`);
  return response.data;
}

// ==================== FEE CATEGORIES APIs ====================

export interface NewFeeCategory {
  name: string;
  description?: string | null;
}

export async function getAllFeeCategories(): Promise<ApiResponse<FeeCategoryDto[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/categories`);
  return response.data;
}

export async function getFeeCategory(id: number): Promise<ApiResponse<FeeCategoryDto>> {
  const response = await axiosInstance.get(`${BASE_PATH}/categories/${id}`);
  return response.data;
}

export async function createFeeCategory(newCategory: NewFeeCategory): Promise<ApiResponse<FeeCategoryDto>> {
  const response = await axiosInstance.post(`${BASE_PATH}/categories`, newCategory);
  return response.data;
}

export async function updateFeeCategory(
  id: number,
  category: Partial<NewFeeCategory>,
): Promise<ApiResponse<FeeCategoryDto>> {
  const response = await axiosInstance.put(`${BASE_PATH}/categories/${id}`, category);
  return response.data;
}

export async function deleteFeeCategory(id: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`${BASE_PATH}/categories/${id}`);
  return response.data;
}

// ==================== FEE GROUPS APIs ====================

export interface NewFeeGroup {
  feeCategoryId: number;
  feeSlabId: number;
  description?: string | null;
  validityType: "SEMESTER" | "ACADEMIC_YEAR" | "PROGRAM_COURSE";
}

export async function getAllFeeGroups(): Promise<ApiResponse<FeeGroupDto[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/groups`);
  return response.data;
}

export async function getFeeGroup(id: number): Promise<ApiResponse<FeeGroupDto>> {
  const response = await axiosInstance.get(`${BASE_PATH}/groups/${id}`);
  return response.data;
}

export async function createFeeGroup(newGroup: NewFeeGroup): Promise<ApiResponse<FeeGroupDto>> {
  const response = await axiosInstance.post(`${BASE_PATH}/groups`, newGroup);
  return response.data;
}

export async function updateFeeGroup(id: number, group: Partial<NewFeeGroup>): Promise<ApiResponse<FeeGroupDto>> {
  const response = await axiosInstance.put(`${BASE_PATH}/groups/${id}`, group);
  return response.data;
}

export async function deleteFeeGroup(id: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`${BASE_PATH}/groups/${id}`);
  return response.data;
}

// ==================== FEES SLAB YEAR MAPPING APIs ====================
// Get all fees slab years
export async function getAllFeesSlabYears(): Promise<ApiResponse<FeesSlabMapping[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/slab-year-mappings`);
  return response.data;
}

// Get a single fees slab year
export async function getFeesSlabYear(feesSlabYearId: number): Promise<ApiResponse<FeesSlabMapping>> {
  const response = await axiosInstance.get(`${BASE_PATH}/slab-year-mappings/${feesSlabYearId}`);
  return response.data;
}

// Create a new fees slab year
export async function createFeesSlabYear(FeesSlabMapping: FeesSlabMapping): Promise<ApiResponse<FeesSlabMapping>> {
  const response = await axiosInstance.post(`${BASE_PATH}/slab-year-mappings`, FeesSlabMapping);
  return response.data;
}

// Update a fees slab year
export async function updateFeesSlabYear(
  feesSlabYearId: number,
  feesSlabYear: Partial<FeesSlabMapping>,
): Promise<ApiResponse<FeesSlabMapping>> {
  const response = await axiosInstance.put(`${BASE_PATH}/slab-year-mappings/${feesSlabYearId}`, feesSlabYear);
  return response.data;
}

// Delete a fees slab year
export async function deleteFeesSlabYear(feesSlabYearId: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`${BASE_PATH}/slab-years/${feesSlabYearId}`);
  return response.data;
}

// Update the check-exist endpoint to use the correct path
export const checkSlabsExistForAcademicYear = async (academicYearId: number): Promise<{ exists: boolean }> => {
  const response = await axiosInstance.get(`/api/v1/fees/slabs/check-exist/${academicYearId}`);
  return response.data;
};

// ==================== FEE GROUP PROMOTION MAPPING APIs ====================

export interface NewFeeGroupPromotionMapping {
  feeCategoryId?: number;
  feeGroupId?: number;
  promotionId: number;
}

export interface FeeGroupPromotionFilterRequest {
  academicYearId?: number;
  programCourseId?: number;
  classId?: number;
  shiftId?: number;
  religionId?: number;
  categoryId?: number;
  community?: string;
  feeGroupId: number;
}

export interface FilteredFeeGroupPromotionMapping {
  promotionId: number;
  studentId: number;
  feeGroupId: number;
  exists: boolean;
}

export async function getAllFeeGroupPromotionMappings(): Promise<ApiResponse<FeeGroupPromotionMappingDto[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/group-promotion-mappings`);
  return response.data;
}

export async function getFeeGroupPromotionMapping(id: number): Promise<ApiResponse<FeeGroupPromotionMappingDto>> {
  const response = await axiosInstance.get(`${BASE_PATH}/group-promotion-mappings/${id}`);
  return response.data;
}

export async function getFeeGroupPromotionMappingsByFeeGroupId(
  feeGroupId: number,
): Promise<ApiResponse<FeeGroupPromotionMappingDto[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/group-promotion-mappings/fee-group/${feeGroupId}`);
  return response.data;
}

export async function getFeeGroupPromotionMappingsByPromotionId(
  promotionId: number,
): Promise<ApiResponse<FeeGroupPromotionMappingDto[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/group-promotion-mappings/promotion/${promotionId}`);
  return response.data;
}

export async function createFeeGroupPromotionMapping(
  newMapping: NewFeeGroupPromotionMapping,
): Promise<ApiResponse<FeeGroupPromotionMappingDto>> {
  const response = await axiosInstance.post(`${BASE_PATH}/group-promotion-mappings`, newMapping);
  return response.data;
}

export async function updateFeeGroupPromotionMapping(
  id: number,
  mapping: Partial<NewFeeGroupPromotionMapping>,
): Promise<ApiResponse<FeeGroupPromotionMappingDto>> {
  const response = await axiosInstance.put(`${BASE_PATH}/group-promotion-mappings/${id}`, mapping);
  return response.data;
}

export async function deleteFeeGroupPromotionMapping(id: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`${BASE_PATH}/group-promotion-mappings/${id}`);
  return response.data;
}

export async function getFilteredFeeGroupPromotionMappings(
  filters: FeeGroupPromotionFilterRequest,
): Promise<ApiResponse<FilteredFeeGroupPromotionMapping[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/group-promotion-mappings/filtered`, { params: filters });
  return response.data;
}

export interface BulkUploadResult {
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
  errors: Array<{
    row: number;
    data: {
      UID: string;
      Semester: string;
      "Fee Category Name": string;
    };
    error: string;
  }>;
  success: Array<{
    row: number;
    data: {
      UID: string;
      Semester: string;
      "Fee Category Name": string;
    };
    mappingId: number;
  }>;
}

export async function bulkUploadFeeGroupPromotionMappings(file: File): Promise<ApiResponse<BulkUploadResult>> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axiosInstance.post<ApiResponse<BulkUploadResult>>(
    `${BASE_PATH}/group-promotion-mappings/bulk-upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return response.data;
}

export const getFeesStructures = async (
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    academicYearId?: number;
    classId?: number;
    receiptTypeId?: number;
    programCourseId?: number;
    shiftId?: number;
  },
): Promise<FeeStructureDto[]> => {
  const response = await axiosInstance.get<ApiResponse<PaginatedResponse<FeeStructureDto>>>(`${BASE_PATH}/structure`, {
    params: {
      page,
      pageSize,
      ...filters,
    },
  });
  // Handle ApiResponse format with PaginatedResponse
  if (response.data.payload && response.data.payload.content) {
    return response.data.payload.content;
  }
  return [];
};

export const getAcademicYearsFromFeesStructures = async (): Promise<AcademicYear[]> => {
  const response = await axiosInstance.get(`${BASE_PATH}/structure/academic-years/all`);
  if (response.data && response.data.payload) {
    return response.data.payload;
  }
  return [];
};

export const getCoursesFromFeesStructures = async (academicYearId: number) => {
  const response = await axiosInstance.get(`${BASE_PATH}/structure/courses/${academicYearId}`);
  return response.data;
};

export const getFeesStructuresByAcademicYearAndCourse = async (academicYearId: number, courseId: number) => {
  const response = await axiosInstance.get(
    `${BASE_PATH}/structure/by-academic-year-and-course/${academicYearId}/${courseId}`,
  );
  return response.data;
};

export const getFeesDesignAbstractLevel = async (academicYearId?: number, courseId?: number) => {
  const params = new URLSearchParams();
  if (academicYearId) params.append("academicYearId", academicYearId.toString());
  if (courseId) params.append("courseId", courseId.toString());
  const response = await axiosInstance.get(`${BASE_PATH}/structure/design-abstract-level?${params.toString()}`);
  return response.data;
};
