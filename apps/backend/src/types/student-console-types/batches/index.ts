// import { Batch, Class, Section, Session, Shift } from "@/db/schema";
import { Batch } from "@/features/academics/models/batch.model";
// import { CourseDto, SubjectMetadataDto } from "../academics";
import { Class } from "@/features/academics/models/class.model";
import { Section } from "@/features/academics/models/section.model";
import { Shift } from "@/features/academics/models/shift.model";
import { Session } from "@/features/academics/models/session.model";
import { CourseDto } from "@/types/course-design/index.type";

export interface BatchDto extends Omit<Batch, "academicYearId" | "courseId" | "classId" | "sectionId" | "shiftId" | "sessionId"> {
    course: CourseDto;
    class: Class;
    section: Section;
    shift: Shift;
    session: Session;
    // subjects: SubjectMetadataDto[];
}