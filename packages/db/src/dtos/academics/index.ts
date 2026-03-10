import { AcademicYearT, SessionT } from "@/schemas";

export interface SessionDto extends Omit<SessionT, "academicYearId"> {
    academicYear: AcademicYearT;
}