import {    ProgramCourseDto } from "../course-design";;
import { Batch, ClassT, SectionT, SessionT, ShiftT } from "../../schemas/models/academics";
import { BoardResultStatusT, PromotionStatusT, PromotionT } from "@/schemas";

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