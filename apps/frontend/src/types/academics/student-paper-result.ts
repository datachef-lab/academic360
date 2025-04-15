import { AcademicIdentifier } from "../user/academic-identifier";

export interface StudentPaperResultType {
    course: Course | null | undefined;
    academicClass: Class | null | undefined;
    section: Section | null | undefined;
    shift: Shift | null | undefined;
    session: Session | null | undefined;
    academicIdentifier: AcademicIdentifier;
    paper: Paper | null | undefined;
}