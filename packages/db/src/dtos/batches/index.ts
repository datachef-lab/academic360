import { ProgramCourseDto } from "../course-design";
import { Batch, ClassT, SectionT, SessionT, ShiftT } from "../../schemas/models/academics";
import { AffiliationT, BoardResultStatusT, PromotionBuilderClauseClassMappingT, PromotionBuilderClauseMappingT, PromotionBuilderT, PromotionClauseClassMappingT, PromotionClauseT, PromotionStatusT, PromotionT } from "@/schemas";

export interface BatchDto extends Omit<
    Batch, 
    "programCourseId" 
    | "classId" 
    | "sectionId" 
    | "shiftId" 
    | "sessionId"
> {
    programCourse: ProgramCourseDto;
    class: ClassT;
    section: SectionT;
    shift: ShiftT;
    session: SessionT;
}

export interface PromotionDto extends Omit<
    PromotionT, 
    "promotionStatusId" 
    | "boardResultStatusId" 
    | "sessionId" 
    | "classId" 
    | "sectionId" 
    | "shiftId" 
    | "programCourseId"
> {
    promotionStatus: PromotionStatusT;
    boardResultStatus: BoardResultStatusT;
    session: SessionT;
    class: ClassT;
    section: SectionT;
    shift: ShiftT;
    programCourse: ProgramCourseDto;
}

export interface PromotionClauseDto extends PromotionClauseT {
    classes: ClassT[]; // This is added to include the classes associated with the promotion clause, which can be derived from the promotion_clause_class_mapping table
}

export interface PromotionBuilderClauseClassMappingDto extends Omit<PromotionBuilderClauseClassMappingT, "promotionClauseClassId"> {
    class: ClassT; // ClassT is used here because promotionClauseClassId references a class in the promotion clause class mapping model
}

export interface PromotionBuilderClauseDto extends Omit<PromotionBuilderClauseMappingT, "promotionClauseId"> {
    promotionClause: PromotionClauseT;
    classes: PromotionBuilderClauseClassMappingDto[];
}

export interface PromotionBuilderDto extends Omit<PromotionBuilderT, "affiliationId" | "targetClassId"> {
    affiliation: AffiliationT;
    targetClass: ClassT;
    rules: PromotionBuilderClauseDto[];
}