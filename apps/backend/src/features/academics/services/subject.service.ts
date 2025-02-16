import { SubjectType } from "@/types/academics/subject.js";
import { Subject, subjectModel } from "../models/subject.model.js";
import { findSubjectMetdataById } from "./subjectMetadata.service.js";
import { SubjectMetadataType } from "@/types/academics/subject-metadata.js";
import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";

export async function findSubjectById(id: number): Promise<SubjectType | null> {
    const [foundSubject] = await db.select().from(subjectModel).where(eq(subjectModel.id, id));

    const formattedSubject = await subjectResponseFormat(foundSubject);

    return formattedSubject;
}

export async function findSubjectsByMarksheetId(marksheetId: number): Promise<SubjectType | null> {
    const [foundSubject] = await db.select().from(subjectModel).where(eq(subjectModel.marksheetId, marksheetId));

    const formattedSubject = await subjectResponseFormat(foundSubject);

    return formattedSubject;
}

export async function subjectResponseFormat(subject: Subject | null): Promise<SubjectType | null> {
    if (!subject) {
        return null;
    }

    const { subjectMetadataId, ...props } = subject;

    const subjectMetadata = await findSubjectMetdataById(subjectMetadataId as number);

    const formattedSubject: SubjectType = { ...props, subjectMetadata: subjectMetadata as SubjectMetadataType };

    return formattedSubject;
}