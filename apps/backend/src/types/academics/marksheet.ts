import { Marksheet } from "@/features/academics/models/marksheet.model";
import { SubjectType } from "./subject";
import { AcademicIdentifier } from "@/features/user/models/academicIdentifier.model";
import { UserType } from "../user/user";

export interface MarksheetType extends Omit<Marksheet, "createdByUserId" | "updatedByUserId"> {
    subjects: SubjectType[];
    createdByUser: UserType;
    updatedByUser: UserType;
    academicIdentifier: AcademicIdentifier;

}