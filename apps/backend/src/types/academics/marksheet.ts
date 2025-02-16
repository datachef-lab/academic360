import { Marksheet } from "@/features/academics/models/marksheet.model";
import { SubjectType } from "./subject";

export interface MarksheetType extends Marksheet {
    subjects: SubjectType[];
}