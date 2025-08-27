import { Batch, Class, Section, Session, Shift } from "@/db/schema";
import { CourseDto, SubjectMetadataDto } from "../academics";

export interface BatchDto extends Omit<Batch, "academicYearId" | "courseId" | "classId" | "sectionId" | "shiftId" | "sessionId"> {
    course: CourseDto;
    class: Class;
    section: Section;
    shift: Shift;
    session: Session;
    subjects: SubjectMetadataDto[];
}