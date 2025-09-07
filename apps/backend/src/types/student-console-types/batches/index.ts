// import { Batch, Class, Section, Session, Shift } from "@/db/schema";
import { Batch } from "@repo/db/schemas/models/academics";
// import { CourseDto, SubjectMetadataDto } from "../academics";
import { Class } from "@repo/db/schemas/models/academics";
import { Section } from "@repo/db/schemas/models/academics";
import { Shift } from "@repo/db/schemas/models/academics";
import { Session } from "@repo/db/schemas/models/academics";
import { CourseDto } from "@/types/course-design/index.type";

export interface BatchDto
  extends Omit<
    Batch,
    | "academicYearId"
    | "courseId"
    | "classId"
    | "sectionId"
    | "shiftId"
    | "sessionId"
  > {
  course: CourseDto;
  class: Class;
  section: Section;
  shift: Shift;
  session: Session;
  // subjects: SubjectMetadataDto[];
}
