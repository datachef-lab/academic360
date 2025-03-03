import { db, mysqlConnection } from "@/db/index.js";
import { OldBatchPaper } from "@/types/old-data/old-batch-paper.js";
import { subjectMetadataModel } from "../models/subjectMetadata.model.js";
import { and, eq } from "drizzle-orm";
import { OldSubjectType } from "@/types/old-data/old-subject-type.js";
import { OldSubject } from "@/types/old-data/old-subject.js";
import { processClass, processCourse, processSection, processShift } from "./batch.service.js";
import { OldBatch } from "@/types/old-data/old-batch.js";
import { batchModel } from "../models/batch.model.js";
import { subjectTypeModel } from "../models/subjectType.model.js";
import { OldPaperList } from "@/types/old-data/old-paper-list.js";
import { OldPaperSubject } from "@/types/old-data/old-paper-subject.js";
import { BatchPaper, batchPaperModel } from "../models/batchPaper.model.js";
import { paperModel } from "../models/paper.model.js";
import { offeredSubjectModel } from "../models/offeredSubject.model.js";
import { OldStudentPaper } from "@/types/old-data/old-student-paper.js";
import { academicIdentifierModel } from "@/features/user/models/academicIdentifier.model.js";
import { OldStudent } from "@/types/old-student.js";
import { findStudentById } from "@/features/user/services/student.service.js";
import { studentPaperModel } from "../models/studentPaper.model.js";
import { BatchPaperType } from "@/types/academics/batch-paper.js";
import { findPaperById } from "./paper.service.js";
import { PaperType } from "@/types/academics/paper.js";

const BATCH_SIZE = 500;

const oldBatchPaperTable = "studentpaperlinkingpaperlist";
const oldSubjectTypeTable = "subjecttype";
const oldSubjectTable = "subject";
const oldBatchTable = "studentpaperlinkingmain";
const oldStudentPaperTable = "studentpaperlinkingstudentlist";
const oldCourseTable = "course";
const oldClassTable = "classes";
const oldSectionTable = "section";
const oldShiftTable = "shift";
const oldPaperTable = "paperlist";
const oldPaperSubjectTable = "papersubject";

async function getMappedSubjectMetadata({ subjectTypeId, subjectId }: { subjectTypeId: number, subjectId: number }) {
    const [oldSubjectType] = (
        await mysqlConnection
            .query(`
                    SELECT * 
                    FROM ${oldSubjectTypeTable} 
                    WHERE id = ${subjectTypeId}`
            ) as [OldSubjectType[], any]
    )[0];
    console.log("in getMappedSubjectMetadata(), oldSubjectType:", oldSubjectType.subjectTypeName.trim().toUpperCase())
    const [foundSubjectType] = await db.select().from(subjectTypeModel).where(eq(subjectTypeModel.irpName, oldSubjectType.subjectTypeName.trim().toUpperCase()));

    if (!foundSubjectType) {
        console.log(`Not found subject type for irpName: ${oldSubjectType.subjectTypeName.trim().toUpperCase()}`)
        return null;
    }

    console.log("foundSubjectType:", foundSubjectType);
    const [oldSubject] = (
        await mysqlConnection
            .query(`
                    SELECT * 
                    FROM ${oldSubjectTable} 
                    WHERE id = ${subjectId}`
            ) as [OldSubject[], any]
    )[0];

    console.log("Old subject:", oldSubject);

    const whereConditions = [
        eq(subjectMetadataModel.subjectTypeId, foundSubjectType.id),
        // eq(subjectMetadataModel.irpCode, oldSubject.univcode),
    ];

    if (oldSubject.univcode) {
        whereConditions.push(
            eq(subjectMetadataModel.irpCode, oldSubject.univcode?.trim().toUpperCase())
        );
    }

    const [foundSubjectMetadata] =
        await db
            .select()
            .from(subjectMetadataModel)
            .where(and(...whereConditions));

    console.log('found subjectMetadata:', foundSubjectMetadata);
    return foundSubjectMetadata;
}

async function processPaper(oldBatchPaper: OldBatchPaper) {
    console.log(oldBatchPaper.paperId)
    if (!oldBatchPaper.paperId) {
        return null;
    }

    const [oldPaper] = (
        await mysqlConnection
            .query(`
                    SELECT * 
                    FROM ${oldPaperTable} 
                    WHERE id = ${oldBatchPaper.paperId}`
            ) as [OldPaperList[], any]
    )[0];

    const [oldPaperSubject] = (
        await mysqlConnection
            .query(`
                    SELECT * 
                    FROM ${oldPaperSubjectTable} 
                    WHERE id = ${oldPaper.parent_id}`
            ) as [OldPaperSubject[], any]
    )[0];

    console.log("in processPaper(), oldPaperSubject:", oldPaperSubject, "from oldBatchPaper:", oldBatchPaper);



    const foundSubjectMetadata = await getMappedSubjectMetadata(oldPaperSubject);

    if (!foundSubjectMetadata) {
        return null;
    }

    let [foundOfferedSubject] = await db
        .select()
        .from(offeredSubjectModel)
        .where(eq(offeredSubjectModel.subjectMetadataId, foundSubjectMetadata.id));

    if (!foundOfferedSubject) {
        const [newOfferedSubject] = await db.
            insert(offeredSubjectModel)
            .values({
                subjectMetadataId: foundSubjectMetadata.id as number
            })
            .returning();
        foundOfferedSubject = newOfferedSubject;
    }


    // Format the mode of paper
    let mode: "THEORETICAL" | "PRACTICAL" | "VIVA" | "ASSIGNMENT" | "PROJECT" | "MCQ" | null = null;
    if (oldPaper.isPractical) {
        mode = "PRACTICAL";
    }
    else if (oldPaper.paperType === "Theoretical") {
        mode = "THEORETICAL"
    }

    const whereConditions = [
        eq(paperModel.offeredSubjectId, foundOfferedSubject.id),
        eq(paperModel.name, oldPaper.paperName.trim()),
        eq(paperModel.shortName, oldPaper.paperShortName.trim()),
    ];

    if (mode) {
        whereConditions.push(
            eq(paperModel.mode, mode)
        )
    }

    if (oldPaper.displayName) {
        whereConditions.push(
            eq(paperModel.displayName, oldPaper.displayName)
        );
    }

    const [foundPaper] = await db
        .select()
        .from(paperModel)
        .where(and(...whereConditions));

    if (foundPaper) {
        return foundPaper;
    }

    const [newPaper] = await db.insert(paperModel).values({
        offeredSubjectId: foundOfferedSubject.id,
        mode,
        name: oldPaper.paperName.trim(),
        shortName: oldPaper.paperShortName.trim(),
        displayName: oldPaper.displayName ? oldPaper.displayName.trim().toUpperCase() : null,
    }).returning();

    console.log("in processPaper(), created new paper:", newPaper);

    return newPaper;
}

async function getBatch(oldBatchPaper: OldBatchPaper) {
    const [oldBatch] = (
        await mysqlConnection
            .query(`
                    SELECT * 
                    FROM ${oldBatchTable} 
                    WHERE id = ${oldBatchPaper.parent_id}`
            ) as [OldBatch[], any]
    )[0];

    if (!oldBatch) {
        return null;
    }

    const course = await processCourse(oldBatch.courseId);
    const academicClass = await processClass(oldBatch.classId);
    const shift = await processShift(oldBatch.shiftId);
    const section = oldBatch.sectionId ? await processSection(oldBatch.sectionId) : null;

    const whereConditions = [
        eq(batchModel.courseId, course.id as number),
        eq(batchModel.classId, academicClass.id as number),
        eq(batchModel.shiftId, shift.id as number),
        eq(batchModel.session, oldBatch.sessionId as number),
    ];

    if (section) {
        whereConditions.push(
            eq(batchModel.sectionId, section.id as number)
        );
    }

    const [foundBatch] = await db
        .select()
        .from(batchModel)
        .where(and(...whereConditions));

    if (!foundBatch) {
        return null;
    }

    return foundBatch;
}

async function processBatchPaper(oldBatchPaper: OldBatchPaper) {
    const foundBatch = await getBatch(oldBatchPaper);

    if (!foundBatch) {
        return null;
    }

    console.log("in processBatchPaper(), oldBatchPaper:", oldBatchPaper);

    const foundPaper = await processPaper(oldBatchPaper);
    if (!foundPaper) {
        console.log(`Not found paper for oldBatchPaper.id:`, oldBatchPaper.ID);
        return null;
    }

    const [foundBatchPaper] = await db
        .select()
        .from(batchPaperModel)
        .where(
            and(
                eq(batchPaperModel.batchId, foundBatch.id),
                eq(batchPaperModel.paperId, foundPaper.id)
            )
        );

    if (foundBatchPaper) {
        // Add the student's paper
        await processStudentPaper(oldBatchPaper, foundBatchPaper);
        return foundBatchPaper;
    }

    const [newBatchPaper] = await db
        .insert(batchPaperModel)
        .values({
            batchId: foundBatch.id,
            paperId: foundPaper.id,
        })
        .returning();

    console.log("created new batch:", newBatchPaper.id);

    // Add the student's paper
    await processStudentPaper(oldBatchPaper, newBatchPaper);

    return newBatchPaper;
}

async function processStudentPaper(oldBatchPaper: OldBatchPaper, batchPaper: BatchPaper) {

    const [rows] = await mysqlConnection.query(`
        SELECT COUNT(*) AS totalRows 
        FROM ${oldStudentPaperTable} 
        WHERE parent_id = ${oldBatchPaper.ID}
    `);
    const { totalRows } = (rows as { totalRows: number }[])[0];

    const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches

    for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
        const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

        console.log(`\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);

        const [rows] = await mysqlConnection.query(`
            SELECT * 
            FROM ${oldStudentPaperTable} 
            WHERE parent_id = ${oldBatchPaper.ID}
            LIMIT ${BATCH_SIZE} OFFSET ${offset}
        `) as [OldStudentPaper[], any];

        const oldDataArr = rows as OldStudentPaper[];

        for (let i = 0; i < oldDataArr.length; i++) {
            // Process the data
            // 1. Fetch the oldStudent
            const [oldStudent] = (
                await mysqlConnection
                    .query(`
                            SELECT * 
                            FROM studentpersonaldetails
                            WHERE id = ${oldDataArr[0].studentId}`
                    ) as [OldStudent[], any]
            )[0];

            // 2. Fetch the student from academic360-db
            const [foundAcademicIdentifier] = await db
                .select()
                .from(academicIdentifierModel)
                .where(eq(academicIdentifierModel.uid, oldStudent.codeNumber.trim()));

            if (!foundAcademicIdentifier) {
                continue;
            }

            const foundStudent = await findStudentById(foundAcademicIdentifier.studentId);

            if (!foundStudent) {
                continue;
            }

            // 3. Check if the entry already exist
            const [foundStudentPaper] = await db
                .select()
                .from(studentPaperModel)
                .where(
                    and(
                        eq(studentPaperModel.batchPaperId, batchPaper.id as number),
                        eq(studentPaperModel.studentId, foundStudent.id as number),
                    )
                );

            if (foundStudentPaper) {
                continue;
            }

            // 4. Insert the student's paper entry
            await db
                .insert(studentPaperModel)
                .values({
                    batchPaperId: batchPaper.id as number,
                    studentId: foundStudent.id as number,
                })
                .returning();

            console.log(`Batch: ${currentBatch}/${totalBatches} | Done: ${i + 1}/${oldDataArr.length} | Total Entries: ${totalRows}`);
        }

    }
}

export async function loadPaperSubjects() {
    console.log(`\n\nCounting rows from table ${oldBatchPaperTable}...`);

    const subjectTypeArr = await db.select().from(subjectTypeModel);

    const subjectMetadataArr = await db.select().from(subjectMetadataModel);

    for (let i = 0; i < subjectMetadataArr.length; i++) {
        const subjectType = subjectTypeArr.find(ele => ele.id === subjectMetadataArr[i].id);

        if (!subjectType) continue;

        const [oldSubjectTypeResult] = (
            await mysqlConnection.query(`
                SELECT * 
                FROM ${oldSubjectTypeTable} 
                WHERE LOWER(subjectTypeName) LIKE LOWER(?)
            `, [`%${subjectType.irpName}%`]) as [OldSubjectType[], any]
        );

        if (oldSubjectTypeResult.length === 0) continue;
        const oldSubjectType = oldSubjectTypeResult[0];


        const [oldSubjectResult] = (
            await mysqlConnection.query(`
                SELECT * 
                FROM ${oldSubjectTable} 
                WHERE LOWER(subjectName) LIKE LOWER(?)
            `, [`%${subjectMetadataArr[i].irpName}%`]) as [OldSubject[], any]
        );

        if (oldSubjectResult.length === 0) continue;
        const oldSubject = oldSubjectResult[0];


        console.log(oldSubjectType, oldSubject);

        const [rows] = await mysqlConnection.query(`
            SELECT COUNT(*) AS totalRows 
            FROM ${oldBatchPaperTable} 
            WHERE subjectTypeId = ${oldSubjectType.id} AND subjectId = ${oldSubject.id}
        `);
        const { totalRows } = (rows as { totalRows: number }[])[0];

        const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches

        for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
            const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

            console.log(`\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);

            const [rows] = await mysqlConnection.query(`
                SELECT * FROM ${oldBatchPaperTable} 
                WHERE subjectTypeId = ${oldSubjectType.id} AND subjectId = ${oldSubject.id}
                LIMIT ${BATCH_SIZE} OFFSET ${offset}
            `) as [OldBatchPaper[], any];
            const oldDataArr = rows as OldBatchPaper[];

            for (let i = 0; i < oldDataArr.length; i++) {
                try {
                    await processBatchPaper(oldDataArr[i]);
                } catch (error) {
                    console.log(error)
                }
                console.log(`Batch: ${currentBatch}/${totalBatches} | Done: ${i + 1}/${oldDataArr.length} | Total Entries: ${totalRows}`);

            }
        }
    }

    // const [rows] = await mysqlConnection.query(`SELECT COUNT(*) AS totalRows FROM ${oldBatchPaperTable}`);
    // const { totalRows } = (rows as { totalRows: number }[])[0];

    // const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches

    // console.log(`\nTotal rows to migrate: ${totalRows}`);

    // for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
    //     const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

    //     console.log(`\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);
    //     const [rows] = await mysqlConnection.query(`SELECT * FROM ${oldBatchPaperTable} LIMIT ${BATCH_SIZE} OFFSET ${offset}`) as [OldBatchPaper[], any];
    //     const oldDataArr = rows as OldBatchPaper[];

    //     for (let i = 0; i < oldDataArr.length; i++) {
    //         try {
    //             await processBatchPaper(oldDataArr[i]);
    //         } catch (error) {
    //             console.log(error)
    //         }
    //         console.log(`Batch: ${currentBatch}/${totalBatches} | Done: ${i + 1}/${oldDataArr.length} | Total Entries: ${totalRows}`);

    //     }
    // }
}

export async function batchPaperFormatResponse(batchPaper: BatchPaper | null): Promise<BatchPaperType | null> {
    if (!batchPaper) {
        return null;
    }

    const { paperId, ...props } = batchPaper;

    const foundPaper = await findPaperById(paperId);

    const formattedBatchPaper: BatchPaperType = {
        ...props,
        paper: foundPaper as PaperType
    }

    return formattedBatchPaper;
}