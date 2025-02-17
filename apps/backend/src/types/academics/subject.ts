import { Subject } from "@/features/academics/models/subject.model";
import { SubjectMetadataType } from "./subject-metadata";

export interface SubjectType extends Omit<Subject, "subjectMetadataId"> {
    subjectMetadata: SubjectMetadataType;
}