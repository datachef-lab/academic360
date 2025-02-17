import { SubjectMetadataType } from "@/types/academics/subject-metadata.js";
import { SubjectMetadata, subjectMetadataModel } from "../models/subjectMetadata.model.js";
import { addStream, findStreamById, findStreamByName } from "./stream.service.js";
import { addSpecialization, findSpecializationById } from "@/features/resources/services/specialization.service.js";
import { Specialization, specializationModel } from "@/features/user/models/specialization.model.js";
import { Stream } from "../models/stream.model.js";
import { db } from "@/db/index.js";
import { and, eq, SQLWrapper } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";
import { readExcelFile } from "@/utils/readExcel.js";
import { SubjectRow } from "@/types/academics/subject-row.js";
import { subjectTypeModel, SubjectTypeModel } from "../models/subjectType.model.js";

const directoryName = path.dirname(fileURLToPath(import.meta.url));

export async function findAllSubjectMetadata() {
    const subjectMetadataArr = await db.select().from(subjectMetadataModel);

    const formattedSubjectMetadatas = (await Promise.all(subjectMetadataArr.map(async (sbj) => {
        return await subjectMetadataResponseFormat(sbj);
    }))).filter((sbj): sbj is SubjectMetadataType => sbj !== null);

    return formattedSubjectMetadatas;
}

export async function uploadSubjects(fileName: string): Promise<boolean> {
    // Read the file from the `/public/temp/` directory
    const filePath = path.resolve(directoryName, "../../../..", "public", "temp", fileName);

    const subjectArr = readExcelFile<SubjectRow>(filePath);

    for (let i = 0; i < subjectArr.length; i++) {

        const streamName = subjectArr[i].Stream.toUpperCase().trim().split(" ")[0];
        let foundStream = await findStreamByName(streamName);
        if (!foundStream) {
            foundStream = await addStream({
                name: streamName,
                duration: 6,
                numberOfSemesters: 6
            });

            if (!foundStream) {
                throw Error("Unable to add subjects, as stream cannot be created");
            }
        }

        let specialization: Specialization | null = null;
        if (subjectArr[i].Specialization) {
            const [tmpSpecialization] = await db.select().from(specializationModel).where(eq(specializationModel.name, subjectArr[i].Specialization?.toUpperCase().trim() as string));
            specialization = tmpSpecialization as Specialization;
            if (!tmpSpecialization) {
                specialization = await addSpecialization({
                    name: subjectArr[i].Specialization?.toUpperCase().trim() as string,
                });
            }
        }

        let subjectType: SubjectTypeModel | null = null;
        if (subjectArr[i]["Subject Type"]) {
            const [foundSubjectType] = await db.select().from(subjectTypeModel).where(eq(subjectTypeModel.name, subjectArr[i]["Subject Type"].toUpperCase().trim()));
            if (!foundSubjectType) {
                const [newSubjectType] = await db.insert(subjectTypeModel).values({ name: subjectArr[i]["Subject Type"].toUpperCase().trim() }).returning();
                subjectType = newSubjectType;
            }
        }

        await db.insert(subjectMetadataModel).values({
            streamId: foundStream.id as number,
            fullMarks: subjectArr[i]["Full Marks"] ? formatMarks(String(subjectArr[i]["Full Marks"])) : null,
            fullMarksInternal: subjectArr[i].IN ? formatMarks(String(subjectArr[i].IN)) : null,
            fullMarksTheory: subjectArr[i].TH ? formatMarks(String(subjectArr[i].TH)) : null,
            fullMarksTutorial: subjectArr[i].TU ? formatMarks(String(subjectArr[i].TU)) : null,
            fullMarksPractical: subjectArr[i].PR ? formatMarks(String(subjectArr[i].PR)) : null,
            fullMarksProject: subjectArr[i].PROJ ? formatMarks(String(subjectArr[i].PROJ)) : null,
            fullMarksViva: subjectArr[i].VIVA ? formatMarks(String(subjectArr[i].VIVA)) : null,

            isOptional: subjectArr[i].Optional ? true : false,
            subjectTypeId: subjectType ? subjectType.id as number : null,
            framework: subjectArr[i].Framework,
            category: subjectArr[i].Category,
            specializationId: specialization ? specialization.id as number : undefined,
            name: subjectArr[i]["Subject Name"],
            semester: subjectArr[i].Semester,
            credit: subjectArr[i].Credit,
            course: subjectArr[i].Course,
        } as SubjectMetadata).returning();
    }

    return true;
}

export async function findSubjectMetdataById(id: number): Promise<SubjectMetadataType | null> {
    const [foundSubjectMetadata] = await db.select().from(subjectMetadataModel).where(eq(subjectMetadataModel.id, id));

    const formattedSubjectMetadata = await subjectMetadataResponseFormat(foundSubjectMetadata);

    return formattedSubjectMetadata;
}

interface FindSubjectMetdataByFiltersProps {
    streamId: number;
    course: "HONOURS" | "GENERAL";
    semester: number;
    framework: "CCF" | "CBCS";
}

export async function findSubjectMetdataByFilters({ streamId, course, semester, framework }: FindSubjectMetdataByFiltersProps): Promise<SubjectMetadataType[]> {
    const foundSubjectMetadatas = await db.select().from(subjectMetadataModel).where(and(
        eq(subjectMetadataModel.streamId, streamId),
        eq(subjectMetadataModel.course, course),
        eq(subjectMetadataModel.semester, semester),
        eq(subjectMetadataModel.framework, framework),
    ));

    const formattedSubjectMetadatas = (await Promise.all(foundSubjectMetadatas.map(async (sbj) => {
        return await subjectMetadataResponseFormat(sbj);
    }))).filter((sbj): sbj is SubjectMetadataType => sbj !== null);

    return formattedSubjectMetadatas;
}

async function subjectMetadataResponseFormat(subjectMetadata: SubjectMetadata | null): Promise<SubjectMetadataType | null> {
    if (!subjectMetadata) {
        return null;
    }

    const { streamId, specializationId, subjectTypeId, ...props } = subjectMetadata;

    const stream = await findStreamById(streamId);

    let specialization: Specialization | null = null;
    if (specializationId) {
        specialization = await findSpecializationById(specializationId)
    }

    let subjectType: SubjectTypeModel | null = null;
    if (subjectTypeId) {
        const [foundSubjectType] = await db.select().from(subjectTypeModel).where(eq(subjectTypeModel.id, subjectTypeId));
        subjectType = foundSubjectType;
    }

    const formattedSubjectMetadata = {
        ...props,
        specialization,
        stream: stream as Stream,
        subjectType
    }

    return formattedSubjectMetadata;

}

function formatMarks(marks: string | null): number | null {
    if (!marks || marks.trim() === "") {
        return null;
    }

    const tmpMarks = Number(marks);
    return isNaN(tmpMarks) ? null : tmpMarks;
}