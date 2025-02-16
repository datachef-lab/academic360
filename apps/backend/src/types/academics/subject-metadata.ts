import { Stream } from "@/features/academics/models/stream.model";
import { SubjectMetadata } from "@/features/academics/models/subjectMetadata.model";
import { Specialization } from "@/features/user/models/specialization.model";

export interface SubjectMetadataType extends Omit<SubjectMetadata, "streamId" | "specializationId"> {
    stream: Stream;
    specialization: Specialization | null;
}