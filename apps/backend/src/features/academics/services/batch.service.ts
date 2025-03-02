import { db, mysqlConnection } from "@/db/index.js";
import { OldBatch } from "@/types/old-data/old-batch.js";
import { OldCourse } from "@/types/old-data/old-course.js";
import { Course, courseModel } from "../models/course.model.js";
import { and, eq } from "drizzle-orm";
import { Class, classModel } from "../models/class.model.js";
import { OldClass } from "@/types/old-data/old-class.js";
import { OldSection } from "@/types/old-data/old-section.js";
import { Section, sectionModel } from "../models/section.model.js";
import { OldShift } from "@/types/old-data/old-shift.js";
import { shiftModel } from "../models/shift.model.js";
import { batchModel } from "../models/batch.model.js";

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

async function processBatch(oldBatch: OldBatch) {
    console.log("batchResult:", oldBatch);

    const course = await processCourse(oldBatch.courseId);
    const academicClass = await processClass(oldBatch.classId);
    const shift = await processShift(oldBatch.shiftId);
    let section: Section | null = null;

    const whereConditions = [
        eq(batchModel.courseId, course.id as number),
        eq(batchModel.classId, academicClass.id as number),
        eq(batchModel.shiftId, shift.id as number),
        eq(batchModel.session, oldBatch.sessionId),
    ]

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
            shiftId: shift.id as number,
            session: oldBatch.sessionId,
        }).returning();

        return newBatch;
    }

    return foundBatch;
}

export async function loadOlderBatches() {
    console.log(`\n\nCounting rows from table ${oldBatchTable}...`);

    const [rows] = await mysqlConnection.query(`SELECT COUNT(*) AS totalRows FROM ${oldBatchTable}`);
    const { totalRows } = (rows as { totalRows: number }[])[0];

    const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches

    console.log(`\nTotal rows to migrate: ${totalRows}`);

    for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
        const currentBatch = Math.ceil((offset + 1) / BATCH_SIZE); // Determine current batch number

        console.log(`\nMigrating batch: ${offset + 1} to ${Math.min(offset + BATCH_SIZE, totalRows)}`);
        const [rows] = await mysqlConnection.query(`SELECT * FROM ${oldBatchTable} LIMIT ${BATCH_SIZE} OFFSET ${offset}`) as [OldBatch[], any];
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