import { db, mysqlConnection } from "@/db/index.js";
import { OldBatch } from "@/types/old-data/old-batch.js";
import { OldCourse } from "@/types/old-data/old-course.js";
import { Course, courseModel } from "../models/course.model.js";
import { and, count, eq, sql } from "drizzle-orm";
import { Class, classModel } from "../models/class.model.js";
import { OldClass } from "@/types/old-data/old-class.js";
import { OldSection } from "@/types/old-data/old-section.js";
import { Section, sectionModel } from "../models/section.model.js";
import { OldShift } from "@/types/old-data/old-shift.js";
import { Shift, shiftModel } from "../models/shift.model.js";
import { Batch, batchModel } from "../models/batch.model.js";
import { BatchDetails, BatchStudentRow, BatchSummary, BatchType, StudentBatchEntry, StudentStatus } from "@/types/academics/batch.js";
import { CourseType } from "@/types/academics/course.js";
import { findCourseById } from "./course.service.js";
import { OldSession } from "@/types/academics/session.js";
import { Session, sessionModel } from "../models/session.model.js";
import { OldBatchPaper } from "@/types/old-data/old-batch-paper.js";
import { OldSubjectType } from "@/types/old-data/old-subject-type.js";
import { subjectTypeModel } from "../models/subjectType.model.js";
import { OldSubject } from "@/types/old-data/old-subject.js";
import {
    SubjectMetadata,
    subjectMetadataModel,
} from "../models/subjectMetadata.model.js";
import { OldStudentPaper } from "@/types/old-data/old-student-paper.js";
import { OldStudent } from "@/types/old-data/old-student.js";
import { processStudent } from "@/features/user/controllers/oldStudent.controller.js";
import { batchPaperModel } from "../models/batchPaper.model.js";
import { studentPaperModel } from "../models/studentPaper.model.js";
import { studentModel } from "@/features/user/models/student.model.js";
import { findStudentById } from "@/features/user/services/student.service.js";
import { findAcademicIdentifierByStudentId } from "@/features/user/services/academicIdentifier.service.js";
import { OldAcademicYear } from "@/types/old-data/old-academic-year.js";
import { academicYearModel } from "../models/academic-year.model.js";
import { degreeModel } from "@/features/resources/models/degree.model.js";
import { specializationModel } from "@/features/user/models/specialization.model.js";
import { SubjectMetadataType } from "@/types/academics/subject-metadata.js";
import { academicIdentifierModel } from "@/features/user/models/academicIdentifier.model.js";
import { findUserById } from "@/features/user/services/user.service.js";

const BATCH_SIZE = 500;

const oldBatchTable = "studentpaperlinkingmain";
const oldBatchPaperTable = "studentpaperlinkingpaperlist";
const oldSubjectTable = "subject";
const oldSubjectTypeTable = "subjecttype";
const oldStudentPaperTable = "studentpaperlinkingstudentlist";
const oldCourseTable = "course";
const oldClassTable = "classes";
const oldSectionTable = "section";
const oldShiftTable = "shift";
const oldStudentTable = "studentpersonaldetails";

export async function processCourse(courseId: number): Promise<Course> {
    const [courseResult] = (await mysqlConnection.query(`
                SELECT * 
                FROM ${oldCourseTable} 
                WHERE id = ${courseId}`)) as [OldCourse[], any];

    const oldCourse = courseResult[0];

    const [foundCourse] = await db
        .select()
        .from(courseModel)
        .where(eq(courseModel.name, oldCourse.courseName.trim().toUpperCase()));

    if (!foundCourse) {
        const [newCourse] = await db
            .insert(courseModel)
            .values({
                name: oldCourse.courseName.trim().toUpperCase(),
                shortName: oldCourse.courseSName
                    ? oldCourse.courseSName.trim().toUpperCase()
                    : null,
                codePrefix: oldCourse.codeprefix,
                universityCode: oldCourse.univcode,
            })
            .returning();

        return newCourse;
    }

    return foundCourse;
}

export async function processSession(oldSessionId: number) {
    const [result] = (await mysqlConnection.query(`
            SELECT * 
            FROM currentsessionmaster
            WHERE id = ${oldSessionId}
        `)) as [OldSession[], any];
    const [oldSession] = result;

    const [foundSession] = await db
        .select()
        .from(sessionModel)
        .where(eq(sessionModel.name, oldSession.sessionName));

    if (foundSession) {
        return foundSession;
    }

    const [newSession] = await db
        .insert(sessionModel)
        .values({
            name: oldSession.sessionName.trim(),
            from: oldSession.fromDate.toISOString(),
            to: oldSession.toDate.toISOString(),
            codePrefix: oldSession.codeprefix,
            isCurrentSession: oldSession.iscurrentsession,
        } as Session)
        .returning();

    return newSession;
}

export async function processClass(classId: number): Promise<Class> {
    const [classResult] = (await mysqlConnection.query(`
                SELECT * 
                FROM ${oldClassTable} 
                WHERE id = ${classId}`)) as [OldClass[], any];

    const oldClass = classResult[0];

    const [foundClass] = await db
        .select()
        .from(classModel)
        .where(eq(classModel.name, oldClass.classname.trim().toUpperCase()));

    if (!foundClass) {
        const [newClass] = await db
            .insert(classModel)
            .values({
                name: oldClass.classname.trim().toUpperCase(),
                type: oldClass.type === "semester" ? "SEMESTER" : "YEAR",
            })
            .returning();

        return newClass;
    }

    return foundClass;
}

export async function processSection(sectionId: number) {
    const [sectionResult] = (await mysqlConnection.query(`
                SELECT * 
                FROM ${oldSectionTable} 
                WHERE id = ${sectionId}`)) as [OldSection[], any];

    const oldSection = sectionResult[0];
    console.log(`
                SELECT * 
                FROM ${oldSectionTable} 
                WHERE id = ${sectionId}`);
    console.log("oldSection:", oldSection);

    const [foundSection] = await db
        .select()
        .from(sectionModel)
        .where(eq(sectionModel.name, oldSection.sectionName.trim().toUpperCase()));

    if (!foundSection) {
        const [newSection] = await db
            .insert(sectionModel)
            .values({
                name: oldSection.sectionName.trim().toUpperCase(),
            })
            .returning();

        return newSection;
    }

    return foundSection;
}

export async function processShift(shiftId: number) {
    if (!shiftId || shiftId === 0) {
        return null;
    }

    const [shiftResult] = (await mysqlConnection.query(`
                SELECT * 
                FROM ${oldShiftTable} 
                WHERE id = ${shiftId}`)) as [OldShift[], any];

    const oldShift = shiftResult[0];

    const [foundShift] = await db
        .select()
        .from(shiftModel)
        .where(eq(shiftModel.name, oldShift.shiftName.trim().toUpperCase()));

    if (!foundShift) {
        const [newShift] = await db
            .insert(shiftModel)
            .values({
                name: oldShift.shiftName.trim().toUpperCase(),
                codePrefix: oldShift.codeprefix.trim().toUpperCase(),
            })
            .returning();

        return newShift;
    }

    return foundShift;
}

export async function processAcademicYear(
    oldSessionId: number,
    sessionId: number,
) {
    const [OldAcademicYears] = (await mysqlConnection.query(`
            SELECT * 
            FROM accademicyear
            WHERE id = ${oldSessionId}
        `)) as [OldAcademicYear[], any];
    const [oldAcademicYear] = OldAcademicYears;

    console.log("OldAcademicYear:", oldAcademicYear);

    const [existing] = await db
        .select()
        .from(academicYearModel)
        .where(eq(academicYearModel.year, oldAcademicYear.accademicYearName));

    if (existing) return existing;

    return (
        await db
            .insert(academicYearModel)
            .values({
                year: oldAcademicYear.accademicYearName,
                isCurrentYear: oldAcademicYear.presentAcademicYear,
                sessionId,
            })
            .returning()
    )[0];
}

export async function processBatch(oldBatch: OldBatch) {
    const course = await processCourse(oldBatch.courseId);
    const academicClass = await processClass(oldBatch.classId);
    const shift = await processShift(oldBatch.shiftId);
    let section: Section | null = null;

    const session = await processSession(oldBatch.sessionId);
    const academicYear = await processAcademicYear(oldBatch.sessionId, session.id!);

    const whereConditions = [
        eq(batchModel.courseId, course.id as number),
        eq(batchModel.classId, academicClass.id as number),
        eq(batchModel.sessionId, session.id as number),
    ];

    if (shift) {
        whereConditions.push(eq(batchModel.shiftId, shift.id as number));
    }

    if (oldBatch.sectionId && oldBatch.sectionId !== 0) {
        section = await processSection(oldBatch.sectionId);
        whereConditions.push(eq(batchModel.sectionId, section.id as number));
    }

    const [foundBatch] = await db
        .select()
        .from(batchModel)
        .where(and(...whereConditions));

    if (!foundBatch) {
        const [newBatch] = await db
            .insert(batchModel)
            .values({
                academicYearId: academicYear.id, // TODO: Will be fetched from session_id
                courseId: course.id as number,
                classId: academicClass.id as number,
                sectionId: section ? (section.id as number) : null,
                shiftId: shift ? (shift.id as number) : null,
                sessionId: session.id as number,
            })
            .returning();

        return newBatch;
    }

    const [updatedBatch] = await db
        .update(batchModel)
        .set({ sessionId: session.id as number })
        .where(eq(batchModel.id, foundBatch.id as number))
        .returning();

    // Process for batch papers
    // await loadBatchPapers(oldBatch.id!, updatedBatch);

    return updatedBatch;
}

export async function loadBatchPapers(oldBatchId: number, updatedBatch: Batch) {
    const [batchPapers] = (await mysqlConnection.query(`
        SELECT *
        FROM ${oldBatchPaperTable}
        WHERE parent_id = ${oldBatchId}
    `)) as [OldBatchPaper[], any];

    if (!batchPapers || batchPapers.length === 0) {
        return;
    }
    console.log("batchPapers:", batchPapers.length);

    for (let i = 0; i < batchPapers.length; i++) {
        const oldBatchPaper = batchPapers[i];

        // Fetch the subject metadata
        const subjectMetadata: SubjectMetadata | null =
            await getMappedSubjectMetadata({
                subjectTypeId: oldBatchPaper.subjectTypeId!,
                subjectId: oldBatchPaper.subjectId!,
            });
        if (!subjectMetadata) {
            console.log(
                `No subject metadata found for old subjectTypeId: ${oldBatchPaper.subjectTypeId}, old subjectId: ${oldBatchPaper.subjectId}`,
            );
            continue;
        }

        // Insert the batch paper into the new database
        let [foundBatchPaper] = await db
            .select()
            .from(batchPaperModel)
            .where(
                and(
                    eq(batchPaperModel.batchId, updatedBatch.id as number),
                    eq(batchPaperModel.subjectMetadataId, subjectMetadata.id as number),
                ),
            );

        if (!foundBatchPaper) {
            const [newBatchPaper] = await db
                .insert(batchPaperModel)
                .values({
                    batchId: updatedBatch.id as number,
                    subjectMetadataId: subjectMetadata.id as number,
                })
                .returning();

            foundBatchPaper = newBatchPaper;
        }

        // Fetch the student's associated with this subject
        const [rows] = await mysqlConnection.query(`
            SELECT COUNT(*) AS totalRows 
            FROM ${oldStudentPaperTable} 
            WHERE parent_id = ${oldBatchPaper.parent_id}
        `);
        const { totalRows } = (rows as { totalRows: number }[])[0];

        const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches

        console.log(
            `\nTotal rows to migrate for student's selected subjects: ${totalRows}`,
        );

        for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
            const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

            console.log(
                `\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`,
            );
            const [rows] = (await mysqlConnection.query(`
                SELECT * 
                FROM ${oldStudentPaperTable}
                WHERE parent_id = ${oldBatchPaper.ID}
                LIMIT ${BATCH_SIZE} 
                OFFSET ${offset}
            `)) as [OldStudentPaper[], any];
            const oldDataArr = rows as OldStudentPaper[];

            for (let s = 0; i < oldDataArr.length; s++) {
                const oldStudentPaper = oldDataArr[s];

                // Fetch the student based on old Id
                const [[oldStudent]] = (await mysqlConnection.query(`
                    SELECT * 
                    FROM ${oldStudentTable}
                    WHERE id = ${oldStudentPaper.studentId}
                `)) as [OldStudent[], any];

                if (!oldStudent) continue;

                const foundStudent = await processStudent(oldStudent);

                // Insert the student's paper association into the new database
                const [foundStudentPaper] = await db
                    .select()
                    .from(studentPaperModel)
                    .where(
                        and(
                            eq(studentPaperModel.studentId, foundStudent.id as number),
                            eq(studentPaperModel.batchPaperId, foundBatchPaper.id as number),
                        ),
                    );

                if (!foundStudentPaper) {
                    await db
                        .insert(studentPaperModel)
                        .values({
                            studentId: foundStudent.id as number,
                            batchPaperId: foundBatchPaper.id as number,
                            batchId: updatedBatch.id!,
                        })
                        .returning();

                    console.log(
                        `Inserted new student paper for student ID ${foundStudent.id} and batch paper ID ${foundBatchPaper.id}`,
                    );
                }

                console.log(
                    `Batch for student's paper association: ${currentBatch}/${totalBatches} | Done: ${s + 1}/${oldDataArr.length} | Total Entries: ${totalRows}`,
                );
            }
        }
    }
}

async function getMappedSubjectMetadata({
    subjectTypeId,
    subjectId,
}: {
    subjectTypeId: number;
    subjectId: number;
}) {
    const [oldSubjectType] = (
        (await mysqlConnection.query(`
                    SELECT * 
                    FROM ${oldSubjectTypeTable} 
                    WHERE id = ${subjectTypeId}`)) as [OldSubjectType[], any]
    )[0];
    // console.log("in getMappedSubjectMetadata(), oldSubjectType:", oldSubjectType.subjectTypeName.trim().toUpperCase())
    const [foundSubjectType] = await db
        .select()
        .from(subjectTypeModel)
        .where(
            eq(
                subjectTypeModel.irpName,
                oldSubjectType.subjectTypeName.trim().toUpperCase(),
            ),
        );

    if (!foundSubjectType) {
        console.log(
            `Not found subject type for irpName: ${oldSubjectType.subjectTypeName.trim().toUpperCase()}`,
        );
        return null;
    }

    // console.log("foundSubjectType:", foundSubjectType.irpName, foundSubjectType.marksheetName);
    const [oldSubject] = (
        (await mysqlConnection.query(`
                    SELECT * 
                    FROM ${oldSubjectTable} 
                    WHERE id = ${subjectId} AND subjectTypeId = ${subjectTypeId}`)) as [
            OldSubject[],
            any,
        ]
    )[0];

    // console.log("Old subject:", oldSubject);

    const whereConditions = [
        eq(subjectMetadataModel.subjectTypeId, foundSubjectType.id),
        // eq(subjectMetadataModel.irpCode, oldSubject.univcode),
    ];

    if (oldSubject.univcode) {
        whereConditions.push(
            eq(
                subjectMetadataModel.irpCode,
                oldSubject.univcode?.trim().toUpperCase(),
            ),
        );
    }

    const [foundSubjectMetadata] = await db
        .select()
        .from(subjectMetadataModel)
        .where(and(...whereConditions));

    console.log(
        "found subjectMetadata (in new db), irp:",
        foundSubjectMetadata?.irpName,
    );
    return foundSubjectMetadata;
}

export async function refactorBatchSession() {
    for (let i = 1; i < 2041; i++) {
        // const [foundBatch] = await db.select().from(batchModel).where(eq(batchModel.id, i));
        console.log("i:", i);
        const { rows } = await db.execute(
            sql`SELECT * FROM batches WHERE id = ${i}`,
        );

        if (i == 1) {
            console.log(
                "session:",
                rows[0],
                "rows[0]['session']:",
                rows[0]["session"] as number,
            );
        }

        const session = await processSession(rows[0]["session"] as number);
        console.log("db session:", session);

        const { rows: updatedRow } = await db.execute(
            sql`UPDATE batches SET session_id_fk = ${session.id} WHERE id = ${i}`,
        );
        console.log("updatedRow:", updatedRow);

        // if (!foundBatchPaper) continue;

        // await db.update(batchModel).set({
        //     "sessionId": foundBatchPaper["session"]
        // }).where(eq(batchModel.id, i));
    }
}

export async function loadStudentSubjects() {
    const [{ totalStudents }] = await db
        .select({ totalStudents: count() })
        .from(studentModel);

    const BATCH_SIZE = 500;
    const totalBatches = Math.ceil(totalStudents / BATCH_SIZE); // Calculate total number of batches
    console.log(`\nTotal students: ${totalStudents}`);

    for (let offset = 0; offset < totalStudents; offset += BATCH_SIZE) {
        const students = await db
            .select()
            .from(studentModel)
            .limit(BATCH_SIZE)
            .offset(offset);
        const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

        for (let j = 0; j < students.length; j++) {
            const student = students[j];
            const academicIdentifier = await findAcademicIdentifierByStudentId(
                student.id,
            );

            if (!academicIdentifier) {
                console.log(
                    `No academic identifier found for student ID ${student.id}`,
                );
                continue;
            }

            console.log(
                `\nProcessing student ${student.id} (${currentBatch}/${totalBatches})`,
            );

            // Fetch the student's old data
            const [[oldStudent]] = (await mysqlConnection.query(`
                SELECT *
                FROM ${oldStudentTable}
                WHERE codeNumber = '${academicIdentifier.uid}'
            `)) as [OldStudent[], any];

            if (!oldStudent) {
                console.log(
                    `No old student data found for student's new db ID: ${student.id}`,
                );
                continue;
            }

            // Fetch the student's papers association
            const [studentPapers] = (await mysqlConnection.query(`
                SELECT * 
                FROM ${oldStudentPaperTable}
                WHERE studentId = ${oldStudent.id}
            `)) as [OldStudentPaper[], any];

            console.log(
                `Found ${studentPapers.length} papers for student ID ${student.id}`,
            );

            if (!studentPapers || studentPapers.length === 0) {
                console.log(`No papers found for student ID ${student.id}`);
                continue;
            }

            const batchPaperIds = studentPapers.map((paper) => paper.parent_id);

            // Fetch the batch papers associated with the student's papers
            const [batchPapers] = (await mysqlConnection.query(`
                SELECT *
                FROM ${oldBatchPaperTable}
                WHERE ID IN (${batchPaperIds.join(",")})
            `)) as [OldBatchPaper[], any];

            const batchIds = batchPapers.map((paper) => paper.parent_id);

            for (let k = 0; k < batchIds.length; k++) {
                const batchId = batchIds[k];
                const [[oldBatch]] = (await mysqlConnection.query(`
                    SELECT *
                    FROM ${oldBatchTable}
                    WHERE ID = ${batchId}
                `)) as [OldBatch[], any];

                if (!oldBatch) {
                    console.log(`No old batch data found for batch ID ${batchId}`);
                    continue;
                }

                // Process the batch
                const foundBatch = await processBatch(oldBatch);

                // Filter the batch papers for the current batch
                const filteredBatchPapers = batchPapers.filter(
                    (paper) => paper.parent_id == batchId,
                );

                for (let k = 0; k < filteredBatchPapers.length; k++) {
                    const oldBatchPaper = batchPapers[k];

                    // Fetch the subject metadata
                    const subjectMetadata: SubjectMetadata | null =
                        await getMappedSubjectMetadata({
                            subjectTypeId: oldBatchPaper.subjectTypeId!,
                            subjectId: oldBatchPaper.subjectId!,
                        });
                    if (!subjectMetadata) {
                        console.log(
                            `No subject metadata found for old subjectTypeId: ${oldBatchPaper.subjectTypeId}, old subjectId: ${oldBatchPaper.subjectId}`,
                        );
                        continue;
                    }

                    // Insert the batch paper into the new database
                    let [foundBatchPaper] = await db
                        .select()
                        .from(batchPaperModel)
                        .where(
                            and(
                                eq(batchPaperModel.batchId, foundBatch.id as number),
                                eq(
                                    batchPaperModel.subjectMetadataId,
                                    subjectMetadata.id as number,
                                ),
                            ),
                        );

                    if (!foundBatchPaper) {
                        const [newBatchPaper] = await db
                            .insert(batchPaperModel)
                            .values({
                                batchId: foundBatch.id as number,
                                subjectMetadataId: subjectMetadata.id as number,
                            })
                            .returning();

                        foundBatchPaper = newBatchPaper;
                    }

                    // Insert the student's paper association into the new database
                    const [foundStudentPaper] = await db
                        .select()
                        .from(studentPaperModel)
                        .where(
                            and(
                                eq(studentPaperModel.studentId, student.id as number),
                                eq(
                                    studentPaperModel.batchPaperId,
                                    foundBatchPaper.id as number,
                                ),
                            ),
                        );

                    if (!foundStudentPaper) {
                        await db
                            .insert(studentPaperModel)
                            .values({
                                studentId: student.id as number,
                                batchPaperId: foundBatchPaper.id as number,
                                batchId: foundBatch.id!,
                            })
                            .returning();

                        console.log(
                            `Inserted new student paper for student ID ${student.id} and batch paper ID ${foundBatchPaper.id}`,
                        );
                    }
                }
            }
        }
    }
}

export async function loadOlderBatches() {
    console.log(`\n\nCounting rows from table ${oldBatchTable}...`);

    const [rows] = await mysqlConnection.query(`
        SELECT COUNT(*) AS totalRows 
        FROM ${oldBatchTable} 
        WHERE sessionId > 15; 
    `);
    const { totalRows } = (rows as { totalRows: number }[])[0];

    const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches

    console.log(`\nTotal rows to migrate: ${totalRows}`);

    for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
        const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

        console.log(
            `\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`,
        );
        const [rows] = (await mysqlConnection.query(`
            SELECT * 
            FROM ${oldBatchTable}
            WHERE sessionId > 15
            LIMIT ${BATCH_SIZE} 
            OFFSET ${offset}
        `)) as [OldBatch[], any];
        const oldDataArr = rows as OldBatch[];

        for (let i = 0; i < oldDataArr.length; i++) {
            try {
                await processBatch(oldDataArr[i]);
            } catch (error) {
                console.log(error);
            }
            console.log(
                `Batch: ${currentBatch}/${totalBatches} | Done: ${i + 1}/${oldDataArr.length} | Total Entries: ${totalRows}`,
            );
        }
    }
}

export async function findBatchById(id: number): Promise<BatchType | null> {
    const [foundBatch] = await db
        .select()
        .from(batchModel)
        .where(eq(batchModel.id, id));

    const formattedBatch = await batchFormatResponse(foundBatch);

    return formattedBatch;
}

export async function batchFormatResponse(
    batch: Batch | null,
): Promise<BatchType | null> {
    if (!batch) {
        return null;
    }

    const { classId, courseId, sectionId, shiftId, sessionId, ...props } = batch;

    let academicClass: Class | null = null;
    if (classId) {
        const [foundClass] = await db
            .select()
            .from(classModel)
            .where(eq(classModel.id, classId));
        academicClass = foundClass;
    }

    let course: CourseType | null = null;
    if (courseId) {
        course = await findCourseById(courseId);
    }

    let section: Section | null = null;
    if (sectionId) {
        const [foundSection] = await db
            .select()
            .from(sectionModel)
            .where(eq(sectionModel.id, sectionId));
        section = foundSection;
    }

    let shift: Shift | null = null;
    if (shiftId) {
        const [foundShift] = await db
            .select()
            .from(shiftModel)
            .where(eq(shiftModel.id, shiftId));
        shift = foundShift;
    }

    let session: Session | null = null;
    if (sessionId) {
        const [foundSession] = await db
            .select()
            .from(sessionModel)
            .where(eq(sessionModel.id, sessionId as number));
        session = foundSession;
    }

    const formattedBatch: BatchType = {
        ...props,
        course,
        academicClass,
        section,
        shift,
        session: session,
    };

    return formattedBatch;
}

// --- CRUD Service Functions ---

// Create a new batch
export async function createBatch(data: Omit<Batch, "id" | "createdAt" | "updatedAt">): Promise<BatchType | null> {
    const [newBatch] = await db
        .insert(batchModel)
        .values(data)
        .returning();
    return batchFormatResponse(newBatch);
}

// Get all batches
export async function getAllBatches(): Promise<BatchType[]> {
    const batches = await db.select().from(batchModel);
    const formatted = await Promise.all(batches.map(batch => batchFormatResponse(batch)));
    return formatted.filter(Boolean) as BatchType[];
}

// Update a batch by ID
export async function updateBatch(id: number, data: Partial<Omit<Batch, "id" | "createdAt" | "updatedAt">>): Promise<BatchType | null> {
    const [updatedBatch] = await db
        .update(batchModel)
        .set(data)
        .where(eq(batchModel.id, id))
        .returning();
    return batchFormatResponse(updatedBatch);
}

// Delete a batch by ID
export async function deleteBatch(id: number): Promise<boolean> {
    const result = await db.delete(batchModel).where(eq(batchModel.id, id)).returning();
    return result.length > 0;
}

export async function findBatchSummariesByFilters({ academicYearId }: { academicYearId?: number }): Promise<BatchSummary[]> {
    // Build the query in one go to avoid Drizzle type issues
    const batches = await db
        .select()
        .from(batchModel)
        .where(academicYearId ? eq(batchModel.academicYearId, academicYearId) : undefined);

    const summaries: BatchSummary[] = [];
    for (const batch of batches) {
        // Get related names
        const [course] = await db.select().from(courseModel).where(eq(courseModel.id, batch.courseId));
        const [cls] = await db.select().from(classModel).where(eq(classModel.id, batch.classId));
        const [section] = batch.sectionId ? await db.select().from(sectionModel).where(eq(sectionModel.id, batch.sectionId)) : [null];
        const [shift] = batch.shiftId ? await db.select().from(shiftModel).where(eq(shiftModel.id, batch.shiftId)) : [null];
        const [session] = batch.sessionId ? await db.select().from(sessionModel).where(eq(sessionModel.id, batch.sessionId)) : [null];

        // Count students
        const [{ totalStudents }] = await db.select({ totalStudents: count() }).from(studentPaperModel).where(eq(studentPaperModel.batchId, batch.id));
        // Count subjects
        const [{ totalSubjects }] = await db.select({ totalSubjects: count() }).from(batchPaperModel).where(eq(batchPaperModel.batchId, batch.id));

        summaries.push({
            ...batch,
            courseName: course?.name || '',
            className: cls?.name || '',
            sectionName: section?.name || '',
            shift: shift?.name || '',
            session: session?.name || '',
            totalStudents: totalStudents || 0,
            totalSubjects: totalSubjects || 0,
        });
    }
    return summaries;
}

export async function findBatchDetailsById(id: number): Promise<BatchDetails | null> {
    const batch = await findBatchById(id);
    if (!batch) return null;

    // Get all students in the batch
    const studentPapers = await db.select().from(studentPaperModel).where(eq(studentPaperModel.batchId, id));
    const studentIds = [...new Set(studentPapers.map(sp => sp.studentId))];

    // For each student, get UID and subjects
    const studentEntries: StudentBatchEntry[] = [];
    for (const studentId of studentIds) {
        // Get UID
        const academicIdentifier = await findAcademicIdentifierByStudentId(studentId);
        // Get subjects for this student in this batch
        const papers = studentPapers.filter(sp => sp.studentId === studentId);
        const subjectMetadatas: SubjectMetadataType[] = [];
        for (const paper of papers) {
            // Get batchPaper
            const [batchPaper] = await db.select().from(batchPaperModel).where(eq(batchPaperModel.id, paper.batchPaperId));
            if (!batchPaper) continue;
            // Get subjectMetadata
            const [subjectMetadata] = await db.select().from(subjectMetadataModel).where(eq(subjectMetadataModel.id, batchPaper.subjectMetadataId));
            if (subjectMetadata) {
                // Fetch related entities for SubjectMetadataType
                const [degree] = await db.select().from(degreeModel).where(eq(degreeModel.id, subjectMetadata.degreeId));
                const [cls] = await db.select().from(classModel).where(eq(classModel.id, subjectMetadata.classId));
                const [specialization] = subjectMetadata.specializationId ? await db.select().from(specializationModel).where(eq(specializationModel.id, subjectMetadata.specializationId)) : [null];
                const [subjectType] = subjectMetadata.subjectTypeId ? await db.select().from(subjectTypeModel).where(eq(subjectTypeModel.id, subjectMetadata.subjectTypeId)) : [null];
                subjectMetadatas.push({
                    ...subjectMetadata,
                    degree: degree || { name: '' },
                    class: cls || { name: '' },
                    specialization: specialization || null,
                    subjectType: subjectType || { id: 0, irpName: '', irpShortName: '', marksheetName: '', marksheetShortName: '', sequene: null, disabled: null, createdAt: new Date(), updatedAt: new Date() },
                });
            }
        }
        const [foundStudent] = await db
            .select()
            .from(studentModel)
            .where(eq(studentModel.id, studentId));

        let status: StudentStatus = 'ACTIVE';

        if (foundStudent.isSuspended) {
            status = "SUSPENDED";
        } else if (!foundStudent.active && !foundStudent.alumni) {
            status = "DROPPED_OUT";
        } else if (foundStudent.active && !foundStudent.alumni) {
            status = "ACTIVE";
        } else if (foundStudent.active && foundStudent.alumni) {
            status = "PENDING_CLEARANCE";
        }

        if (!foundStudent.active && foundStudent.alumni && foundStudent.leavingDate) {
            status = "ALUMNI";
        }

        const user = await findUserById(foundStudent.userId);
        // const academicIdentifier = await findAcademicIdentifierByStudentId(studentId);

        studentEntries.push({
            studentId,
            studentName: user?.name!,
            registrationNumber: academicIdentifier?.registrationNumber ?? null,
            roll: academicIdentifier?.rollNumber ?? null,
            uid: academicIdentifier?.uid || '',
            subjects: subjectMetadatas,
            status
        });
    }


    // Paginate (for now, return all in one page)
    const paginatedStudentEntry = {
        content: studentEntries,
        page: 1,
        pageSize: studentEntries.length,
        totalPages: 1,
        totalElements: studentEntries.length,
    };

    // const b: BatchType = batch;
    console.log(batch);
    return {
        ...batch,
        paginatedStudentEntry,
    };
}

export async function uploadBatch(batchRows: BatchStudentRow[]): Promise<{ success: boolean, exceptions: BatchStudentRow[] }> {
    const exceptions: BatchStudentRow[] = [];
    const validRows: BatchStudentRow[] = [];
    const processedGroups = new Set<string>();

    for (const row of batchRows) {
        // Build group key (case-insensitive, trimmed)
        const groupKey = [
            row.academicYear?.trim().toLowerCase() || '',
            row.course?.trim().toLowerCase() || '',
            row.class?.trim().toLowerCase() || '',
            row.framework?.toString().trim().toLowerCase() || '',
            row.programmeType?.toString().trim().toLowerCase() || '',
            row.section?.trim().toLowerCase() || '',
            row.session?.trim().toLowerCase() || '',
            row.shift?.trim().toLowerCase() || '',
            row.uid?.trim().toLowerCase() || ''
        ].join('|');
        if (processedGroups.has(groupKey)) continue;
        processedGroups.add(groupKey);

        // Filter all rows in this group
        const arr = batchRows.filter(ele =>
            (ele.academicYear?.trim().toLowerCase() || '') === (row.academicYear?.trim().toLowerCase() || '') &&
            (ele.course?.trim().toLowerCase() || '') === (row.course?.trim().toLowerCase() || '') &&
            (ele.class?.trim().toLowerCase() || '') === (row.class?.trim().toLowerCase() || '') &&
            (ele.framework?.toString().trim().toLowerCase() || '') === (row.framework?.toString().trim().toLowerCase() || '') &&
            (ele.programmeType?.toString().trim().toLowerCase() || '') === (row.programmeType?.toString().trim().toLowerCase() || '') &&
            (ele.section?.trim().toLowerCase() || '') === (row.section?.trim().toLowerCase() || '') &&
            (ele.session?.trim().toLowerCase() || '') === (row.session?.trim().toLowerCase() || '') &&
            (ele.shift?.trim().toLowerCase() || '') === (row.shift?.trim().toLowerCase() || '') &&
            (ele.uid?.trim().toLowerCase() || '') === (row.uid?.trim().toLowerCase() || '')
        );

        // Validate batch-level entities once per group
        const [course] = await db.select().from(courseModel).where(eq(courseModel.name, row.course.trim()));
        const [cls] = await db.select().from(classModel).where(eq(classModel.name, row.class.trim()));
        const [section] = await db.select().from(sectionModel).where(eq(sectionModel.name, row.section.trim()));
        const [shift] = await db.select().from(shiftModel).where(eq(shiftModel.name, row.shift.trim()));
        const [session] = await db.select().from(sessionModel).where(eq(sessionModel.name, row.session.trim()));
        const [academicYear] = await db.select().from(academicYearModel).where(eq(academicYearModel.year, row.academicYear.trim()));
        const [academicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.uid, row.uid.trim()));

        // For each row in arr (i.e., each paperCode for this group), validate subject metadata
        for (const r of arr) {
            let error = '';
            if (!course) error += 'Invalid course; ';
            if (!cls) error += 'Invalid class; ';
            if (!section) error += 'Invalid section; ';
            if (!shift) error += 'Invalid shift; ';
            if (!session) error += 'Invalid session; ';
            if (!academicYear) error += 'Invalid academic year; ';
            if (!academicIdentifier) error += 'Invalid UID; ';
            // Validate subject metadata for this paperCode
            let subjectMetadataExists = false;
            if (cls && course) {
                const [subjectMetadata] = await db.select().from(subjectMetadataModel).where(
                    and(
                        eq(subjectMetadataModel.marksheetCode, r.paperCode.trim()),
                        eq(subjectMetadataModel.classId, cls.id),
                        eq(subjectMetadataModel.framework, r.framework!),
                        eq(subjectMetadataModel.programmeType, course.programmeType!)
                    )
                );
                if (subjectMetadata) subjectMetadataExists = true;
            }
            if (!subjectMetadataExists) error += 'Invalid subject metadata; ';
            if (error) {
                r.error = error.trim();
                exceptions.push(r);
            } else {
                r.error = undefined;
                validRows.push(r);
            }
        }
    }

    // If there are exceptions, return them at the top, valid rows below
    if (exceptions.length > 0) {
        return { success: false, exceptions: [...exceptions, ...validRows] };
    }

    // Proceed with original logic for validRows only
    for (const row of validRows) {
        // 1. Find or create batch
        const [course] = await db.select().from(courseModel).where(eq(courseModel.name, row.course.trim()));
        const [cls] = await db.select().from(classModel).where(eq(classModel.name, row.class.trim()));
        const [section] = await db.select().from(sectionModel).where(eq(sectionModel.name, row.section.trim()));
        const [shift] = await db.select().from(shiftModel).where(eq(shiftModel.name, row.shift.trim()));
        const [session] = await db.select().from(sessionModel).where(eq(sessionModel.name, row.session.trim()));
        const [academicYear] = await db.select().from(academicYearModel).where(eq(academicYearModel.year, row.academicYear.trim()));
        if (!course || !cls || !session || !academicYear) continue;
        const batchConditions = [
            eq(batchModel.academicYearId, academicYear.id),
            eq(batchModel.courseId, course.id),
            eq(batchModel.classId, cls.id),
            eq(batchModel.sessionId, session.id)
        ];
        if (section) batchConditions.push(eq(batchModel.sectionId, section.id));
        if (shift) batchConditions.push(eq(batchModel.shiftId, shift.id));
        let [batch] = await db.select().from(batchModel).where(and(...batchConditions));
        if (!batch) {
            [batch] = await db.insert(batchModel).values({
                academicYearId: academicYear.id,
                courseId: course.id,
                classId: cls.id,
                sectionId: section ? section.id : null,
                shiftId: shift ? shift.id : null,
                sessionId: session.id
            }).returning();
        }
        // 2. Find subject metadata by marksheetCode (paperCode)
        const [subjectMetadata] = await db.select().from(subjectMetadataModel).where(eq(subjectMetadataModel.marksheetCode, row.paperCode.trim()));
        if (!subjectMetadata) continue;
        // 3. Find or create batch paper
        let [batchPaper] = await db.select().from(batchPaperModel).where(
            and(
                eq(batchPaperModel.batchId, batch.id),
                eq(batchPaperModel.subjectMetadataId, subjectMetadata.id)
            )
        );
        if (!batchPaper) {
            [batchPaper] = await db.insert(batchPaperModel).values({
                batchId: batch.id,
                subjectMetadataId: subjectMetadata.id
            }).returning();
        }
        // 4. Find student by uid
        const [academicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.uid, row.uid.trim()));
        if (!academicIdentifier) continue;
        const studentId = academicIdentifier.studentId;
        // 5. Create student paper entry if not exists
        const [existingStudentPaper] = await db.select().from(studentPaperModel).where(
            and(
                eq(studentPaperModel.studentId, studentId),
                eq(studentPaperModel.batchPaperId, batchPaper.id),
                eq(studentPaperModel.batchId, batch.id)
            )
        );
        if (!existingStudentPaper) {
            await db.insert(studentPaperModel).values({
                studentId,
                batchPaperId: batchPaper.id,
                batchId: batch.id
            });
        }
    }
    return { success: true, exceptions: [] };
}