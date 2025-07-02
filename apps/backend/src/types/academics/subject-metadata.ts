// import { Stream } from "@/features/academics/models/stream.model";
import { Class } from "@/features/academics/models/class.model";
import { SubjectMetadata } from "@/features/academics/models/subjectMetadata.model";
import { SubjectTypeModel } from "@/features/academics/models/subjectType.model";
import { Degree } from "@/features/resources/models/degree.model";
import { Specialization } from "@/features/user/models/specialization.model";
// import { StreamType } from "./stream";

export interface SubjectMetadataType extends Omit<SubjectMetadata, "degreeId" | "classId" | "specializationId" | "subjectTypeId"> {
    degree: Degree;
    class: Class;
    specialization?: Specialization | null;
    subjectType: SubjectTypeModel | null;
}