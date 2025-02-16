import { SubjectMetadataType } from "@/types/academics/subject-metadata.js";
import { SubjectMetadata, subjectMetadataModel } from "../models/subjectMetadata.model.js";
import { findStreamById } from "./stream.service.js";
import { findSpecializationById } from "@/features/resources/services/specialization.service.js";
import { Specialization } from "@/features/user/models/specialization.model.js";
import { Stream } from "../models/stream.model.js";
import { db } from "@/db/index.js";
import { eq } from "drizzle-orm";

export async function findSubjectMetdataById(id: number): Promise<SubjectMetadataType | null> {
    const [foundSubjectMetadata] = await db.select().from(subjectMetadataModel).where(eq(subjectMetadataModel.id, id));

    const formattedSubjectMetadata = await subjectMetadataResponseFormat(foundSubjectMetadata);

    return formattedSubjectMetadata;
}

async function subjectMetadataResponseFormat(subjectMetadata: SubjectMetadata | null): Promise<SubjectMetadataType | null> {
    if (!subjectMetadata) {
        return null;
    }

    const { streamId, specializationId, ...props } = subjectMetadata;

    const stream = await findStreamById(streamId);

    let specialization: Specialization | null = null;
    if (specializationId) {
        specialization = await findSpecializationById(specializationId)
    }

    const formattedSubjectMetadata = { ...props, specialization, stream: stream as Stream }

    return formattedSubjectMetadata;

}