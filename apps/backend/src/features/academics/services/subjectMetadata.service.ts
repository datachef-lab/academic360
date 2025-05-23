import { SubjectMetadataType } from "@/types/academics/subject-metadata.js";
import { SubjectMetadata, subjectMetadataModel } from "../models/subjectMetadata.model.js";
import { addStream, findStreamById, findStreamByNameAndProgrammee } from "./stream.service.js";
import { addSpecialization, findSpecializationById } from "@/features/resources/services/specialization.service.js";
import { Specialization, specializationModel } from "@/features/user/models/specialization.model.js";
import { Stream, streamModel } from "../models/stream.model.js";
import { db } from "@/db/index.js";
import { and, eq, SQLWrapper } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";
import { readExcelFile } from "@/utils/readExcel.js";
import { SubjectRow } from "@/types/academics/subject-row.js";
import { subjectTypeModel, SubjectTypeModel } from "../models/subjectType.model.js";
import { addDegree, findDegreeById, findDegreeByName } from "@/features/resources/services/degree.service.js";
import { StreamType } from "@/types/academics/stream.js";
import { degreeModel } from "@/features/resources/models/degree.model.js";

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

    let degrees = await db.select().from(degreeModel);

    const subjectArr = await readExcelFile<SubjectRow>(filePath);

    for (let i = 0; i < subjectArr.length; i++) {

        const streamName = subjectArr[i].Stream.toUpperCase().trim().split(" ")[0];

        let foundDegree = degrees.find(ele => ele.name === streamName.toUpperCase().trim());
        if (!foundDegree) {
            const [newDegree] = await db.insert(degreeModel).values({ name: streamName.toUpperCase().trim(), level: streamName.startsWith('B') ? "UNDER_GRADUATE" : "POST_GRADUATE" }).returning();
            foundDegree = newDegree;

            degrees = await db.select().from(degreeModel);
        }

        let [foundStream] = await db.select().from(streamModel).where(and(
            eq(streamModel.degreeId, foundDegree.id),
            eq(streamModel.framework, subjectArr[i].Framework),
            eq(streamModel.degreeProgramme, subjectArr[i].Course),
        ));

        if (!foundStream) {
            const [newStream] = await db.insert(streamModel).values({
                degreeId: foundDegree.id as number,
                degreeProgramme: subjectArr[i].Course,
                framework: subjectArr[i].Framework,
            } as Stream).returning();

            if (!newStream) {
                throw Error("Unable to create new stream...!");
            }

            foundStream = newStream;

            if (!foundStream) {
                throw Error("Unable to create new stream...!");
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

        const whereConditions = [
            subjectTypeModel.irpName ?? eq(subjectTypeModel.irpName, subjectArr[i]["Subject Type as per IRP"].toUpperCase().trim()),
            subjectTypeModel.marksheetName ?? eq(subjectTypeModel.marksheetName, subjectArr[i]["Subject Type as per Marksheet"].toUpperCase().trim()),
        ].filter (ele => !ele);

        const [foundSubjectType] =
            await db
                .select()
                .from(subjectTypeModel)
                .where(
                    and(
                        ...whereConditions
                    )
                );
        if (!foundSubjectType) {
            const [newSubjectType] =
                await db
                    .insert(subjectTypeModel)
                    .values({
                        irpName: subjectArr[i]["Subject Type as per IRP"].toUpperCase().trim(),
                        marksheetName: subjectArr[i]["Subject Type as per Marksheet"].toUpperCase().trim(),
                    }).returning();
            subjectType = newSubjectType;
        }
        else {
            subjectType = foundSubjectType;
        }


        console.log("subjectType:", subjectType);

        // const whereConditions = [
        //     eq(subjectMetadataModel.streamId, foundStream.id),
        //     // eq(subjectMetadataModel.fullMarks, ),
        //     // eq(subjectMetadataModel.fullMarksInternal, ),
        //     // eq(subjectMetadataModel.fullMarksPractical, ),
        //     // eq(subjectMetadataModel.fullMarksTheory, ),
        //     // eq(subjectMetadataModel.fullMarksTutorial, ),
        //     // eq(subjectMetadataModel.fullMarksViva, ),
        //     // eq(subjectMetadataModel.fullMarksProject, ),
        //     eq(subjectMetadataModel.isOptional, !!subjectArr[i].Optional),
        //     // eq(subjectMetadataModel.subjectTypeId, subjectType),
        //     eq(subjectMetadataModel.category, subjectArr[i].Category),
        //     // eq(subjectMetadataModel.specializationId, ),
        // ]

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
            category: subjectArr[i].Category,
            specializationId: specialization ? specialization.id as number : undefined,
            marksheetCode: subjectArr[i]["Subject Code as per Marksheet"],
            irpCode: subjectArr[i]["Subject Code as per IRP"],
            irpName: subjectArr[i]["Subject Name as per Marksheet (also in IRP)"],
            name: subjectArr[i]["Subject Name as per Marksheet (also in IRP)"],
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
    semester: number;
}

export async function findSubjectMetdataByFilters({ streamId, semester }: FindSubjectMetdataByFiltersProps): Promise<SubjectMetadataType[]> {
    const foundSubjectMetadatas = await db.select().from(subjectMetadataModel).where(and(
        eq(subjectMetadataModel.streamId, streamId),
        eq(subjectMetadataModel.semester, semester),
    ));

    const formattedSubjectMetadatas = (await Promise.all(foundSubjectMetadatas.map(async (sbj) => {
        return await subjectMetadataResponseFormat(sbj);
    }))).filter((sbj): sbj is SubjectMetadataType => sbj !== null);

    return formattedSubjectMetadatas;
}

export async function findSubjectMetdataByStreamId(streamId: number) {
    const foundSubjectMetadatas = await db.select().from(subjectMetadataModel).where(eq(subjectMetadataModel.streamId, streamId));

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
        stream,
        subjectType
    } as SubjectMetadataType

    return formattedSubjectMetadata;

}

function formatMarks(marks: string | null): number | null {
    if (!marks || marks.trim() === "") {
        return null;
    }

    const tmpMarks = Number(marks);
    return isNaN(tmpMarks) ? null : tmpMarks;
}