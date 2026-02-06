import { AcademicYearT, ClassT, FeeCategoryT,  FeeHeadT, FeeStructureComponentT, FeeStructureInstallmentT, FeeStructureT, FeeStudentMappingT, ReceiptTypeT, Shift } from "@/schemas";
import { ProgramCourseDto } from "../course-design";
import { PromotionDto, UserDto } from "../user";
import { FeeStructureSlabT } from "@/schemas/models/fees/fee-structure-slab.model";
import { FeeSlabT } from "@/schemas/models/fees/fee-slab.model";
import { FeeGroupT } from "@/schemas/models/fees/fee-group.model";
import { FeeGroupPromotionMappingT } from "@/schemas/models/fees/fee-group-promotion-mapping.model";

export interface FeeStructureComponentDto extends Omit<FeeStructureComponentT, "feeHeadId"> {
    feeHead: FeeHeadT | null;
}

export interface FeeStructureSlabDto extends Omit<FeeStructureSlabT, "feeSlabId"> {
    feeSlab: FeeSlabT;
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
    feeStructureSlabs: FeeStructureSlabDto[];
}

export interface CreateFeeStructureDto extends Omit<FeeStructureT, "programCourseId" | "shiftId" | "createdByUserId" | "updatedByUserId" | "id" | "createdAt" | "updatedAt"> {
    components: FeeStructureComponentT[];
    programCourseIds: number[];
    advanceForProgramCourseIds: number[];
    shiftIds: number[];
    feeStructureSlabs: FeeStructureSlabT[];
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
}

export interface FeeStudentMappingDto extends Omit<FeeStudentMappingT, 
    "feeStructureId" 
    | "feeGroupPromotionMappingId" 
    | "feeStructureInstallmentId"
    | "waivedOffByUserId"
> {
    feeStructure: FeeStructureDto;
    feeGroupPromotionMappings: FeeGroupPromotionMappingDto[];
    feeStructureInstallment: FeeStructureInstallmentT | null;
    waivedOffByUser: UserDto | null;
}