import { AcademicYearT, ClassT, FeeCategoryT,  FeeHeadT, FeeStructureComponentT, FeeStructureInstallmentT, FeeStructureT, FeeStudentMappingT, ReceiptTypeT, Shift } from "@/schemas";
import { ProgramCourseDto } from "../course-design";
import { PromotionDto  } from "../batches/index";
import {UserDto } from "../user/index";
import { FeeSlabT } from "@/schemas/models/fees/fee-slab.model";
import { FeeGroupT } from "@/schemas/models/fees/fee-group.model";
import { FeeGroupPromotionMappingT } from "@/schemas/models/fees/fee-group-promotion-mapping.model";

export interface FeeStructureComponentDto extends Omit<FeeStructureComponentT, "feeHeadId" | "feeSlabId"> {
    feeHead: FeeHeadT | null;
}

export interface FeeStructureDto extends Omit<FeeStructureT,
    "receiptTypeId"
    | "academicYearId"
    | "programCourseId"
    | "classId"
    | "shiftId"
    | "advanceForProgramCourseId"
    | "advanceForClassId"
> {
    receiptType: ReceiptTypeT;
    academicYear: AcademicYearT;
    programCourse: ProgramCourseDto;
    class: ClassT;
    shift: Shift;
    advanceForProgramCourse: ProgramCourseDto | null;
    advanceForClass: ClassT | null;
    components: FeeStructureComponentDto[];
    installments: FeeStructureInstallmentT[];
}

export interface CreateFeeStructureDto extends Omit<FeeStructureT, "programCourseId" | "shiftId" | "createdByUserId" | "updatedByUserId" | "id" | "createdAt" | "updatedAt"> {
    components: FeeStructureComponentT[];
    programCourseIds: number[];
    advanceForProgramCourseIds: number[];
    shiftIds: number[];
    installments: FeeStructureInstallmentT[];
}

export interface FeeCategoryDto extends Omit<FeeCategoryT, never> {
    // FeeCategory has no foreign keys, so no DTO transformation needed
}

export interface FeeGroupDto extends Omit<FeeGroupT, "feeCategoryId" | "feeSlabId"> {
    feeCategory: FeeCategoryT;
    feeSlab: FeeSlabT;
}

export interface FeeGroupPromotionMappingDto extends Omit<FeeGroupPromotionMappingT, "feeGroupId" | "promotionId"> {
    feeGroup: FeeGroupDto;
    promotion: PromotionDto;
    /** Set to Paid when any related fee_student_mapping has a linked payment with status SUCCESS */
    paymentStatus?: "Paid" | "Pending" | "Unpaid";
    /** Remaining balance: sum of max(0, totalPayable - amountPaid) per related fee_student_mapping (0 when fully paid) */
    amountToPay?: number;
    /** Sum of fee_student_mappings.totalPayable for this mapping (for display as actual fee amount) */
    totalPayableAmount?: number;
    /** True when any related fee_student_mapping has a linked payment with status SUCCESS — read-only edit dialog */
    saveBlockedForEdit?: boolean;
    /** For approval details in edit dialog */
    updatedByUser?: { name: string; avatarUrl?: string | null } | null;
}

export interface FeeStudentMappingDto extends Omit<FeeStudentMappingT, 
    "feeStructureId" 
    | "feeGroupPromotionMappingId" 
    | "feeStructureInstallmentId"
    | "waivedOffByUserId"
    | "transactionDate"
> {
    feeStructure: FeeStructureDto;
    feeGroupPromotionMappings: FeeGroupPromotionMappingDto[];
    feeStructureInstallment: FeeStructureInstallmentT | null;
    waivedOffByUser: UserDto | null;
    /** Computed status for UI rendering */
    paymentStatus?: "COMPLETED" | "PENDING" | "FAILED";
    /** Computed from linked `payments` row (txnDate / updatedAt). */
    transactionDate?: string | Date | null;
}