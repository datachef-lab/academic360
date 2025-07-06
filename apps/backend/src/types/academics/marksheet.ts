import { Marksheet } from "@/features/academics/models/marksheet.model.js";
import { SubjectType } from "./subject.js";
import { AcademicIdentifier } from "@/features/user/models/academicIdentifier.model.js";
import { UserType } from "../user/user.js";
import { AcademicIdentifierType } from "../user/academic-identifier.js";
import { Class } from "@/features/academics/models/class.model.js";

export interface MarksheetType extends Omit<Marksheet, "createdByUserId" | "updatedByUserId" | "classId"> {
    name: string;
    class: Class;
    subjects: SubjectType[];
    createdByUser: UserType;
    updatedByUser: UserType;
    academicIdentifier: AcademicIdentifierType;

}