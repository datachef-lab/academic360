// import { db, mysqlConnection } from "@/db/index.js";
// import { OldBatchPaper } from "@/types/old-data/old-batch-paper.js";
// import { SubjectMetadata, subjectMetadataModel } from "../models/subjectMetadata.model.js";
// import { and, eq } from "drizzle-orm";
// import { OldSubjectType } from "@/types/old-data/old-subject-type.js";
// import { OldSubject } from "@/types/old-data/old-subject.js";
// import { processBatch, processClass, processCourse, processSection, processSession, processShift } from "./batch.service.js";
// import { OldBatch } from "@/types/old-data/old-batch.js";
// import { Batch, batchModel } from "../models/batch.model.js";
// import { subjectTypeModel } from "../models/subjectType.model.js";
// import { OldPaperList } from "@/types/old-data/old-paper-list.js";
// import { OldPaperSubject } from "@/types/old-data/old-paper-subject.js";
// import { BatchPaper, batchPaperModel } from "../models/batchPaper.model.js";
// import { paperModel } from "../models/paper.model.js";
// import { offeredSubjectModel } from "../models/offeredSubject.model.js";
// import { OldStudentPaper } from "@/types/old-data/old-student-paper.js";
// import { academicIdentifierModel } from "@/features/user/models/academicIdentifier.model.js";
// import { OldStudent } from "@/types/old-student.js";
// import { findStudentById } from "@/features/user/services/student.service.js";
// import { studentPaperModel } from "../models/studentPaper.model.js";
// import { BatchPaperType } from "@/types/academics/batch-paper.js";
// import { findPaperById } from "./paper.service.js";
// import { PaperType } from "@/types/academics/paper.js";
// import { Session, sessionModel } from "../models/session.model.js";
// import { OldSession } from "@/types/academics/session.js";
// import { Stream, streamModel } from "../models/stream.model.js";
// import { findDegreeByName } from "@/features/resources/services/degree.service.js";
// import { addStream } from "./stream.service.js";
// import { Degree, degreeModel } from "@/features/resources/models/degree.model.js";
// import { number } from "zod";

import { db, mysqlConnection } from "@/db/index.js";
import { SubjectMetadata, subjectMetadataModel } from "../models/subjectMetadata.model.js";
import { SubjectType } from "@/types/academics/subject.js";

import { SubjectTypeModel, subjectTypeModel } from "../models/subjectType.model.js";
import { and, eq, ilike, inArray } from "drizzle-orm";
import { SubjectMetadataType } from "@/types/academics/subject-metadata.js";
import { OldSubjectType } from "@/types/old-data/old-subject-type.js";
import { OldSubject } from "@/types/old-data/old-subject.js";
import { processBatch } from "./batch.service.js";
import { OldBatch } from "@/types/old-data/old-batch.js";
import { OldStudentPaper } from "@/types/old-data/old-student-paper.js";
import { OldStudent } from "@/types/old-student.js";
import { academicIdentifierModel } from "@/features/user/models/academicIdentifier.model.js";
import { studentModel } from "@/features/user/models/student.model.js";
import { BatchPaper, batchPaperModel } from "../models/batchPaper.model.js";
import { Batch } from "../models/batch.model.js";
import { studentPaperModel } from "../models/studentPaper.model.js";

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


async function getOlderSubjectMappedByNew(subjectMetadata: SubjectMetadata) {
    const [foundSubjectType] = await db
        .select()
        .from(subjectTypeModel)
        .where(
            eq(subjectTypeModel.id, subjectMetadata.subjectTypeId!)
        );

    // Fetch the older subject type
    const [[oldSubjectType]] = await mysqlConnection.query(
        `SELECT * FROM ?? WHERE LOWER(subjectTypeName) LIKE LOWER(?)`,
        [oldSubjectTypeTable, foundSubjectType.irpName]
    ) as [OldSubjectType[], any];

    if (!oldSubjectType) {
        console.log("Old subject not found by finding from new irp sbjtyp name:", foundSubjectType.irpName);
        return null;
    }

    // Fetch the older subject
    const [[oldSubject]] = await mysqlConnection.query(
        `SELECT * FROM ?? WHERE LOWER(univcode) LIKE LOWER(?) AND subjectTypeId = ?`,
        [oldSubjectTable, subjectMetadata.irpCode, oldSubjectType.id]
    ) as [OldSubject[], any];

    if (!oldSubject) {
        console.log("Old subject not found by finding from new irp sbj name:", subjectMetadata.irpCode, foundSubjectType.irpName);
        return null;
    }

    return { oldSubject, oldSubjectType };
}

async function processEachBatchPaperAssociation(oldBatchPaper: {
    oldBatchIdFk: number;
    oldBatchPaperId: number;
}, batchPaper: BatchPaper, batch: Batch) {
    const [rows] = await mysqlConnection.query(`
        SELECT COUNT(*) AS totalRows
        FROM ${oldStudentPaperTable}
        WHERE parent_id = ${oldBatchPaper.oldBatchPaperId};
    `);

    const { totalRows } = (rows as { totalRows: number }[])[0];

    const totalBatch = Math.ceil(totalRows / BATCH_SIZE);

    console.log("in processEachBatchPaperAssociation(), totalRows:", totalRows);
    for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
        const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

        const [oldStudentBatchPaperAssociation] = await mysqlConnection.query(`
            SELECT
                sp.studentId AS oldStudentIdFk,
                s.codeNumber AS uid
            FROM
                studentpaperlinkingstudentlist sp,
                studentpersonaldetails s
            WHERE
                sp.parent_id = ${oldBatchPaper.oldBatchPaperId}
                AND sp.studentId = s.id
            LIMIT ${BATCH_SIZE} 
            OFFSET ${offset};
        `) as [{ oldStudentIdFk: number, uid: string }[], any];

        console.log(`in student-association(), oldStudentBatchPaperAssociation: ${oldStudentBatchPaperAssociation.length}`);

        const tmpArr = await db
            .select()
            .from(academicIdentifierModel)
            .where(
                inArray(
                    academicIdentifierModel.uid,
                    oldStudentBatchPaperAssociation.map(ele => ele.uid.trim())
                )
            );

        if (tmpArr.length == 0) {
            console.log("No student exist... therefore continue");
            continue;
        }



        for (let s = 0; s < oldStudentBatchPaperAssociation.length; s++) {
            const foundStudent = await getMappedOldStudentByNewStudent(oldStudentBatchPaperAssociation[s].oldStudentIdFk);

            if (!foundStudent) {
                console.log("in student-association(), not found student... therfore continue...");
                continue;
            }

            let [foundStudentAssociation] = await db
                .select()
                .from(studentPaperModel)
                .where(
                    and(
                        eq(studentPaperModel.batchId, batchPaper.batchId!),
                        eq(studentPaperModel.batchPaperId, batchPaper.id!),
                        eq(studentPaperModel.studentId, foundStudent.id!),
                    )
                );

            if (!foundStudentAssociation) {
                const [newStudentAssociation] = await db
                    .insert(studentPaperModel)
                    .values({
                        batchId: batchPaper.batchId!,
                        batchPaperId: batchPaper.id!,
                        studentId: foundStudent.id!,
                    })
                    .returning();

                foundStudentAssociation = newStudentAssociation;

                console.log("Student paper association created!");
            }
            else {
                console.log("already exist student association");
            }

            const [savedAcademicIdentifier] = await db
                .update(academicIdentifierModel)
                .set({
                    courseId: batch.courseId
                })
                .where(
                    eq(academicIdentifierModel.studentId, foundStudent.id)
                )
                .returning();

            if (savedAcademicIdentifier) {
                console.log("saved academic-identifier...");
                // const [[oldStudent]] =
                //     await mysqlConnection.query(`
                //         SELECT *
                //         FROM studentpersonaldetails
                //         WHERE
                //             codeNumber = '${savedAcademicIdentifier.uid}';
                //     `) as [OldStudent[], any];

                // if (oldStudent && oldStudent.coursetype) {
                //     let framework: "CCF" |"CBCS" | undefined;
                //     if (oldStudent.coursetype.trim().toUpperCase() == "CCF") {
                //         framework = "CCF";
                //     }
                //     else if (oldStudent.coursetype.trim().toUpperCase() == "CBCS") {
                //         framework = "CBCS";
                //     }

                //     if (framework) {
                //         savedAcademicIdentifier.
                //     }

                // }

            }



        }

        console.log(`totalEntries in student-association(): ${currentBatch}/${totalBatch}`)

    }

}

async function getMappedOldStudentByNewStudent(oldStudentId: number) {
    const [[oldStudent]] = await mysqlConnection.query(`
        SELECT *
        FROM studentpersonaldetails
        WHERE id = ${oldStudentId};
    `) as [OldStudent[], any];

    const [foundAcademicIdentifier] = await db
        .select()
        .from(academicIdentifierModel)
        .where(
            ilike(academicIdentifierModel.uid, oldStudent.codeNumber.trim())
        );

    const [foundStudent] = await db
        .select()
        .from(studentModel)
        .where(
            eq(studentModel.id, foundAcademicIdentifier.studentId)
        );

    return foundStudent ?? null;
}

async function processOldBatchPapers(oldBatchPapers: { oldBatchIdFk: number, oldBatchPaperId: number }[], subjectMetadata: SubjectMetadata) {
    for (let j = 0; j < oldBatchPapers.length; j++) {
        // console.log(`
        //     SELECT COUNT(*) AS totalRows
        //     FROM ${oldBatchTable}
        //     WHERE 
        //         id = ${oldBatchPapers[j].oldBatchIdFk}
        //         AND (
        //             SELECT COUNT(ID)
        //             FROM ${oldStudentPaperTable}
        //             WHERE parent_id = ${oldBatchPapers[j].oldBatchPaperId}
        //         ) > 0;
        // `)
        const [rows] = await mysqlConnection.query(`
            SELECT COUNT(*) AS totalRows
            FROM ${oldBatchTable}
            WHERE 
                id = ${oldBatchPapers[j].oldBatchIdFk}
                AND (
                    SELECT COUNT(ID)
                    FROM ${oldStudentPaperTable}
                    WHERE parent_id = ${oldBatchPapers[j].oldBatchPaperId}
                ) > 0;
        `);


        console.log("rows:", rows, "oldBatchPapers:", j + 1, " / ", oldBatchPapers.length);
        const { totalRows } = (rows as { totalRows: number }[])[0];

        const totalBatch = Math.ceil(totalRows / BATCH_SIZE);

        console.log("in processEachBatchPaperAssociation(), totalRows:", totalRows);
        for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
            const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number
            const [oldBatches] = await mysqlConnection.query(`
                    SELECT *
                    FROM ${oldBatchTable}
                    WHERE
                        id = ${oldBatchPapers[j].oldBatchIdFk}
                        AND (
                            SELECT COUNT(ID)
                            FROM ${oldStudentPaperTable}
                            WHERE parent_id = ${oldBatchPapers[j].oldBatchPaperId}
                        ) > 0
                    LIMIT ${BATCH_SIZE} 
                    OFFSET ${offset};
                `) as [OldBatch[], any];
            console.log("in processOldBatchPapers(), old-batches:", oldBatches.length);

            for (let k = 0; k < oldBatches.length; k++) {
                const oldBatch = oldBatches[k];
                const batch = await processBatch(oldBatch);

                let [foundBatchPaper] = await db
                    .select()
                    .from(batchPaperModel)
                    .where(
                        and(
                            eq(batchPaperModel.batchId, batch.id!),
                            eq(batchPaperModel.subjectMetadataId, subjectMetadata.id!)
                        )
                    );

                if (!foundBatchPaper) {
                    const [newBatchPaper] = await db
                        .insert(batchPaperModel)
                        .values({
                            batchId: batch.id!,
                            subjectMetadataId: subjectMetadata.id!,
                        })
                        .returning();

                    foundBatchPaper = newBatchPaper;

                    console.log("New Batch Paper created...")
                } else {
                    console.log(`Batch Paper (irpName, ${subjectMetadata.irpName}) exist...`);
                }

                console.log("going to processEachBatchPaperAssociation()...");
                await processEachBatchPaperAssociation(oldBatchPapers[j], foundBatchPaper, batch);
            }

            console.log(`done batch in processOldBatchPapers() - ${currentBatch} / ${totalBatch}`)
        }













    }



}

export async function loadBatchPapers() {
    const subjectMetadatas = await db
        .select()
        .from(subjectMetadataModel);

    for (let i = 0; i < subjectMetadatas.length; i++) {
        let oldSubject: OldSubject | null = null;
        let oldSubjectType: OldSubjectType | null = null;
        const tmpObj = await getOlderSubjectMappedByNew(subjectMetadatas[i]);

        if (!tmpObj) {
            console.log("Not found subject metadata for: ", subjectMetadatas[i].irpName);
            continue
        };
        oldSubject = tmpObj.oldSubject;
        oldSubjectType = tmpObj.oldSubjectType;

        const [oldBatchPapers] = await mysqlConnection.query(`
            SELECT
                bp.parent_id AS oldBatchIdFk,
                bp.ID AS oldBatchPaperId
            FROM
                ${oldBatchPaperTable} bp
            WHERE
                bp.subjectId = ${oldSubject.id} 
                AND bp.subjectTypeId = ${oldSubjectType.id}
                AND (
                    SELECT COUNT(ID)
                    FROM ${oldStudentPaperTable}
                    WHERE parent_id = bp.ID
                ) > 0
            ORDER BY parent_id ASC;
        `) as [{ oldBatchIdFk: number, oldBatchPaperId: number }[], any];


        console.log("in loadBatchPapers(), oldBatchPapers:", oldBatchPapers)
        await processOldBatchPapers(oldBatchPapers, subjectMetadatas[i]);
    }
};


async function getMappedSubjectMetadata({ subjectTypeId, subjectId }: { subjectTypeId: number, subjectId: number }) {
    const [oldSubjectType] = (
        await mysqlConnection
            .query(`
                    SELECT * 
                    FROM ${oldSubjectTypeTable} 
                    WHERE id = ${subjectTypeId}`
            ) as [OldSubjectType[], any]
    )[0];
    // console.log("in getMappedSubjectMetadata(), oldSubjectType:", oldSubjectType.subjectTypeName.trim().toUpperCase())
    const [foundSubjectType] = await db.select().from(subjectTypeModel).where(eq(subjectTypeModel.irpName, oldSubjectType.subjectTypeName.trim().toUpperCase()));

    if (!foundSubjectType) {
        console.log(`Not found subject type for irpName: ${oldSubjectType.subjectTypeName.trim().toUpperCase()}`)
        return null;
    }

    // console.log("foundSubjectType:", foundSubjectType.irpName, foundSubjectType.marksheetName);
    const [oldSubject] = (
        await mysqlConnection
            .query(`
                    SELECT * 
                    FROM ${oldSubjectTable} 
                    WHERE id = ${subjectId} AND subjectTypeId = ${subjectTypeId}`
            ) as [OldSubject[], any]
    )[0];

    // console.log("Old subject:", oldSubject);

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

    console.log('found subjectMetadata (in new db), irp:', foundSubjectMetadata?.irpName);
    return foundSubjectMetadata;
}