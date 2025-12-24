import { AcademicYearT, ClassT, FeeConcessionSlabT, FeeHeadT, FeeStructureComponentT, FeeStructureConcessionSlabT, FeeStructureInstallmentT, FeeStructureT, ReceiptTypeT, Shift } from "@/schemas";
import { ProgramCourseDto } from "../course-design";

export interface FeeStructureComponentDto extends Omit<FeeStructureComponentT, "feeHeadId"> {
    feeHead: FeeHeadT;
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

export interface CreateFeeStructureDto extends Omit<FeeStructureT, "programCourseId" | "shiftId"> {
    components: FeeStructureComponentT[];
    programCourseIds: number[];
    advanceForProgramCourseIds: number[];
    shiftIds: number[];
    feeStructureConcessionSlabs: FeeStructureConcessionSlabT[];
    installments: FeeStructureInstallmentT[];
}