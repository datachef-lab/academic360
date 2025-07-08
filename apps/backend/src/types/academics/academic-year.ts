import { AcademicYear } from "@/features/academics/models/academic-year.model";
import { Session } from "@/features/academics/models/session.model";

export interface AcademicYearDto extends Omit<AcademicYear, "sessionId"> {
  session: Session;
}
