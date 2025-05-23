import { db, mysqlConnection } from "@/db/index.js";
import { OldBatch } from "@/types/old-data/old-batch.js";
import { OldCourse } from "@/types/old-data/old-course.js";
import { Course, courseModel } from "../models/course.model.js";
import { and, eq, sql } from "drizzle-orm";
import { Class, classModel } from "../models/class.model.js";
import { OldClass } from "@/types/old-data/old-class.js";
import { OldSection } from "@/types/old-data/old-section.js";
import { Section, sectionModel } from "../models/section.model.js";
import { OldShift } from "@/types/old-data/old-shift.js";
import { Shift, shiftModel } from "../models/shift.model.js";
import { Batch, batchModel } from "../models/batch.model.js";
import { BatchType } from "@/types/academics/batch.js";
import { CourseType } from "@/types/academics/course.js";
import { findCourseById } from "./course.service.js";
import { OldSession } from "@/types/academics/session.js";
import { Session, sessionModel } from "../models/session.model.js";

const BATCH_SIZE = 500;

const oldBatchTable = "studentpaperlinkingmain";
const oldBatchPaperTable = "studentpaperlinkingpaperlist";
const oldStudentPaperTable = "studentpaperlinkingstudentlist";
const oldCourseTable = "course";
const oldClassTable = "classes";
const oldSectionTable = "section";
const oldShiftTable = "shift";

export async function processCourse(courseId: number): Promise<Course> {
    const [courseResult] =
        await mysqlConnection
            .query(`
                SELECT * 
                FROM ${oldCourseTable} 
                WHERE id = ${courseId}`
            ) as [OldCourse[], any];

    const oldCourse = courseResult[0];

    const [foundCourse] = await db.select().from(courseModel).where(eq(courseModel.name, oldCourse.courseName.trim().toUpperCase()));

    if (!foundCourse) {
        const [newCourse] = await db.insert(courseModel).values({
            streamId: null,
            name: oldCourse.courseName.trim().toUpperCase(),
            shortName: oldCourse.courseSName ? oldCourse.courseSName.trim().toUpperCase() : null,
            codePrefix: oldCourse.codeprefix,
            universityCode: oldCourse.univcode,
        }).returning();

        return newCourse;
    }

    return foundCourse;
}

export async function processSession(oldSessionId: number) {
    const [result] = (
        await mysqlConnection.query(`
            SELECT * 
            FROM currentsessionmaster
            WHERE id = ${oldSessionId}
        `) as [OldSession[], any]
    );
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
    const [classResult] =
        await mysqlConnection
            .query(`
                SELECT * 
                FROM ${oldClassTable} 
                WHERE id = ${classId}`
            ) as [OldClass[], any];

    const oldClass = classResult[0];

    const [foundClass] = await db.select().from(classModel).where(eq(classModel.name, oldClass.classname.trim().toUpperCase()));

    if (!foundClass) {
        const [newClass] = await db.insert(classModel).values({
            name: oldClass.classname.trim().toUpperCase(),
            type: oldClass.type === "semester" ? "SEMESTER" : "YEAR",
        }).returning();

        return newClass;
    }

    return foundClass;
}

export async function processSection(sectionId: number) {
    const [sectionResult] =
        await mysqlConnection
            .query(`
                SELECT * 
                FROM ${oldSectionTable} 
                WHERE id = ${sectionId}`
            ) as [OldSection[], any];

    const oldSection = sectionResult[0];
    console.log(`
                SELECT * 
                FROM ${oldSectionTable} 
                WHERE id = ${sectionId}`);
    console.log("oldSection:", oldSection)

    const [foundSection] = await db.select().from(sectionModel).where(eq(sectionModel.name, oldSection.sectionName.trim().toUpperCase()));

    if (!foundSection) {
        const [newSection] = await db.insert(sectionModel).values({
            name: oldSection.sectionName.trim().toUpperCase(),
        }).returning();

        return newSection;
    }

    return foundSection;
}

export async function processShift(shiftId: number) {
    if (!shiftId || shiftId === 0) {
        return null;
    }

    const [shiftResult] =
        await mysqlConnection
            .query(`
                SELECT * 
                FROM ${oldShiftTable} 
                WHERE id = ${shiftId}`
            ) as [OldShift[], any];

    const oldShift = shiftResult[0];

    const [foundShift] = await db.select().from(shiftModel).where(eq(shiftModel.name, oldShift.shiftName.trim().toUpperCase()));

    if (!foundShift) {
        const [newShift] = await db.insert(shiftModel).values({
            name: oldShift.shiftName.trim().toUpperCase(),
            codePrefix: oldShift.codeprefix.trim().toUpperCase(),
        }).returning();

        return newShift;
    }

    return foundShift;
}


export async function processBatch(oldBatch: OldBatch) {
    const course = await processCourse(oldBatch.courseId);
    const academicClass = await processClass(oldBatch.classId);
    const shift = await processShift(oldBatch.shiftId);
    let section: Section | null = null;

    const session = await processSession(oldBatch.sessionId);

    const whereConditions = [
        eq(batchModel.courseId, course.id as number),
        eq(batchModel.classId, academicClass.id as number),
        eq(batchModel.sessionId, session.id as number),
    ]

    if (shift) {
        whereConditions.push(eq(batchModel.shiftId, shift.id as number));
    }

    if (oldBatch.sectionId && oldBatch.sectionId !== 0) {
        section = await processSection(oldBatch.sectionId);
        whereConditions.push(
            eq(batchModel.sectionId, section.id as number)
        );
    }

    const [foundBatch] = await db
        .select()
        .from(batchModel)
        .where(and(...whereConditions));

    if (!foundBatch) {
        const [newBatch] = await db.insert(batchModel).values({
            courseId: course.id as number,
            classId: academicClass.id as number,
            sectionId: section ? section.id as number : null,
            shiftId: shift ? shift.id as number : null,
            sessionId: session.id as number,
        }).returning();

        return newBatch;
    }

    const [updatedBatch] = await db
        .update(batchModel)
        .set({ sessionId: session.id as number })
        .where(eq(batchModel.id, foundBatch.id as number))
        .returning();

    return updatedBatch;
}

export async function refactorBatchSession() {
    for (let i = 1; i < 2041; i++) {
        // const [foundBatch] = await db.select().from(batchModel).where(eq(batchModel.id, i));
        console.log("i:", i)
        const { rows } = await db.execute(sql`SELECT * FROM batches WHERE id = ${i}`)

        if (i == 1) {
            console.log("session:", rows[0], "rows[0]['session']:", rows[0]["session"] as number)
        }

        const session = await processSession(rows[0]["session"] as number);
        console.log("db session:", session)

        const { rows: updatedRow } = await db.execute(sql`UPDATE batches SET session_id_fk = ${session.id} WHERE id = ${i}`)
        console.log("updatedRow:", updatedRow);

        // if (!foundBatchPaper) continue;

        // await db.update(batchModel).set({
        //     "sessionId": foundBatchPaper["session"]
        // }).where(eq(batchModel.id, i));
    }
}

export async function loadOlderBatches() {
    console.log(`\n\nCounting rows from table ${oldBatchTable}...`);

    const [rows] = await mysqlConnection.query(`
        SELECT COUNT(*) AS totalRows 
        FROM ${oldBatchTable} 
        WHERE sessionId = 16 OR sessionId = 17; 
    `);
    const { totalRows } = (rows as { totalRows: number }[])[0];

    const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches

    console.log(`\nTotal rows to migrate: ${totalRows}`);

    for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
        const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

        console.log(`\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);
        const [rows] = await mysqlConnection.query(`
            SELECT * 
            FROM ${oldBatchTable}
            WHERE sessionId = 16 OR sessionId = 17
            LIMIT ${BATCH_SIZE} 
            OFFSET ${offset}
        `) as [OldBatch[], any];
        const oldDataArr = rows as OldBatch[];

        for (let i = 0; i < oldDataArr.length; i++) {
            try {
                await processBatch(oldDataArr[i]);
            } catch (error) {
                console.log(error)
            }
            console.log(`Batch: ${currentBatch}/${totalBatches} | Done: ${i + 1}/${oldDataArr.length} | Total Entries: ${totalRows}`);
        }
    }
}

export async function findBatchById(id: number): Promise<BatchType | null> {
    const [foundBatch] = await db.select().from(batchModel).where(eq(batchModel.id, id));

    const formattedBatch = await batchFormatResponse(foundBatch);

    return formattedBatch;
}

export async function batchFormatResponse(batch: Batch | null): Promise<BatchType | null> {
    if (!batch) {
        return null;
    }

    const { classId, courseId, sectionId, shiftId, sessionId, ...props } = batch;

    let academicClass: Class | null = null;
    if (classId) {
        const [foundClass] = await db.select().from(classModel).where(eq(classModel.id, classId));
        academicClass = foundClass;
    }

    let course: CourseType | null = null;
    if (courseId) {
        course = await findCourseById(courseId);
    }

    let section: Section | null = null;
    if (sectionId) {
        const [foundSection] = await db.select().from(sectionModel).where(eq(sectionModel.id, sectionId));
        section = foundSection;
    }

    let shift: Shift | null = null;
    if (shiftId) {
        const [foundShift] = await db.select().from(shiftModel).where(eq(shiftModel.id, shiftId));
        section = foundShift;
    }

    let session: Session | null = null;
    if (sessionId) {
        const [foundSession] = await db.select().from(sessionModel).where(eq(sessionModel.id, sessionId as number));
        session = foundSession;
    }

    const formattedBatch: BatchType = { ...props, course, academicClass, section, shift, session: session };

    return formattedBatch;

}