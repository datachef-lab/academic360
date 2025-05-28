import path from "path";
import { fileURLToPath } from "url";
import { MarksheetType } from "@/types/academics/marksheet.js";
import { readExcelFile } from "@/utils/readExcel.js";
import { db, mysqlConnection } from "@/db/index.js";
import { MarksheetRow } from "@/types/academics/marksheet-row.js";
import {
    findAllStreams,
    findStreamById,
} from "./stream.service.js";
import { academicIdentifierModel } from "@/features/user/models/academicIdentifier.model.js";
import { and, desc, eq, ilike, max, sql, count, or, asc } from "drizzle-orm";
import { findStudentById } from "@/features/user/services/student.service.js";
import { Student, studentModel } from "@/features/user/models/student.model.js";
import { Marksheet, marksheetModel } from "../models/marksheet.model.js";
import { Subject, subjectModel } from "../models/subject.model.js";
import { subjectMetadataModel } from "../models/subjectMetadata.model.js";
import { SubjectType } from "@/types/academics/subject.js";
import {
    addSubject,
    findSubjectsByMarksheetId,
    saveSubject,
    subjectResponseFormat,
} from "./subject.service.js";
import bcrypt from "bcrypt";
import { User, userModel } from "@/features/user/models/user.model.js";
import {
    calculateCGPA,
    calculatePercentage,
    calculateSGPA,
    formatMarks,
    getClassification,
    getLetterGrade,
    getRemarks,
} from "@/utils/helper.js";
import { findAcademicIdentifierByStudentId } from "@/features/user/services/academicIdentifier.service.js";
import { AcademicIdentifierType } from "@/types/user/academic-identifier.js";
import { MarksheetLog } from "@/types/academics/marksheet-logs.js";
import { UserType } from "@/types/user/user.js";
import { findUserById } from "@/features/user/services/user.service.js";
import { StreamType } from "@/types/academics/stream.js";
import { Section, sectionModel } from "../models/section.model.js";
import { DefaultEventsMap, Socket } from "socket.io";

import { processStudent as insertStudent } from "@/features/user/controllers/oldStudent.controller.js";
import { OldStudent } from "@/types/old-data/old-student.js";
import { degreeModel } from "@/features/resources/models/degree.model.js";
import { streamModel } from "../models/stream.model.js";

const directoryName = path.dirname(fileURLToPath(import.meta.url));

export async function refactorStatusAndGrade() {
    const [{ count: marksheetCount }] = await db.select({ count: count() }).from(marksheetModel);

    const pageSize = 10;
    const pages = Math.round(marksheetCount / pageSize);

    for (let i = 0; i <= pageSize; i++) {
        let marksheets = await db
            .select()
            .from(marksheetModel)
            .limit(pageSize)
            .offset(i * pageSize);

        for (let j = 0; j < marksheets.length; j++) {
            const subjects = await db
                .select()
                .from(subjectModel)
                .where(eq(subjectModel.marksheetId, marksheets[j].id!));

            for (let k = 0; k < subjects.length; k++) {
                const subject = subjects[k];
                if (subject.letterGrade?.startsWith("F")) {
                    subject.letterGrade = "F";
                    const [subjectMetadata] = await db
                        .select()
                        .from(subjectMetadataModel)
                        .where(eq(subjectMetadataModel.id, subjects[k].subjectMetadataId!));

                    if (
                        subject.internalMarks &&
                        subject.internalMarks > -1 &&
                        subjectMetadata.fullMarksInternal &&
                        calculatePercentage(subject.internalMarks, subjectMetadata.fullMarksInternal) < 30
                    ) { // Internal Failure
                        subject.status = "F(IN)";
                    }
                    else if (
                        subject.practicalMarks != null &&
                        subject.practicalMarks > -1 &&
                        subjectMetadata.fullMarksPractical &&
                        calculatePercentage(subject.practicalMarks, subjectMetadata.fullMarksPractical) < 30
                    ) { // Practical Failure
                        subject.status = "F(PR)";
                    }
                    else if (
                        subject.theoryMarks != null &&
                        subject.theoryMarks > -1 &&
                        subjectMetadata.fullMarksTheory &&
                        calculatePercentage(subject.theoryMarks, subjectMetadata.fullMarksTheory) < 30
                    ) { // Theory Failure
                        subject.status = "F(TH)";
                    }
                    else { // Default
                        subject.status = "F";
                    }




                } else {
                    subject.status = "P";
                }

                if (subject.tgp && Number(subject.tgp) < 0) subject.tgp = null;
                if (subject.ngp && Number(subject.ngp) < 0) subject.ngp = null;
                if (subject.totalMarks && subject.totalMarks < 0) subject.totalMarks = null;

                await db.
                    update(subjectModel)
                    .set(subject)
                    .where(eq(subjectModel.id, subject.id!));

            }
        }
        console.log("done refactor for grade and status in subject table, page:", i + 1, "/", pages);
    }

}

export async function addMarksheet(
    marksheet: MarksheetType,
    user: User,
): Promise<MarksheetType | null> {
    // Return if the student not found
    let student: Student | null = null;
    if (marksheet.studentId) {
        student = await findStudentById(marksheet.studentId);
    }

    if (!student) {
        const [rows] = (await mysqlConnection.query(`
                SELECT * 
                FROM studentpersonaldetails
                WHERE univregno = ${marksheet.academicIdentifier.registrationNumber};
        `)) as [OldStudent[], any];

        const foundStudent = rows[rows.length - 1];
        if (!foundStudent) {
            console.error("Unable to find the student");
            return null;
        }

        student = await insertStudent(foundStudent as OldStudent);
    }

    // Step 1: Create the marksheet
    const [newMarksheet] = await db
        .insert(marksheetModel)
        .values({
            studentId: student.id as number,
            semester: marksheet.semester,
            year: marksheet.year,
            source: "ADDED",
            createdByUserId: user.id as number,
            updatedByUserId: user.id as number,
        })
        .returning();
    // Step 2: Add the subjects
    for (let i = 0; i < marksheet.subjects.length; i++) {
        marksheet.subjects[i].marksheetId = newMarksheet.id;
        marksheet.subjects[i] = (await addSubject(
            marksheet.subjects[i],
        )) as SubjectType;
    }
    // Step 3: Update the marksheet fields like SGPA, CGPA, Classification
    newMarksheet.sgpa = calculateSGPA(marksheet);
    if (newMarksheet.semester === 6) {
        newMarksheet.cgpa =
            (await calculateCGPA(newMarksheet.studentId))?.toString() ?? null;
        if (newMarksheet.cgpa) {
            newMarksheet.classification =
                (await getClassification(+newMarksheet.cgpa, marksheet.studentId)) ??
                null;
        }
    }

    const [updatedMarksheet] = await db
        .update(marksheetModel)
        .set(newMarksheet)
        .where(eq(marksheetModel.id, newMarksheet.id))
        .returning();

    if (!updatedMarksheet) {
        throw Error("Unable to save the marksheet...!");
    }

    const formattedMarksheet = await marksheetResponseFormat(updatedMarksheet);

    if (!formattedMarksheet) {
        return null;
    }

    await postMarksheetOperation(formattedMarksheet as MarksheetType);

    return formattedMarksheet;
}

export const getAllMarks = async (
    page: number = 1,
    pageSize: number = 10,
    searchText?: string,
    stream?: string,
    year?: number,
    semester?: number,
    isExport: boolean = false // New flag for export mode
) => {
    const offset = (page - 1) * pageSize;

    const baseQuery = db
        .select({
            id: marksheetModel.studentId,
            rollNumber: academicIdentifierModel.rollNumber,
            registrationNumber: academicIdentifierModel.registrationNumber,
            uid: academicIdentifierModel.uid,
            name: userModel.name,
            stream: degreeModel.name,
            framework: streamModel.framework,
            semester: marksheetModel.semester,
            year1: subjectModel.year1,
            year2: subjectModel.year2,
            marksheetCode: subjectMetadataModel.marksheetCode,
            subjectName: subjectMetadataModel.name,
            theoryMarks: subjectModel.theoryMarks,
            practicalMarks: subjectModel.practicalMarks,
            internalMarks: subjectModel.internalMarks,
            fullMarks: subjectMetadataModel.fullMarks,
            obtainedMarks: subjectModel.totalMarks,
            credit: subjectMetadataModel.credit,
            sgpa: marksheetModel.sgpa,
            cgpa: marksheetModel.cgpa,
            letterGrade: subjectModel.letterGrade,
            status: subjectModel.status,
            remarks: marksheetModel.remarks,
        })
        .from(marksheetModel)
        .leftJoin(subjectModel, eq(marksheetModel.id, subjectModel.marksheetId))
        .leftJoin(
            academicIdentifierModel,
            eq(marksheetModel.studentId, academicIdentifierModel.studentId),
        )
        .leftJoin(studentModel, eq(marksheetModel.studentId, studentModel.id))
        .leftJoin(userModel, eq(studentModel.userId, userModel.id))
        .leftJoin(streamModel, eq(academicIdentifierModel.streamId, streamModel.id))
        .leftJoin(degreeModel, eq(streamModel.degreeId, degreeModel.id))
        .leftJoin(
            subjectMetadataModel,
            eq(subjectModel.subjectMetadataId, subjectMetadataModel.id),
        );

    const countQuery = db
        .select({ count: count() })
        .from(marksheetModel)
        .leftJoin(subjectModel, eq(marksheetModel.id, subjectModel.marksheetId))
        .leftJoin(
            academicIdentifierModel,
            eq(marksheetModel.studentId, academicIdentifierModel.studentId),
        )
        .leftJoin(studentModel, eq(marksheetModel.studentId, studentModel.id))
        .leftJoin(userModel, eq(studentModel.userId, userModel.id))
        .leftJoin(streamModel, eq(academicIdentifierModel.streamId, streamModel.id))
        .leftJoin(degreeModel, eq(streamModel.degreeId, degreeModel.id))
        .leftJoin(
            subjectMetadataModel,
            eq(subjectModel.subjectMetadataId, subjectMetadataModel.id),
        );

    const whereConditions = [];

    if (searchText?.trim()) {
        const searchPattern = `%${searchText.trim()}%`;
        whereConditions.push(
            or(
                ilike(userModel.name, searchPattern),
                ilike(academicIdentifierModel.rollNumber, searchPattern),
                ilike(academicIdentifierModel.registrationNumber, searchPattern),
            ),
        );
    }

    if (stream?.trim()) {
        whereConditions.push(eq(degreeModel.name, stream.trim()));
    }

    if (year && !isNaN(year)) {
        whereConditions.push(eq(marksheetModel.year, year));
    }

    if (semester && !isNaN(semester) && semester >= 1 && semester <= 12) {
        whereConditions.push(eq(marksheetModel.semester, semester));
    }

    if (whereConditions.length > 0) {
        const combinedCondition = and(...whereConditions);
        baseQuery.where(combinedCondition);
        countQuery.where(combinedCondition);
    }


    try {
        // For exports, we only need the data without pagination
        if (isExport) {
            const results = await baseQuery
                .orderBy(desc(academicIdentifierModel.registrationNumber));

            return {
                data: results,
                total: results.length,
                currentPage: 1,
                pageSize: results.length,
                totalPages: 1,
            };
        }


        const [results, totalCountResult] = await Promise.all([
            baseQuery
                .orderBy(desc(academicIdentifierModel.registrationNumber))
                .limit(pageSize)
                .offset(offset),
            countQuery,
        ]);

        const totalCount = Number(totalCountResult[0]?.count ?? 0);

        return {
            data: results,
            total: totalCount,
            currentPage: page,
            pageSize: pageSize,
            totalPages: Math.ceil(totalCount / pageSize),
        };
    } catch (error) {
        console.error("Error in getAllMarks:", error);
        throw error;
    }
};

export async function uploadFile(
    fileName: string,
    user: User,
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
): Promise<boolean> {
    // Read the file from the `/public/temp/` directory
    socket.emit("progress", { stage: "reading", message: "Reading file..." });

    const filePath = path.resolve(
        directoryName,
        "../../../..",
        "public",
        "temp",
        fileName,
    );
    console.log("\nReading file...");
    let dataArr = await readExcelFile<MarksheetRow>(filePath);
    // console.log(dataArr.length);

    socket.emit("progress", {
        stage: "reading_done",
        message: "File read success...",
    });
    console.log("\nFile read successfully. Validating data...\n");

    // Check if all the entries are valid.
    console.log("validating data...");
    const { exceptionalArr, formattedArr: cleanedData } = await validateData(dataArr, socket);
    dataArr = cleanedData;


    // console.log("cleaning data...");
    // dataArr = await cleanData(dataArr, socket);
    // console.log("rec'd clean data:", dataArr.length, dataArr[0]);
    socket.emit("progress", {
        stage: "processing_data",
        message: "Processing the data...",
    });
    // Step 1: Find the smallest year from the dataArr[]
    const startingYear = Math.min(...dataArr.map((row) => row.year1));

    // Step 2: Fetch all the streams
    const streams = await findAllStreams();

    console.log("in main uploadData(), startingYear:", startingYear);

    if (!user) {
        console.log("user:", user);
        return false;
    }

    // Step 3: Loop over the array.
    for (let y = startingYear; y <= new Date().getFullYear(); y++) {
        // Iterate over the years

        for (let s = 0; s < streams.length; s++) {
            // Iterate over the streams

            for (let sem = 1; sem <= 6; sem++) {
                // Iterate over the semesters
                // Filter the data
                const arr = await filterData({
                    dataArr,
                    semester: sem,
                    stream: streams[s],
                    year: y,
                });

                console.log(
                    "after filter-data, arr:",
                    arr.length,
                    "dataArr:",
                    dataArr.length,
                );

                // sendUpdate(`Processing year ${y}, stream ${streams[s]}, semester ${sem}...`);

                // Iterate over the arr[]
                const doneRollNumber: string[] = [];
                for (let i = 0; i < arr.length; i++) {
                    // Skip the `uid` if already processed
                    if (doneRollNumber.includes(arr[i].roll_no)) continue;

                    // Select all the subject rows for the uid: arr[i].roll_no
                    const subjectArr = arr.filter((row) => {
                        // Normalize roll numbers before comparison
                        const currentRollNo = (row.roll_no || "")
                            .trim()
                            .replace(/[^a-zA-Z0-9]/g, "");
                        const targetRollNo = (arr[i].roll_no || "")
                            .trim()
                            .replace(/[^a-zA-Z0-9]/g, "");
                        return currentRollNo === targetRollNo;
                    });

                    console.log("subjectArr:", subjectArr.length);

                    if (subjectArr.length === 0) {
                        console.error(
                            `No subjects found for roll number: ${arr[i].roll_no}`,
                        );
                        continue;
                    }

                    // console.log("processing student:", subjectArr.length, subjectArr[0].roll_no, "dataArr:", dataArr.length, "arr:", arr.length);
                    // Process the student
                    try {
                        const result = await processStudentV2(
                            subjectArr,
                            streams[s] as StreamType,
                            sem,
                            fileName,
                            user,
                        );
                        console.log("marksheet result:", result);
                        // Mark the uid as done
                        doneRollNumber.push(arr[i].roll_no);

                        socket.emit("progress", {
                            stage: "processing_data",
                            message: `Done ${subjectArr[0].name} | year: ${y} | semester: ${sem} |  Registration No.: ${subjectArr[0].registration_no} | Roll No.: ${subjectArr[0].roll_no}`,
                        });
                    } catch (error) {
                        console.error(
                            `Error processing student with roll number ${arr[i].roll_no}:`,
                            error,
                        );
                        socket.emit("progress", {
                            stage: "processing_data",
                            message: `Error processing ${arr[i].roll_no}: ${error instanceof Error ? error.message : String(error)}`,
                        });
                    }
                }
                // console.log(`Processed year ${y} | stream ${streams[s]} | semester ${sem} | Total: ${arr.length}`);
                socket.emit("progress", {
                    stage: "processing_data",
                    message: `Processed year ${y} | stream ${streams[s]} | semester ${sem} | Total: ${arr.length}`,
                });
            }
        }
    }

    console.log("user:", user);
    console.log(dataArr[23]);
    console.log("done ");
    socket.emit("progress", {
        stage: "completed",
        message: "File processed successfully!",
    });
    return true;
}




export async function refactorSubjectName(fileName: string): Promise<boolean> {
    // Read the file from the `/public/temp/` directory

    const filePath = path.resolve(
        directoryName,
        "../../../..",
        "public",
        "temp",
        fileName,
    );
    console.log("\nReading file...");
    let dataArr = await readExcelFile<MarksheetRow>(filePath);
    // console.log(dataArr.length);

    console.log("\nFile read successfully. Validating data...\n");

    // Check if all the entries are valid.
    // // console.log("validating data...");
    // try {
    //     await validateData(dataArr);
    // } catch (error) {
    //     throw error;
    // }

    // console.log("cleaning data...");
    // dataArr = await cleanData(dataArr);
    // console.log("rec'd clean data:", dataArr.length, dataArr[0]);

    // Step 1: Find the smallest year from the dataArr[]
    const startingYear = Math.min(...dataArr.map((row) => row.year1));

    // Step 2: Fetch all the streams
    const streams = await findAllStreams();

    console.log("in main uploadData(), startingYear:", startingYear);


    // Step 3: Loop over the array.
    for (let y = startingYear; y <= new Date().getFullYear(); y++) {
        // Iterate over the years

        for (let s = 0; s < streams.length; s++) {
            // Iterate over the streams

            for (let sem = 1; sem <= 6; sem++) {
                // Iterate over the semesters
                // Filter the data
                const arr = await filterData({
                    dataArr,
                    semester: sem,
                    stream: streams[s],
                    year: y,
                });

                console.log(
                    "after filter-data, arr:",
                    arr.length,
                    "dataArr:",
                    dataArr.length,
                );

                // sendUpdate(`Processing year ${y}, stream ${streams[s]}, semester ${sem}...`);

                // Iterate over the arr[]
                const doneRollNumber: string[] = [];

                for (let i = 0; i < arr.length; i++) {
                    // Skip the `uid` if already processed
                    if (doneRollNumber.includes(arr[i].roll_no)) continue;

                    // Select all the subject rows for the uid: arr[i].roll_no
                    const subjectArr = arr.filter((row) => {
                        // Normalize roll numbers before comparison
                        const currentRollNo = (row.roll_no || "")
                            .trim()
                            .replace(/[^a-zA-Z0-9]/g, "");
                        const targetRollNo = (arr[i].roll_no || "")
                            .trim()
                            .replace(/[^a-zA-Z0-9]/g, "");
                        return currentRollNo === targetRollNo;
                    });

                    console.log("subjectArr:", subjectArr.length);

                    if (subjectArr.length === 0) {
                        console.error(
                            `No subjects found for roll number: ${arr[i].roll_no}`,
                        );
                        continue;
                    }

                    // console.log("processing student:", subjectArr.length, subjectArr[0].roll_no, "dataArr:", dataArr.length, "arr:", arr.length);
                    // Process the student
                    try {
                        console.log(`Doing ${i + 1} / ${arr.length}`)
                        const result = await processSubjectMetadataName(
                            subjectArr,
                            streams[s] as StreamType,
                            sem,
                        );
                        console.log("marksheet result:", result);
                        // Mark the uid as done
                        doneRollNumber.push(arr[i].roll_no);

                        // socket.emit("progress", {
                        //     stage: "processing_data",
                        //     message: `Done ${subjectArr[0].name} | year: ${y} | semester: ${sem} |  Registration No.: ${subjectArr[0].registration_no} | Roll No.: ${subjectArr[0].roll_no}`,
                        // });
                    } catch (error) {
                        console.error(
                            `Error processing student with roll number ${arr[i].roll_no}:`,
                            error,
                        );

                    }
                }
                // console.log(`Processed year ${y} | stream ${streams[s]} | semester ${sem} | Total: ${arr.length}`);

            }
        }
    }


    console.log(dataArr[23]);
    console.log("done ");

    return true;
}




export async function saveMarksheet(
    id: number,
    marksheet: MarksheetType,
    user: User,
) {
    const [foundMarksheet] = await db
        .select()
        .from(marksheetModel)
        .where(eq(marksheetModel.id, id));
    if (!foundMarksheet) {
        return null;
    }
    // Update the subjects
    for (let i = 0; i < marksheet.subjects.length; i++) {
        if (!marksheet.subjects[i].id) {
            marksheet.subjects[i] = (await addSubject(
                marksheet.subjects[i],
            )) as SubjectType;
        } else {
            marksheet.subjects[i] = (await saveSubject(
                marksheet.subjects[i].id as number,
                marksheet.subjects[i],
            )) as SubjectType;
        }
    }

    foundMarksheet.sgpa = calculateSGPA(marksheet);
    if (foundMarksheet.semester === 6) {
        foundMarksheet.cgpa =
            (await calculateCGPA(foundMarksheet.studentId))?.toString() ?? null;
        if (foundMarksheet.cgpa) {
            foundMarksheet.classification =
                (await getClassification(+foundMarksheet.cgpa, marksheet.studentId)) ??
                null;
        }
    }

    foundMarksheet.updatedByUserId = user.id as number;

    const [updatedMarksheet] = await db
        .update(marksheetModel)
        .set(foundMarksheet)
        .where(eq(marksheetModel.id, id))
        .returning();

    if (!updatedMarksheet) {
        throw Error("Unable to save the marksheet...!");
    }

    const formattedMarksheet = await marksheetResponseFormat(updatedMarksheet);

    if (!formattedMarksheet) {
        return null;
    }

    await postMarksheetOperation(formattedMarksheet as MarksheetType);

    return formattedMarksheet;
}

export async function findMarksheetLogs(
    page: number = 1,
    pageSize: number = 10,
    searchText?: string,
): Promise<MarksheetLog[]> {
    const result = await db
        .select({
            item: marksheetModel.file,
            source: marksheetModel.source,
            file: marksheetModel.file,
            createdByUserId: marksheetModel.createdByUserId,
            updatedByUserId: marksheetModel.updatedByUserId,
            createdAt: marksheetModel.createdAt,
            updatedAt: marksheetModel.updatedAt,
        })
        .from(marksheetModel)
        .where(
            eq(
                marksheetModel.createdAt,
                db
                    .select({ maxCreatedAt: max(marksheetModel.createdAt) })
                    .from(marksheetModel)
                    .where(eq(marksheetModel.file, marksheetModel.file)),
            ),
        )
        .orderBy(desc(marksheetModel.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    // Find the framework

    // Map the query result to the MarksheetLog interface
    const logs = await Promise.all(
        result.map(async (row) => {
            const marksheets = await db
                .select()
                .from(marksheetModel)
                .where(eq(marksheetModel.createdAt, row.createdAt));
            if (!marksheets.length) {
                return null;
            }
            const data = await db
                .select()
                .from(academicIdentifierModel)
                .leftJoin(
                    marksheetModel,
                    eq(marksheetModel.studentId, academicIdentifierModel.studentId),
                )
                .where(eq(marksheetModel.id, marksheets[0].id));

            // console.log("data:", data)

            // console.log("data[0].academic_identifiers.streamId:", data[0].academic_identifiers.streamId)
            const foundStream = await findStreamById(
                data[0].academic_identifiers.streamId as number,
            );
            // console.log(foundStream)

            const createdByUser = row.createdByUserId
                ? await findUserById(row.createdByUserId)
                : null;
            const updatedByUser =
                row.updatedByUserId && row.updatedByUserId !== row.createdByUserId
                    ? await findUserById(row.updatedByUserId)
                    : createdByUser;

            return {
                item: foundStream?.degree.name,
                source: row.source ?? "UNKNOWN",
                file: row.file,
                createdByUser,
                updatedByUser,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
            } as MarksheetLog;
        }),
    );
    return logs.filter((log): log is MarksheetLog => log !== null);
}

export async function findMarksheetById(
    id: number,
): Promise<MarksheetType | null> {
    const [foundMarksheet] = await db
        .select()
        .from(marksheetModel)
        .where(eq(marksheetModel.id, id));

    const formattedMarksheet = await marksheetResponseFormat(foundMarksheet);

    return formattedMarksheet;
}

export async function findMarksheetsByStudentId(
    studentId: number,
    semester?: number,
): Promise<MarksheetType[]> {
    const filters = [
        semester ? eq(marksheetModel.semester, semester) : undefined,
        eq(marksheetModel.studentId, studentId)
    ].filter(Boolean);

    const marksheets = await db
        .select()
        .from(marksheetModel)
        .where(and(...filters));

    let formattedMarksheets: MarksheetType[] = [];
    formattedMarksheets = (
        await Promise.all(
            marksheets.map(async (marksheet) => {
                const tmpMarksheet = await marksheetResponseFormat(marksheet);
                return tmpMarksheet;
            }),
        )
    ).filter(
        (marksheet): marksheet is MarksheetType =>
            marksheet !== null && marksheet !== undefined,
    );

    return formattedMarksheets;
}

export async function removeMarksheet(id: number): Promise<boolean | null> {
    return null;
}

export async function removeMarksheetByStudentId(
    studentId: number,
): Promise<boolean | null> {
    return null;
}

async function marksheetResponseFormat(
    marksheet: Marksheet,
): Promise<MarksheetType | null> {
    if (!marksheet) {
        return null;
    }

    const subjects = await findSubjectsByMarksheetId(marksheet.id as number);

    const academicIdentifier = await findAcademicIdentifierByStudentId(
        marksheet.studentId as number,
    );

    const createdByUser = await findUserById(marksheet.createdByUserId as number);
    const updatedByUser = await findUserById(marksheet.updatedByUserId as number);

    const [student] = await db
        .select()
        .from(studentModel)
        .where(eq(studentModel.id, marksheet.studentId as number));
    const [user] = await db
        .select()
        .from(userModel)
        .where(eq(userModel.id, student.userId as number));

    const formattedMarksheet: MarksheetType = {
        ...marksheet,
        name: user.name as string,
        subjects,
        academicIdentifier: academicIdentifier as AcademicIdentifierType,
        createdByUser: createdByUser as UserType,
        updatedByUser: updatedByUser as UserType,
    };

    return formattedMarksheet;
}

interface FilterDataProps {
    dataArr: MarksheetRow[];
    stream: StreamType;
    year: number;
    semester: number;
}

async function filterData({
    dataArr,
    stream,
    year,
    semester,
}: FilterDataProps) {
    const isBCOM = stream?.degree.name === "BCOM";
    const yearKey = isBCOM && stream.framework === "CBCS" ? "year2" : "year1";

    console.log("FilterData - Looking for:", {
        degreeName: stream?.degree.name,
        degreeProgramme: stream.degreeProgramme,
        year,
        framework: stream.framework,
        semester,
        yearKey,
    });

    // First check if matching data exists
    const matchingData = dataArr.filter((row) => {
        const streamMatch = cleanStream(row.stream) === stream?.degree.name;
        const programMatch =
            row.course.toUpperCase().trim() === stream.degreeProgramme;
        const yearMatch = Number(row[yearKey]) === year;
        const frameworkMatch = row.framework === stream.framework;
        const semesterMatch = Number(row.semester) === semester;

        return (
            streamMatch &&
            programMatch &&
            yearMatch &&
            frameworkMatch &&
            semesterMatch
        );
    });

    console.log(`FilterData - Found ${matchingData.length} matching rows`);

    if (matchingData.length > 0) {
        const sampleRow = matchingData[0];
        console.log("Sample row values:", {
            stream: sampleRow.stream,
            cleanedStream: cleanStream(sampleRow.stream),
            course: sampleRow.course,
            year: sampleRow[yearKey],
            yearAsNumber: Number(sampleRow[yearKey]),
            framework: sampleRow.framework,
            semester: sampleRow.semester,
            semesterAsNumber: Number(sampleRow.semester),
        });
    }

    return matchingData;
}

const cleanStream = (value: unknown): string | undefined => {
    if (typeof value === "string") {
        return value.replace(/[\s\-\/\.]/g, "").trim();
    }
    return undefined; // Return undefined for non-string values
};

// Process Student marksheet and subjects (v2)
async function processStudentV2(
    arr: MarksheetRow[],
    stream: StreamType,
    semester: number,
    fileName: string,
    user: User,
): Promise<{ marksheet: Marksheet | null, message?: string }> {
    console.log("user:", user);
    console.log("in processStudentV2(), arr:", arr.length);
    if (arr.length === 0) {
        console.log("No data found in the marksheet");
        return { marksheet: null, message: "No data found in the marksheet" };
    }
    let student: Student | null = null;
    // Step 1: Check if the roll_no already exist
    const [foundAcademicIdentifier] = await db
        .select()
        .from(academicIdentifierModel)
        .where(
            eq(
                sql`REGEXP_REPLACE(${academicIdentifierModel.rollNumber}, '[^a-zA-Z0-9]', '', 'g')`,
                arr[0].roll_no.replace(/[^a-zA-Z0-9]/g, ""),
            ),
        );

    if (!foundAcademicIdentifier) {
        // Create new student
        const [rows] = (await mysqlConnection.query(`
                SELECT * 
                FROM studentpersonaldetails
                WHERE univregno = ${arr[0].registration_no};
        `)) as [OldStudent[], any];

        const foundStudent = rows[rows.length - 1];
        if (!foundStudent) {
            console.error("Unable to find the student");
            return { marksheet: null, message: "Unable to find the student" };
        }

        student = await insertStudent(foundStudent as OldStudent);
    } else {
        foundAcademicIdentifier.streamId = stream.id as number;
        await db
            .update(academicIdentifierModel)
            .set({ streamId: stream.id as number })
            .where(eq(academicIdentifierModel.id, foundAcademicIdentifier.id));
        const [foundStudent] = await db
            .select()
            .from(studentModel)
            .where(eq(studentModel.id, foundAcademicIdentifier.studentId as number));
        student = foundStudent;
    }

    if (!student) {
        return { marksheet: null, message: "Unable to find the student by the provided roll_number" };
    }

    let marksheet: Marksheet = {
        studentId: student.id as number,
        semester: arr[0].semester,
        year: arr[0].year1,
        source: "FILE_UPLOAD",
        file: fileName,
        createdByUserId: user.id as number,
        updatedByUserId: user.id as number,
    };

    // Check if the marksheet exist
    const existingMarksheets = await db
        .select()
        .from(marksheetModel)
        .where(
            and(
                eq(marksheetModel.semester, arr[0].semester),
                eq(marksheetModel.studentId, student.id!)
            )
        )
        .orderBy(desc(marksheetModel.year));

    if (existingMarksheets.some(mks => mks.year == arr[0].year1)) {
        const tmp = existingMarksheets.filter(mks => mks.year == arr[0].year1)[0];
        // return { marksheet: tmp, message: "This marksheet already exist. So, adding further will be resulted as duplicate" }

        const [updatedMks] = await db
            .update(marksheetModel)
            .set({
                file: fileName,
                updatedByUserId: user.id as number,
            })
            .where(eq(marksheetModel.id, tmp.id))
            .returning();

        marksheet = updatedMks;
        console.log("Updated existing marksheet:", marksheet);
    }
    else {
        marksheet = (
            await db.insert(marksheetModel).values(marksheet).returning()
        )[0];
    }

    const subjects: Subject[] = [];

    const subjectMetadataArr = await db
        .select()
        .from(subjectMetadataModel)
        .where(
            and(
                eq(subjectMetadataModel.streamId, stream.id as number),
                eq(subjectMetadataModel.semester, semester),
            ),
        );

    let totalMarksObtained = 0, fullMarksSum = 0, ngp_credit = 0, creditSum = 0;

    for (let i = 0; i < arr.length; i++) {
        let subjectMetadata = subjectMetadataArr.find(
            (sbj) => sbj.marksheetCode === arr[i].paperCode.toUpperCase().trim(),
        );

        if (!subjectMetadata) {
            throw Error("Invalid subject input got detected!");
            // Subject not found
            // const fullMarksInternal = arr[i].full_marks_internal
            //     ? Number(arr[i].full_marks_internal)
            //     : 0;
            // const fullMarksTheory = arr[i].full_marks_theory
            //     ? Number(arr[i].full_marks_theory)
            //     : 0;
            // const fullMarksPractical = arr[i].full_marks_practical
            //     ? Number(arr[i].full_marks_practical)
            //     : 0;
            // const fullMarks =
            //     fullMarksInternal + fullMarksTheory + fullMarksPractical;

            // const subjectName = arr[i].subjectName
            //     ? arr[i].subjectName
            //     : arr[i].paperCode;

            // const internalCredit = arr[i].internal_credit
            //     ? Number(arr[i].internal_credit)
            //     : 0;
            // const practicalCredit = arr[i].practical_credit
            //     ? Number(arr[i].practical_credit)
            //     : 0;
            // const theoryCredit = arr[i].theory_credit
            //     ? Number(arr[i].theory_credit)
            //     : 0;
            // const vivalCredit = arr[i].viva_credit ? Number(arr[i].viva_credit) : 0;
            // const projectCredit = arr[i].project_credit
            //     ? Number(arr[i].project_credit)
            //     : 0;

            // const credit = arr[i].credit
            //     ? Number(arr[i].credit)
            //     : internalCredit +
            //     practicalCredit +
            //     theoryCredit +
            //     vivalCredit +
            //     projectCredit;

            // const fullMarksProject = arr[i].full_marks_project
            //     ? Number(arr[i].full_marks_project)
            //     : 0;
            // const fullMarksViva = arr[i].full_marks_viva
            //     ? Number(arr[i].full_marks_viva)
            //     : 0;

            // try {
            //     const [newSubjectMetadata] = await db
            //         .insert(subjectMetadataModel)
            //         .values({
            //             streamId: stream.id as number,
            //             semester: Number(semester),
            //             marksheetCode: arr[i].paperCode.toUpperCase().trim(),
            //             name: arr[i].subjectName
            //                 ? arr[i].subjectName.toUpperCase().trim()
            //                 : arr[i].paperCode.toUpperCase().trim(),
            //             fullMarks,
            //             fullMarksPractical,
            //             fullMarksTheory,
            //             fullMarksInternal,
            //             internalCredit,
            //             practicalCredit,
            //             theoryCredit,
            //             vivalCredit,
            //             projectCredit,
            //             credit,
            //             fullMarksProject,
            //             fullMarksViva,
            //             category: "HONOURS",
            //         })
            //         .returning();

            //     subjectMetadata = newSubjectMetadata;
            // } catch (error) {
            //     console.error(
            //         "Error creating subject metadata:",
            //         error instanceof Error ? error.message : String(error),
            //     );
            //     console.error("For paper code:", arr[i].paperCode);
            //     console.error("With details:", {
            //         streamId: stream.id,
            //         semester,
            //         marksheetCode: arr[i].paperCode.toUpperCase().trim(),
            //     });
            //     throw error;
            // }
        }

        let subject: Subject = {
            marksheetId: marksheet.id,
            subjectMetadataId: subjectMetadata.id,
            year1: arr[i].year1,
            // year2: stream.degree.name === "BCOM" ? Number(arr[i].year2) : null,

            internalMarks: formatMarks(arr[i].internal_marks),
            internalCredit: arr[i].internal_credit
                ? Number(arr[i].internal_credit)
                : 0,
            internalYear: arr[i].internal_year ? Number(arr[i].internal_year) : null,

            practicalMarks: arr[i].practical_marks
                ? formatMarks(arr[i].practical_marks)
                : null,
            practicalCredit: arr[i].practical_credit
                ? Number(arr[i].practical_credit)
                : 0,
            practicalYear: arr[i].practical_year
                ? Number(arr[i].practical_year)
                : null,

            theoryMarks: formatMarks(arr[i].theory_marks),
            theoryCredit: arr[i].theory_credit ? Number(arr[i].theory_credit) : 0,
            theoryYear: arr[i].theory_year ? Number(arr[i].theory_year) : null,

            vivalMarks: arr[i].viva_marks ? formatMarks(arr[i].viva_marks) : null,
            vivalCredit: arr[i].viva_credit ? Number(arr[i].viva_credit) : 0,
            vivalYear: arr[i].viva_year ? Number(arr[i].viva_year) : null,

            projectMarks: arr[i].project_marks
                ? formatMarks(arr[i].project_marks)
                : null,
            projectCredit: arr[i].project_credit ? Number(arr[i].project_credit) : 0,
            projectYear: arr[i].project_year ? Number(arr[i].project_year) : null,

            totalMarks: formatMarks(arr[i].total),
            letterGrade: arr[i].grade,
            status: arr[i].status?.toUpperCase() as "PASS" | "FAIL" | "P" | "F" | "F(IN)" | "F(PR)" | "F(TH)" | "AB" | null | undefined,
            ngp: formatMarks(arr[i].ngp)?.toString(),
            tgp: formatMarks(arr[i].tgp)?.toString(),
        };

        // Check the existing subject before adding so as to get the first attemp for year1
        let existingSubject: Subject | null = null;
        for (let j = existingMarksheets.length - 1; j >= 0; j--) {
            const [tmpSubject] = await db
                .select()
                .from(subjectModel)
                .where(
                    and(
                        eq(subjectModel.marksheetId, existingMarksheets[j].id),
                        eq(subjectModel.subjectMetadataId, subjectMetadata.id),
                    )
                );

            if (tmpSubject) {
                existingSubject = tmpSubject;
                subject.year1 = existingSubject.year1
                break; // Found the first attempt, no need to check further
            };
        }

        // Calculate totalMarksObtained and fullMarksSum
        let total = formatMarks(arr[i].total);
        subject.totalMarks = total;
        const subjectPercent = subject.totalMarks ? ((subject.totalMarks * 100) / subjectMetadata.fullMarks) : null;
        if (subjectPercent && subjectPercent < 30) {
            subject.year2 = null;
        } else {
            // year2: stream.degree.name === "BCOM" ? Number(arr[i].year2) : null,
            subject.year2 = subject.year1;
        }
        totalMarksObtained += total ? total : 0;
        fullMarksSum += subjectMetadata.fullMarks;

        // Calculate NGP and set the letterGrade
        if (total) {
            let subjectPercent = (total * 100) / subjectMetadata.fullMarks;
            // Calculate NGP for each subject as % marks / 10 for each subject
            if (!subject.ngp) {
                subject.ngp = (subjectPercent / 10).toFixed(3).toString();
            }

            if (!subject.tgp) {
                subject.tgp =
                    subjectMetadata.credit && subject.ngp
                        ? (Number(subject.ngp) * subjectMetadata.credit).toFixed(3).toString()
                        : null;
            }
        }

        // Calculate sum of product of NGP and Credit
        if (subject.ngp && subjectMetadata.credit) {
            ngp_credit += +subject.ngp * subjectMetadata.credit;

            // Calculate sum of all credits
            creditSum += subjectMetadata.credit;
        }

        if (subject.tgp && Number(subject.tgp) < 0) subject.tgp = null;
        if (subject.ngp && Number(subject.ngp) < 0) subject.ngp = null;
        if (subject.totalMarks && subject.totalMarks < 0) subject.totalMarks = null;

        // Insert the subject
        subject = (await db.insert(subjectModel).values(subject).returning())[0];

        subjects.push(subject);
    }

    marksheet.sgpa = arr[0].sgpa ? String(arr[0].sgpa) : null;
    console.log("marksheet.sgpa:", marksheet.sgpa);

    marksheet.remarks = arr[0].remarks ? arr[0].remarks : null;
    marksheet.cgpa = arr[0].cgpa ? arr[0].cgpa.toString().trim() : null;
    marksheet.classification = arr[0].classification ? arr[0].classification.trim() : null;

    marksheet = (
        await db
            .update(marksheetModel)
            .set(marksheet)
            .where(eq(marksheetModel.id, marksheet.id as number))
            .returning()
    )[0];

    const updatedMarksheet = await marksheetResponseFormat(marksheet);

    console.log("marksheet:", marksheet);

    await postMarksheetOperation(updatedMarksheet as MarksheetType);

    return { marksheet };
}



async function processSubjectMetadataName(
    arr: MarksheetRow[],
    stream: StreamType,
    semester: number,
): Promise<void> {
    console.log("in processSubjectMetadataName(), arr:", arr.length);
    if (arr.length === 0) {
        console.log("No data found in the marksheet");
        return;
    }

    const subjectMetadataArr = await db
        .select()
        .from(subjectMetadataModel)
        .where(
            and(
                eq(subjectMetadataModel.streamId, stream.id as number),
                eq(subjectMetadataModel.semester, semester),
            ),
        );

    for (let i = 0; i < arr.length; i++) {
        let subjectMetadata = subjectMetadataArr.find(
            (sbj) => sbj.marksheetCode == arr[i].paperCode.toUpperCase().trim(),
        );

        if (!subjectMetadata) { // Subject not found
            continue;
        }
        else {
            await db.update(subjectMetadataModel)
                .set({
                    name: arr[i].subjectName
                        ? arr[i].subjectName.toUpperCase().trim()
                        : null
                })
                .where(eq(subjectMetadataModel.id, subjectMetadata.id));
        }
    }

    return;

}
async function postMarksheetOperation(marksheet: MarksheetType) {
    const [foundStudent] = await db
        .select()
        .from(studentModel)
        .where(eq(studentModel.id, marksheet.studentId));
    if (!foundStudent) {
        return;
    }
    // For Passing the semester, update the student fields
    if (marksheet.sgpa) {
        // Updated the last passed year
        foundStudent.lastPassedYear = marksheet.year;
        // Update the student's status
        if (marksheet.semester === 6) {
            // foundStudent.active = true;
            // foundStudent.alumni = true;
        }
        await db
            .update(studentModel)
            .set(foundStudent)
            .where(eq(studentModel.id, foundStudent.id as number));
    }
    // Update the registration_number and roll_number, if found empty
    const [foundAcademicIdentifier] = await db
        .select()
        .from(academicIdentifierModel)
        .where(eq(academicIdentifierModel.studentId, foundStudent.id));
    if (!foundAcademicIdentifier) {
        return;
    }
    if (!foundAcademicIdentifier.registrationNumber) {
        foundAcademicIdentifier.registrationNumber = marksheet.academicIdentifier
            .registrationNumber as string;
    }
    if (!foundAcademicIdentifier.rollNumber) {
        foundAcademicIdentifier.rollNumber = marksheet.academicIdentifier
            .rollNumber as string;
    }
    if (!foundAcademicIdentifier.streamId) {
        foundAcademicIdentifier.streamId = marksheet.academicIdentifier.stream
            ?.id as number;
    }
    // if (!foundAcademicIdentifier.course) {
    //     foundAcademicIdentifier.course = marksheet.academicIdentifier.course ?? null;
    // }
    // if (!foundAcademicIdentifier.frameworkType) {
    //     foundAcademicIdentifier.frameworkType = marksheet.subjects[0].subjectMetadata.framework;
    // }
    // if (!foundAcademicIdentifier.section) {
    //     foundAcademicIdentifier.section = marksheet.academicIdentifier.section ?? null;
    // }

    await db
        .update(academicIdentifierModel)
        .set(foundAcademicIdentifier)
        .where(
            eq(academicIdentifierModel.id, foundAcademicIdentifier.id as number),
        );

    return;
}

export async function validateData(
    dataArr: MarksheetRow[],
    socket?: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
) {
    if (socket) {
        socket.emit("progress", {
            stage: "validating_data",
            message: "Validating the data provided...",
        });
    }
    // Step 1: Find the smallest year from the dataArr[]
    const years = dataArr
        .map((row) => Number(row.year1))
        .filter((y) => !isNaN(y));
    if (years.length === 0) {
        throw Error("No valid years found in the data");
    }

    const startingYear = Math.min(...years);
    console.log("in validateData(), startingYear:", startingYear);

    if (dataArr.length === 0) {
        throw Error("Empty data array");
    }

    console.log("Sample row from data:", dataArr[0]);

    // Step 2: Fetch all the streams
    const streams = await findAllStreams();
    console.log(
        "Available streams:",
        streams.map((s) => ({
            id: s.id,
            name: s.degree.name,
            programme: s.degreeProgramme,
            framework: s.framework,
        })),
    );

    const exceptionalArr: MarksheetRow[] = [];
    const formattedArr: MarksheetRow[] = [];

    // Step 3: Loop over the array.
    for (let y = startingYear; y <= new Date().getFullYear(); y++) {
        // Iterate over the years

        for (let s = 0; s < streams.length; s++) {
            // Iterate over the streams

            for (let sem = 1; sem <= 6; sem++) {
                // Iterate over the semesters
                // Filter the data
                const arr = await filterData({
                    dataArr,
                    semester: sem,
                    stream: streams[s],
                    year: y,
                });

                // Iterate over the arr[]
                const doneRollNumber = new Set<string>();
                for (let i = 0; i < arr.length; i++) {
                    // Skip the `uid` if already processed
                    if (doneRollNumber.has(arr[i].roll_no)) continue;

                    // Add as doing
                    doneRollNumber.add(arr[i].roll_no);

                    // Select all the subject rows for the uid: arr[i].roll_no
                    const studentMksArr = arr.filter(
                        (ele) => ele.roll_no === arr[i].roll_no,
                    );

                    // Fetch the subjects
                    // console.log("streamId:", streams[s].id);
                    // console.log("sem:", sem);
                    const subjectMetadataArr = await db
                        .select()
                        .from(subjectMetadataModel)
                        .where(
                            and(
                                eq(subjectMetadataModel.streamId, streams[s].id as number),
                                eq(subjectMetadataModel.semester, sem),
                            ),
                        );

                    // Check all the subjects (range of marks, subject name, duplicates)
                    const seenSubjects = new Set<number>(); // Track subject IDs for duplicate check
                    // console.log(subjectMetadataArr);
                    for (let k = 0; k < studentMksArr.length; k++) {
                        let subjectMetadata = subjectMetadataArr.find(
                            (ele) =>
                                ele.marksheetCode ===
                                studentMksArr[k].paperCode.toUpperCase().trim(),
                        );
                        console.log(
                            "found subjectMetadata:",
                            subjectMetadata?.marksheetCode,
                        );

                        if (!subjectMetadata) {
                            // Collect the marksheet entries for such students
                            studentMksArr[k].errorMessage = "The given subject is not found";
                            exceptionalArr.push(studentMksArr[k]);
                            continue;
                        }

                        // ✅ Check for duplicate subjects
                        if (seenSubjects.has(subjectMetadata?.id as number)) {
                            continue;
                        }

                        seenSubjects.add(subjectMetadata?.id as number);

                        // console.log("subjectMetadata:", subjectMetadata)

                        // console.log("checking for :", studentMksArr[k]);
                        // ✅ Check invalid marks range (Assuming 0-100 as valid)

                        let {
                            internal_marks,
                            theory_marks,
                            total,
                            practical_marks,
                            full_marks_practical,
                            paperCode,
                            stream,
                        } = studentMksArr[k];

                        internal_marks = formatMarks(internal_marks)?.toString() || null;
                        theory_marks = formatMarks(theory_marks)?.toString() || null;
                        practical_marks = formatMarks(practical_marks)?.toString() || null;
                        total = formatMarks(total)?.toString() || null;
                        // practical_marks = stream.toUpperCase() !== "BCOM" ? formatMarks(practical_marks)?.toString() || null : null;

                        if (
                            internal_marks &&
                            subjectMetadata?.fullMarksInternal &&
                            +internal_marks > (subjectMetadata?.fullMarksInternal as number)
                        ) {
                            // TODO: Collect the marksheet entries for such students
                            console.log(
                                "Internal Marks:",
                                internal_marks,
                                "/",
                                subjectMetadata?.fullMarksInternal,
                            );
                            studentMksArr[k].errorMessage = "Invalid internal marks";
                            exceptionalArr.push(studentMksArr[k]);
                            continue;
                        }

                        if (
                            theory_marks &&
                            subjectMetadata?.fullMarksTheory &&
                            +theory_marks > (subjectMetadata?.fullMarksTheory as number)
                        ) {
                            // TODO: Collect the marksheet entries for such students
                            console.log(
                                "Theory Marks:",
                                theory_marks,
                                "/",
                                subjectMetadata?.fullMarksTheory,
                            );
                            studentMksArr[k].errorMessage = "Invalid theory marks";
                            exceptionalArr.push(studentMksArr[k]);
                            continue;
                        }

                        if (
                            practical_marks &&
                            subjectMetadata?.fullMarksPractical &&
                            +practical_marks > (subjectMetadata?.fullMarksPractical as number)
                        ) {
                            // TODO: Collect the marksheet entries for such students
                            console.log(
                                "Practical Marks:",
                                +practical_marks,
                                "/",
                                subjectMetadata?.fullMarksPractical,
                            );
                            console.log(
                                "in practical_marks:",
                                practical_marks,
                                "arr[i].full_marks_practical:",
                                full_marks_practical,
                            );
                            console.log(paperCode);
                            studentMksArr[k].errorMessage = "Invalid practical marks";
                            exceptionalArr.push(studentMksArr[k]);
                            continue;
                        }

                        if (
                            total &&
                            subjectMetadata?.fullMarks &&
                            +total > (subjectMetadata?.fullMarks as number)
                        ) {
                            // TODO: Collect the marksheet entries for such students
                            console.log(
                                "Total Marks:",
                                total,
                                "/",
                                subjectMetadata?.fullMarks,
                            );
                            studentMksArr[k].errorMessage = "Invalid total marks";
                            exceptionalArr.push(studentMksArr[k]);
                            continue;
                        }

                        // Clean the data and add it to the formatted arr
                        const tmpEntry = {
                            ...studentMksArr[k],
                            stream: streams[s].degree.name.toUpperCase().trim(),
                            uid: studentMksArr[k].uid.toString().toUpperCase().trim(),
                            registration_no: cleanTilde(studentMksArr[k].registration_no) as string,
                            roll_no: cleanTilde(studentMksArr[k].roll_no) as string,
                            course: studentMksArr[k].course.toUpperCase().trim(),
                            name: studentMksArr[k].name.toUpperCase().trim(),
                            paperCode: studentMksArr[k].paperCode.toUpperCase().trim(),
                            framework: studentMksArr[k].framework.toUpperCase().trim() as "CBCS" | "CCF",
                            specialization: studentMksArr[k].specialization
                                ? studentMksArr[k].specialization!.toUpperCase().trim()
                                : null,
                            section: studentMksArr[k].section ? studentMksArr[k].section!.toUpperCase().trim() : null,
                            internal_marks: formatMarks(studentMksArr[k].internal_marks)?.toString() || null,
                            theory_marks: formatMarks(studentMksArr[k].theory_marks)?.toString() || null,
                            practical_marks:
                                formatMarks(studentMksArr[k].practical_marks)?.toString() || null,
                            total: formatMarks(studentMksArr[k].total)?.toString() || null,
                            year2:
                                studentMksArr[k].stream.toUpperCase() !== "BCOM"
                                    ? formatMarks(studentMksArr[k].year2)?.toString() || null
                                    : null,
                        };



                        formattedArr.push(tmpEntry);

                    }





                    // console.log(`Done year ${y} | stream ${streams[s].degree.name} | semester ${sem} | Total: ${i + 1}/${arr.length}`);
                }

                if (socket) {
                    socket.emit("progress", {
                        stage: "validating_data",
                        message: `Done year ${y} | stream ${streams[s].degree.name} | semester ${sem}`,
                    });
                }

            }
        }
    }


    return { exceptionalArr, formattedArr };
}

const cleanTilde = (value: unknown): string | null => {
    if (typeof value === "string") {
        return value.replace(/~/g, "").trim(); // Remove all tildes and trim the string
    }
    return null; // Return undefined for non-string values
};