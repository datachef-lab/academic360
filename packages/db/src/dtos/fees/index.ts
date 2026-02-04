import { AcademicYearT, ClassT, FeeCategoryPromotionMappingT, FeeCategoryT, FeeConcessionSlabT, FeeHeadT, FeeStructureComponentT, FeeStructureConcessionSlabT, FeeStructureInstallmentT, FeeStructureT, FeeStudentMappingT, ReceiptTypeT, Shift } from "@/schemas";
import { ProgramCourseDto } from "../course-design";
import { PromotionDto, UserDto } from "../user";

export interface FeeStructureComponentDto extends Omit<FeeStructureComponentT, "feeHeadId"> {
    feeHead: FeeHeadT | null;
}

export interface FeeStructureConcessionSlabDto extends Omit<FeeStructureConcessionSlabT, "feeConcessionSlabId"> {
    feeConcessionSlab: FeeConcessionSlabT;
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
    feeStructureConcessionSlabs: FeeStructureConcessionSlabDto[];
}

export interface CreateFeeStructureDto extends Omit<FeeStructureT, "programCourseId" | "shiftId" | "createdByUserId" | "updatedByUserId" | "id" | "createdAt" | "updatedAt"> {
    components: FeeStructureComponentT[];
    programCourseIds: number[];
    advanceForProgramCourseIds: number[];
    shiftIds: number[];
    feeStructureConcessionSlabs: FeeStructureConcessionSlabT[];
    installments: FeeStructureInstallmentT[];
}

export interface FeeCategoryDto extends Omit<FeeCategoryT, "feeConcessionSlabId"> {
    feeConcessionSlab: FeeConcessionSlabT;
}

export interface FeeCategoryPromotionMappingDto extends Omit<FeeCategoryPromotionMappingT, "feeCategoryId" | "promotionId"> {
    feeCategory: FeeCategoryDto;
    promotion: PromotionDto;
}

export interface FeeStudentMappingDto extends Omit<FeeStudentMappingT, 
    "feeStructureId" 
    | "feeCategoryPromotionMappingId" 
    | "feeStructureInstallmentId"
    | "waivedOffByUserId"
> {
    feeStructure: FeeStructureDto;
    feeCategoryPromotionMappings: FeeCategoryPromotionMappingDto[];
    feeStructureInstallment: FeeStructureInstallmentT | null;
    waivedOffByUser: UserDto | null;
}