import { CourseDto, ProgramCourseDto } from "../course-design";;
import { Batch, ClassT, SectionT, SessionT, ShiftT } from "../../schemas/models/academics";

export interface BatchDto extends Omit<Batch, "programCourseId" | "classId" | "sectionId" | "shiftId" | "sessionId"> {
    programCourse: ProgramCourseDto;
    class: ClassT;
    section: SectionT;
    shift: ShiftT;
    session: SessionT;
}