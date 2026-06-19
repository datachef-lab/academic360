import axiosInstance from "@/utils/api";

export type ShiftChangeFeeGroupPreviewRow = {
  promotionId: number;
  promotionLabel: string;
  feeSlab: string | null;
  feeCategory: string | null;
  approvalType: string | null;
  approvedByUser: string | null;
  totalPayable: number | null;
  receiptType: string | null;
  generatedDocumentType: "challan" | "receipt" | null;
};

export type ShiftChangeGeneratedFeeDocument = {
  feeStudentMappingId: number;
  promotionId: number;
  promotionLabel: string;
  receiptType: string | null;
  generatedDocumentType: "challan" | "receipt";
};

export type UidBreakdownPreview = {
  currentUid: string;
  newUid: string;
  programCoursePrefix: string;
  programCourseName: string | null;
  programCourseShortName: string | null;
  shiftPrefix: string;
  shiftName: string | null;
  registrationYear: string;
  sequence: string;
};

export type StudentShiftChangePreview = {
  allowed: boolean;
  blockReason: string | null;
  previousUid: string | null;
  feesPaid: boolean;
  currentShift: { id: number; name: string } | null;
  newShift: { id: number; name: string } | null;
  newUidPreview: string | null;
  uidBreakdown: UidBreakdownPreview | null;
  hasExamHistoryOnActivePromotions: boolean;
  feeComparison: {
    old: ShiftChangeFeeGroupPreviewRow[];
    new: ShiftChangeFeeGroupPreviewRow[];
  } | null;
  generatedFeeDocuments: ShiftChangeGeneratedFeeDocument[];
};

export type StudentShiftChangeResult = {
  studentId: number;
  previousUid: string;
  newUid: string;
  oldEmail: string;
  newEmail: string;
  oldShiftId: number;
  newShiftId: number;
  feesPaid: boolean;
  promotionsUpdated: number;
  promotionsClosedForExamHistory: number;
  promotionsClonedForExamHistory: number;
  promotionIdsWithExamHistory: number[];
  feeMappingsDeleted: number;
  feeStructuresProcessed: number;
};

export async function fetchStudentShiftChangePreview(
  studentId: number,
  newShiftId: number,
): Promise<StudentShiftChangePreview> {
  const res = await axiosInstance.get(`/api/students/${studentId}/shift-change/preview`, {
    params: { newShiftId },
  });
  return res.data.payload as StudentShiftChangePreview;
}

export async function submitStudentShiftChange(
  studentId: number,
  newShiftId: number,
): Promise<StudentShiftChangeResult> {
  const res = await axiosInstance.post(`/api/students/${studentId}/shift-change`, {
    newShiftId,
  });
  return res.data.payload as StudentShiftChangeResult;
}

export type ActivePromotionFieldsResult = {
  promotionIdsUpdated: number[];
  sectionId: number | null;
  classRollNumber: string | null;
};

/**
 * PATCH the section / class roll number on every active promotion of a
 * student (endDate IS NULL and not deprecated). Either field is optional —
 * send whichever the operator changed.
 */
export async function updateActivePromotionFields(
  studentId: number,
  input: { sectionId?: number | null; classRollNumber?: string | null },
): Promise<ActivePromotionFieldsResult> {
  const res = await axiosInstance.patch(
    `/api/students/${studentId}/active-promotion-fields`,
    input,
  );
  return res.data.payload as ActivePromotionFieldsResult;
}
