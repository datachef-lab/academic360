import { Marksheet } from "@/features/academics/models/marksheet.model.js";
import { SubjectType } from "./subject.js";
import { AcademicIdentifier } from "@/features/user/models/academicIdentifier.model.js";
import { UserType } from "../user/user.js";
import { AcademicIdentifierType } from "../user/academic-identifier.js";

export interface MarksheetType extends Omit<Marksheet, "createdByUserId" | "updatedByUserId"> {
    name: string;
    subjects: SubjectType[];
    createdByUser: UserType;
    updatedByUser: UserType;
    academicIdentifier: AcademicIdentifierType;

}