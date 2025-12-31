import { ApiResponse } from "@/types/api-response";
import axiosInstance from "@/utils/api";
import {
  FeesStructureDto,
  FeesHead,
  FeesSlab,
  FeesReceiptType,
  AddOn,
  FeesComponent,
  StudentFeesMapping,
  FeesSlabMapping,
  CreateFeesStructureDto,
  FeeConcessionSlab,
} from "@/types/fees";

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

// Get all fees structures
export async function getAllFeesStructures(): Promise<ApiResponse<FeesStructureDto[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/structure`);
  return response.data;
}

// Get a single fees structure
export async function getFeesStructure(feesStructureId: number): Promise<ApiResponse<FeesStructureDto>> {
  const response = await axiosInstance.get(`${BASE_PATH}/structure/${feesStructureId}`);
  return response.data;
}

// Create a new fees structure
export async function createFeesStructure(
  newFeesStructure: CreateFeesStructureDto,
): Promise<ApiResponse<FeesStructureDto>> {
  const response = await axiosInstance.post(`${BASE_PATH}/structure`, newFeesStructure);
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
  feesStructure: Partial<FeesStructureDto>,
): Promise<ApiResponse<FeesStructureDto>> {
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
export async function getAllFeesSlabs(): Promise<FeesSlab[]> {
  const response = await axiosInstance.get(`${BASE_PATH}/slabs`);
  console.log("fees slabs:", response.data);
  return response.data;
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

// ==================== FEE CONCESSION SLABS APIs ====================

export interface NewFeeConcessionSlab {
  name: string;
  description: string;
  defaultConcessionRate: number;
  sequence: number;
  legacyFeeSlabId?: number | null;
}

// Get all fee concession slabs
export async function getAllFeeConcessionSlabs(): Promise<ApiResponse<FeeConcessionSlab[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/concession-slabs`);

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

// Get a single fee concession slab
export async function getFeeConcessionSlab(slabId: number): Promise<ApiResponse<FeeConcessionSlab>> {
  const response = await axiosInstance.get(`${BASE_PATH}/concession-slabs/${slabId}`);

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

// Create a new fee concession slab
export async function createFeeConcessionSlab(newSlab: NewFeeConcessionSlab): Promise<ApiResponse<FeeConcessionSlab>> {
  const response = await axiosInstance.post(`${BASE_PATH}/concession-slabs`, newSlab);

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

// Update a fee concession slab
export async function updateFeeConcessionSlab(
  slabId: number,
  slab: Partial<NewFeeConcessionSlab>,
): Promise<ApiResponse<FeeConcessionSlab>> {
  const response = await axiosInstance.put(`${BASE_PATH}/concession-slabs/${slabId}`, slab);

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

// Delete a fee concession slab
export async function deleteFeeConcessionSlab(slabId: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`${BASE_PATH}/concession-slabs/${slabId}`);

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
export async function getAllStudentFeesMappings(): Promise<ApiResponse<StudentFeesMapping[]>> {
  const response = await axiosInstance.get(`${BASE_PATH}/student-fees-mappings`);
  return response.data;
}

// Get a single student fees mapping
export async function getStudentFeesMapping(studentFeesMappingId: number): Promise<ApiResponse<StudentFeesMapping>> {
  const response = await axiosInstance.get(`${BASE_PATH}/student-fees-mappings/${studentFeesMappingId}`);
  return response.data;
}

// Create a new student fees mapping
export async function createStudentFeesMapping(
  newStudentFeesMapping: NewStudentFeesMapping,
): Promise<ApiResponse<StudentFeesMapping>> {
  const response = await axiosInstance.post(`${BASE_PATH}/student-fees-mappings`, newStudentFeesMapping);
  return response.data;
}

// Update a student fees mapping
export async function updateStudentFeesMapping(
  studentFeesMappingId: number,
  studentFeesMapping: Partial<NewStudentFeesMapping>,
): Promise<ApiResponse<StudentFeesMapping>> {
  const response = await axiosInstance.put(
    `${BASE_PATH}/student-fees-mappings/${studentFeesMappingId}`,
    studentFeesMapping,
  );
  return response.data;
}

// Delete a student fees mapping
export async function deleteStudentFeesMapping(studentFeesMappingId: number): Promise<ApiResponse<void>> {
  const response = await axiosInstance.delete(`${BASE_PATH}/student-fees-mappings/${studentFeesMappingId}`);
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

export const getFeesStructures = async () => {
  const response = await axiosInstance.get(`${BASE_PATH}/structure`);
  return response.data;
};

export const getAcademicYearsFromFeesStructures = async () => {
  const response = await axiosInstance.get(`${BASE_PATH}/structure/academic-years/all`);
  return response.data;
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
