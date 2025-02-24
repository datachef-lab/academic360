import { Stream } from "@/features/academics/models/stream.model";
import { SubjectMetadata } from "@/features/academics/models/subjectMetadata.model";
import { SubjectTypeModel } from "@/features/academics/models/subjectType.model";
import { Specialization } from "@/features/user/models/specialization.model";
import { StreamType } from "./stream";

export interface SubjectMetadataType extends Omit<SubjectMetadata, "streamId" | "specializationId" | "subjectTypeId"> {
    stream: StreamType;
    specialization?: Specialization | null;
    subjectType: SubjectTypeModel | null;
}