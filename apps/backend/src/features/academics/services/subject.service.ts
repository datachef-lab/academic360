import { SubjectType } from "@/types/academics/subject.js";
import { Subject, subjectModel } from "../models/subject.model.js";
import { findSubjectMetdataByFilters, findSubjectMetdataById } from "./subjectMetadata.service.js";
import { SubjectMetadataType } from "@/types/academics/subject-metadata.js";
import { eq, and } from "drizzle-orm";
import { db } from "@/db/index.js";
import { formatMarks, getLetterGrade } from "@/utils/helper.js";

export async function commonSubjectOperation(subject: SubjectType, subjectMetadata: SubjectMetadataType): Promise<Subject> {
    let newSubject: Subject = {
        marksheetId: subject.marksheetId,
        subjectMetadataId: subjectMetadata.id,
        year1: subject.year1,
        year2: subject.year2,
        internalMarks: subject.internalMarks,
        theoryMarks: subject.theoryMarks,
        practicalMarks: subject.practicalMarks,

        totalMarks: subject.totalMarks,
        ngp: subject.ngp ? formatMarks(subject.ngp)?.toString() : null,
        tgp: subject.tgp ? formatMarks(subject.tgp)?.toString() : null,
    };

    // Calculate NGP and set the letterGrade
    if (newSubject.totalMarks) {
        let subjectPercent = (newSubject.totalMarks * 100) / subjectMetadata.fullMarks;
        // Calculate NGP for each subject as % marks / 10 for each subject
        newSubject.ngp = (subjectPercent / 10).toString();
        // Mark the letterGrade for each subject
        newSubject.letterGrade = await getLetterGrade(subject);

        if (subjectPercent < 30) {
            subject.status = "FAIL";
        }
        else {
            subject.status = "PASS";
        }
    }

    return newSubject;
}

export async function addSubject(subject: SubjectType): Promise<SubjectType | null> {
    const subjectMetadata = await findSubjectMetdataById(subject.subjectMetadata.id as number);
    if (!subjectMetadata) {
        return null;
    }

    let newSubject = await commonSubjectOperation(subject, subjectMetadata);

    // Insert the subject
    const [createdSubject] = await db.insert(subjectModel).values(newSubject).returning();

    const formattedSubject = await subjectResponseFormat(createdSubject);

    return formattedSubject;
}

export async function saveSubject(id: number, subject: SubjectType): Promise<SubjectType | null> {
    let [foundSubject] = await db.select().from(subjectModel).where(eq(subjectModel.id, id));

    if (!foundSubject) {
        return null;
    }

    const foundSubjectMetadata = await findSubjectMetdataById(foundSubject.subjectMetadataId as number);
    if (!foundSubjectMetadata) {
        return null;
    }

    const tmpSubject = await commonSubjectOperation(subject, foundSubjectMetadata);

    const [updatedSubject] = await db.update(subjectModel).set(tmpSubject).where(eq(subjectModel.id, id)).returning();

    const formattedSubject = await subjectResponseFormat(updatedSubject);

    return formattedSubject;
}

export async function findSubjectById(id: number): Promise<SubjectType | null> {
    const [foundSubject] = await db.select().from(subjectModel).where(eq(subjectModel.id, id));

    const formattedSubject = await subjectResponseFormat(foundSubject);

    return formattedSubject;
}

export async function findSubjectsByMarksheetId(marksheetId: number): Promise<SubjectType[]> {
    const subjects = await db.select().from(subjectModel).where(eq(subjectModel.marksheetId, marksheetId));

    const formattedSubjects = (await Promise.all(subjects.map(async (subject) => {
        return await subjectResponseFormat(subject);
    }))).filter((subject): subject is SubjectType => subject !== null);

    return formattedSubjects;
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