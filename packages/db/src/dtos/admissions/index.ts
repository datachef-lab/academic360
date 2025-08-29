import { AdmissionCourseDetails, AdmissionCourseDetailsT, Class, ClassT, EligibilityCriteria, EligibilityCriteriaT, Shift, ShiftT, Stream, StudentCategory, StudentCategoryT } from "@/schemas";
import { ProgramCourseDto } from "../course-design";

export interface AdmissionCourseDetailsDto extends Omit<AdmissionCourseDetailsT, "streamId" | "programCourseId" | "classId" | "shiftId" | "eligibilityCriteriaId" | "studentCategoryId"> {
    stream: Stream | null;
    programCourse: ProgramCourseDto | null;
    class: ClassT | null;
    shift: ShiftT | null;
    eligibilityCriteria: EligibilityCriteriaT | null;
    studentCategory: StudentCategoryT | null;
}