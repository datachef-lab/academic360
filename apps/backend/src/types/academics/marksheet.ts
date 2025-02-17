import { Marksheet } from "@/features/academics/models/marksheet.model";
import { SubjectType } from "./subject";
import { AcademicIdentifier } from "@/features/user/models/academicIdentifier.model";

export interface MarksheetType extends Marksheet {
    academicIdentifier: AcademicIdentifier;
    subjects: SubjectType[];
}