import { db } from "@/db/index.js";
import { OfferedSubjectType } from "@/types/academics/offered-subject.js";
import { OfferedSubject, offeredSubjectModel } from "../models/offeredSubject.model.js";
import { eq } from "drizzle-orm";
import { findSubjectMetdataById } from "./subjectMetadata.service.js";
import { SubjectMetadataType } from "@/types/academics/subject-metadata.js";

export async function findOfferedSubjectById(id: number): Promise<OfferedSubjectType | null> {
    const [foundOfferedSubject] = await db.select().from(offeredSubjectModel).where(eq(offeredSubjectModel.id, id));

    const formattedOfferedSubject = await offeredSubjectFormatResponse(foundOfferedSubject);

    return formattedOfferedSubject;
}

export async function offeredSubjectFormatResponse(offeredSubject: OfferedSubject | null): Promise<OfferedSubjectType | null> {
    if (!offeredSubject) {
        return null;
    }

    const { subjectMetadataId, ...props } = offeredSubject;

    const subjectMetadata = await findSubjectMetdataById(subjectMetadataId);

    return {
        ...props,
        subjectMetadata: subjectMetadata as SubjectMetadataType
    }
}