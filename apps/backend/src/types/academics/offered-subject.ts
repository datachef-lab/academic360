import { OfferedSubject } from "@/features/academics/models/offeredSubject.model.js";
import { SubjectMetadataType } from "./subject-metadata";

export interface OfferedSubjectType extends Omit<OfferedSubject, "subjectMetadataId"> {
    subjectMetadata: SubjectMetadataType;
}