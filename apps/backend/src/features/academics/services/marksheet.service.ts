import path from "path";
import { fileURLToPath } from "url";
import { MarksheetType } from "@/types/academics/marksheet.js";
import { readExcelFile } from "@/utils/readExcel.js";
import { db } from "@/db/index.js";
import { MarksheetRow } from "@/types/academics/marksheet-row.js";
import { findAllStreams, findStreamById, findStreamByName } from "./stream.service.js";
import { Stream } from "../models/stream.model.js";
import { academicIdentifierModel } from "@/features/user/models/academicIdentifier.model.js";
import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { findStudentById } from "@/features/user/services/student.service.js";
import { Student, studentModel } from "@/features/user/models/student.model.js";
import { Marksheet, marksheetModel } from "../models/marksheet.model.js";
import { Subject, subjectModel } from "../models/subject.model.js";
import { subjectMetadataModel } from "../models/subjectMetadata.model.js";
import { SubjectType } from "@/types/academics/subject.js";
import { addSubject, findSubjectsByMarksheetId, saveSubject, subjectResponseFormat } from "./subject.service.js";
import bcrypt from "bcrypt";
import { User, userModel } from "@/features/user/models/user.model.js";
import { calculateCGPA, calculatePercentage, calculateSGPA, formatMarks, getClassification, getLetterGrade, getRemarks } from "@/utils/helper.js";
import { findAcademicIdentifierById, findAcademicIdentifierByStudentId } from "@/features/user/services/academicIdentifier.service.js";
import { AcademicIdentifierType } from "@/types/user/academic-identifier.js";
import { MarksheetLog } from "@/types/academics/marksheet-logs.js";
import { UserType } from "@/types/user/user.js";
import { findUserById } from "@/features/user/services/user.service.js";
import { StudentType } from "@/types/user/student.js";

const directoryName = path.dirname(fileURLToPath(import.meta.url));

export async function addMarksheet(marksheet: MarksheetType, user: User): Promise<MarksheetType | null> {
    // Return if the student not found
    let student: Student | null = null;
    if (marksheet.studentId) {
        student = await findStudentById(marksheet.studentId);
    }

    if (!student) {
        // Step 1: Add the user
        const newUser = await addUser({ name: marksheet.name, uid: null });

        // Step 2: Add the student
        student = await addStudent({
            userId: newUser.id as number,
            uid: null,
            framework: marksheet.academicIdentifier.frameworkType as "CBCS" | "CCF",
            shift: null
        }) as Student;

        // Step 3: Add the academic-identifier
        const foundStream = await findStreamById(marksheet.academicIdentifier.streamId as number);
        if (!foundStream) {
            throw Error("Invalid stream");
        }

        await addAcademicIdentifier({
            studentId: student.id as number,
            stream: foundStream.name,
            framework: marksheet.academicIdentifier.frameworkType as "CBCS" | "CCF",
            uid: marksheet.academicIdentifier.uid || null,
            registrationNumber: marksheet.academicIdentifier.registrationNumber as string,
            rollNumber: marksheet.academicIdentifier.rollNumber as string,
            section: marksheet.academicIdentifier.section ? marksheet.academicIdentifier.section : null
        });
    }


    // Step 1: Create the marksheet
    const [newMarksheet] = await db.insert(marksheetModel).values({
        studentId: student.id as number,
        semester: marksheet.semester,
        year: marksheet.year,
        source: "ADDED",
        createdByUserId: user.id as number,
        updatedByUserId: user.id as number,
    }).returning();
    // Step 2: Add the subjects
    for (let i = 0; i < marksheet.subjects.length; i++) {
        marksheet.subjects[i].marksheetId = newMarksheet.id;
        marksheet.subjects[i] = await addSubject(marksheet.subjects[i]) as SubjectType;
    }
    // Step 3: Update the marksheet fields like SGPA, CGPA, Classification
    newMarksheet.sgpa = calculateSGPA(marksheet);
    if (newMarksheet.semester === 6) {
        newMarksheet.cgpa = (await calculateCGPA(newMarksheet.studentId))?.toString() ?? null;
        if (newMarksheet.cgpa) {
            newMarksheet.classification = await getClassification(+newMarksheet.cgpa, marksheet.studentId) ?? null;
        }
    }

    const [updatedMarksheet] = await db.update(marksheetModel).set(newMarksheet).where(eq(marksheetModel.id, newMarksheet.id)).returning();

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

export async function uploadFile(fileName: string, user: User): Promise<boolean> {
    // Read the file from the `/public/temp/` directory
    const filePath = path.resolve(directoryName, "../../../..", "public", "temp", fileName);
    console.log("\nReading file...")
    let dataArr = readExcelFile<MarksheetRow>(filePath);
    console.log(dataArr.length)
    // sendUpdate("File read successfully. Validating data...");
    console.log("\nFile read successfully. Validating data...\n")
    // Check if all the entries are valid.
    console.log("validating data...")
    await validateData(dataArr);
    // sendUpdate("Data validation completed.");
    console.log("cleaning data...")
    dataArr = await cleanData(dataArr);


    // Step 1: Find the smallest year from the dataArr[]
    const startingYear = Math.min(...dataArr.map(row => row.year1));

    // Step 2: Fetch all the streams
    const streams = await findAllStreams();

    // Step 3: Loop over the array.
    for (let y = startingYear; y < new Date().getFullYear(); y++) { // Iterate over the years

        for (let s = 0; s < streams.length; s++) { // Iterate over the streams

            for (let sem = 1; sem <= 6; sem++) { // Iterate over the semesters
                // Filter the data
                const arr = filterData({
                    dataArr,
                    semester: sem,
                    framework: dataArr[0].framework,
                    stream: streams[s],
                    year: y
                });

                console.log("after filter-data, arr:", arr.length, "dataArr:", dataArr.length);

                // sendUpdate(`Processing year ${y}, stream ${streams[s]}, semester ${sem}...`);

                // Iterate over the arr[]
                const doneRollNumber: string[] = [];
                for (let i = 0; i < arr.length; i++) {
                    // Skip the `uid` if already processed
                    if (doneRollNumber.includes(arr[i].roll_no)) continue;

                    // Select all the subject rows for the uid: arr[i].roll_no
                    const subjectArr = arr.filter(row => row.roll_no === arr[i].roll_no);
                    console.log("processing student:", subjectArr.length, subjectArr[0].roll_no, "dataArr:", dataArr.length, "arr:", arr.length);
                    // Process the student
                    const result = await processStudent(subjectArr, streams[s], sem, fileName, user);
                    // console.log("result:", result);

                    // Mark the uid as done
                    doneRollNumber.push(arr[i].roll_no);

                    // sendUpdate(`Processed student: ${arr[i].roll_no}`);
                }
                console.log(`Processed year ${y} | stream ${streams[s]} | semester ${sem} | Total: ${arr.length}`);
            }
        }
    }

    return true;
}

export async function saveMarksheet(id: number, marksheet: MarksheetType, user: User) {
    const [foundMarksheet] = await db.select().from(marksheetModel).where(eq(marksheetModel.id, id));
    if (!foundMarksheet) {
        return null;
    }
    // Update the subjects
    for (let i = 0; i < marksheet.subjects.length; i++) {
        if (!marksheet.subjects[i].id) {
            marksheet.subjects[i] = await addSubject(marksheet.subjects[i]) as SubjectType;
        }
        else {
            marksheet.subjects[i] = await saveSubject(marksheet.subjects[i].id as number, marksheet.subjects[i]) as SubjectType;
        }
    }

    foundMarksheet.sgpa = calculateSGPA(marksheet);
    if (foundMarksheet.semester === 6) {
        foundMarksheet.cgpa = (await calculateCGPA(foundMarksheet.studentId))?.toString() ?? null;
        if (foundMarksheet.cgpa) {
            foundMarksheet.classification = await getClassification(+foundMarksheet.cgpa, marksheet.studentId) ?? null;
        }
    }

    foundMarksheet.updatedByUserId = user.id as number;

    const [updatedMarksheet] = await db.update(marksheetModel).set(foundMarksheet).where(eq(marksheetModel.id, id)).returning();

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

export async function getMarksheetLogs(searchText: string): Promise<MarksheetLog[]> {
    // Query the marksheet table with filtering and user join
    const result = await db
        .select({
            item: marksheetModel.file,
            source: marksheetModel.source,
            file: marksheetModel.file,
            createdByUserId: marksheetModel.createdByUserId,
            framework: academicIdentifierModel.frameworkType,
            updatedByUserId: marksheetModel.updatedByUserId,
            createdAt: marksheetModel.createdAt,
            updatedAt: marksheetModel.updatedAt,
        })
        .from(marksheetModel)
        .leftJoin(userModel, and(eq(marksheetModel.studentId, userModel.id))) // Adjust based on your schema
        .leftJoin(academicIdentifierModel, and(eq(academicIdentifierModel.studentId, studentModel.id))) // Adjust based on your schema
        .where(searchText ? ilike(marksheetModel.file, `%${searchText}%`) : undefined)
        .groupBy(marksheetModel.source, marksheetModel.file, userModel.id, userModel.name, userModel.email, marksheetModel.createdAt)
        .orderBy(desc(marksheetModel.createdAt));


    // Map the query result to the MarksheetLog interface
    const queryResult = Promise.all(result.map(async (row) => {
        const createdByUser = await findUserById(row.createdByUserId as number);

        let updatedByUser = createdByUser;
        if (row.updatedByUserId !== createdByUser?.id) {
            updatedByUser = await findUserById(row.updatedByUserId);
        }

        return {
            item: row.item as string,
            source: row.source ?? "UNKNOWN",
            file: row.file,
            createdByUser,
            updatedByUser,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt
        } as MarksheetLog;
    }));

    return queryResult;
}

// // Replace this function with actual logic to fetch user based on marksheet createdBy information
// async function fetchCreatedByUser(): Promise<UserType> {
//     // This could be a lookup based on the marksheet, for now, assume it returns a mock user
//     return { id: 1, name: "John Doe", email: "john.doe@example.com" }; // Replace with actual user fetching logic
// }


export async function findMarksheetById(id: number): Promise<MarksheetType | null> {
    const [foundMarksheet] = await db.select().from(marksheetModel).where(eq(marksheetModel.id, id));

    const formattedMarksheet = await marksheetResponseFormat(foundMarksheet);

    return formattedMarksheet;
}

export async function findMarksheetsByStudentId(studentId: number): Promise<MarksheetType[]> {
    const marksheets = await db.select().from(marksheetModel).where(eq(marksheetModel.studentId, studentId));

    let formattedMarksheets: MarksheetType[] = [];
    formattedMarksheets = (await Promise.all(marksheets.map(async (marksheet) => {
        const tmpMarksheet = await marksheetResponseFormat(marksheet);
        return tmpMarksheet;
    }))).filter((marksheet): marksheet is MarksheetType => marksheet !== null && marksheet !== undefined);

    return formattedMarksheets;
}

export async function removeMarksheet(id: number): Promise<boolean | null> {
    return null;
}

export async function removeMarksheetByStudentId(studentId: number): Promise<boolean | null> {

    return null;
}

async function marksheetResponseFormat(marksheet: Marksheet): Promise<MarksheetType | null> {
    if (!marksheet) {
        return null;
    }

    const subjects = await findSubjectsByMarksheetId(marksheet.id as number);

    const academicIdentifier = await findAcademicIdentifierByStudentId(marksheet.studentId as number);

    const createdByUser = await findUserById(marksheet.createdByUserId as number);
    const updatedByUser = await findUserById(marksheet.updatedByUserId as number);

    const [student] = await db.select().from(studentModel).where(eq(studentModel.id, marksheet.studentId as number));
    const [user] = await db.select().from(userModel).where(eq(userModel.id, student.userId as number));

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
    framework: "CBCS" | "CCF";
    stream: Stream;
    year: number;
    semester: number;
}

function filterData({ dataArr, stream, framework, year, semester }: FilterDataProps) {

    const isBCOM = stream.name === "BCOM";
    const yearKey = isBCOM && framework === "CBCS" ? "year2" : "year1";

    return dataArr.filter(row =>
        cleanStream(row.stream) === stream.name &&
        row[yearKey] === year &&
        row.semester === semester
    );
}

const cleanStream = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
        return value.replace(/[\s\-\/\.]/g, '').trim();
    }
    return undefined; // Return undefined for non-string values
};


const cleanString = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
        return value.replace(/[\s\-\/]/g, '').trim();
    }
    return undefined; // Return undefined for non-string values
};

interface AddUserProps {
    name: string;
    uid: string | null;
}
async function addUser({ name, uid }: AddUserProps) {
    if (!uid) {
        // Create the new user
        const [newUser] = await db.insert(userModel).values({
            name: name?.trim()?.toUpperCase(),
            email: null,
            password: null,
            phone: null,
            type: "STUDENT",
            whatsappNumber: null,
        }).returning();

        return newUser;
    }

    const email = `${cleanString(uid)?.toUpperCase()}@thebges.edu.in`;

    // Hash the password before storing it in the database
    const hashedPassword = await bcrypt.hash(uid.trim()?.toUpperCase(), 10);

    // Return, if the email already exist
    const [existingUser] = await db.select().from(userModel).where(eq(userModel.email, email.trim().toLowerCase()));
    if (existingUser) {
        const [updatedUser] = await db.update(userModel).set({ password: hashedPassword }).where(eq(userModel.id, existingUser.id)).returning();
        return updatedUser;
    }

    // Create the new user
    const [newUser] = await db.insert(userModel).values({
        name: name?.trim()?.toUpperCase(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        phone: null,
        type: "STUDENT",
        whatsappNumber: null,
    }).returning();

    return newUser;
}

interface AddStudentProps {
    userId: number;
    uid: string | null,
    framework: "CBCS" | "CCF";
    shift: "DAY" | "MORNING" | "AFTERNOON" | "EVENING" | null;
}

async function addStudent({ userId, uid, framework, shift }: AddStudentProps) {
    const [existingStudent] = await db.select().from(studentModel).where(eq(studentModel.userId, userId as number));
    if (existingStudent) {
        return existingStudent;
    }

    let level: "UNDER_GRADUATE" | "POST_GRADUATE" | undefined;
    if (uid) {
        if (uid.startsWith("11") || uid.startsWith("14")) {
            level = "POST_GRADUATE";
        } else if (!uid.startsWith("B")) {
            level = "UNDER_GRADUATE";
        }
    }

    const [newStudent] = await db.insert(studentModel).values({
        userId: userId as number,
        framework: framework,
        level,
        shift: shift,
    }).returning();

    // ["DAY", "MORNING", "AFTERNOON", "EVENING"].includes(marksheet.shift.toUpperCase()) ? marksheet.shift.toUpperCase() as "DAY" | "MORNING" | "AFTERNOON" | "EVENING" : null

    return newStudent;
}

interface AddAcademicIdentifierProps {
    studentId: number;
    stream: string;
    framework: "CBCS" | "CCF";
    uid: string | null;
    registrationNumber: string;
    rollNumber: string;
    section: string | null;
}

async function addAcademicIdentifier({ studentId, stream, framework, uid, registrationNumber, rollNumber, section }: AddAcademicIdentifierProps) {
    const foundStream = await findStreamByName(stream);

    if (!foundStream) {
        throw Error("Invalid stream");
    }

    await db.insert(academicIdentifierModel).values({
        studentId: studentId as number,
        streamId: foundStream.id as number,
        frameworkType: framework.toUpperCase().trim() as "CCF" | "CBCS",
        uid: uid ? cleanString(uid)?.toUpperCase() : null,
        registrationNumber: registrationNumber.trim(),
        rollNumber: rollNumber.trim(),
        section: section,
    }).returning();
}

async function processStudent(arr: MarksheetRow[], stream: Stream, semester: number, fileName: string, user: User) {
    console.log("in processStudent(), arr:", arr.length)
    if (arr.length === 0) {
        return;
    }
    // Step 1: Check if the roll_no already exist
    const [foundAcademicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(
        sql`REGEXP_REPLACE(${academicIdentifierModel.rollNumber}, '[^a-zA-Z0-9]', '', 'g')`,
        arr[0].roll_no.replace(/[^a-zA-Z0-9]/g, '')
    ));

    let [student] = await db.select().from(studentModel).where(eq(studentModel.id, foundAcademicIdentifier.studentId as number));
    if (!foundAcademicIdentifier) { // TODO: Create new student
        // Step 1: Add the user
        const user = await addUser(arr[0]);

        // Step 2: Add the student
        student = await addStudent({
            framework: arr[0].framework as "CBCS" | "CCF",
            shift: arr[0].shift as "DAY" | "MORNING" | "AFTERNOON" | "EVENING",
            uid: arr[0].uid,
            userId: user.id as number,
        });

        // Step 3: Add the academic-identifier
        await addAcademicIdentifier({
            framework: arr[0].framework as "CBCS" | "CCF",
            registrationNumber: arr[0].registration_no,
            rollNumber: arr[0].roll_no,
            section: arr[0].section,
            stream: stream.name,
            studentId: student.id as number,
            uid: arr[0].uid,
        });
    }

    if (!student) {
        throw Error("Unable to create the new student");
    }

    let marksheet: Marksheet = {
        studentId: student.id as number,
        semester: arr[0].semester,
        year: arr[0].year1,
        source: "FILE_UPLOAD",
        file: fileName,
        createdByUserId: user.id as number,
        updatedByUserId: user.id as number,
    }

    marksheet = (await db.insert(marksheetModel).values(marksheet).returning())[0];

    const subjects: Subject[] = [];

    const subjectMetadataArr = await db.select().from(subjectMetadataModel).where(and(
        eq(subjectMetadataModel.streamId, stream.id as number),
        eq(subjectMetadataModel.semester, semester),
        eq(subjectMetadataModel.framework, arr[0].framework),
    ));

    let totalMarksObtained = 0, fullMarksSum = 0, ngp_credit = 0, creditSum = 0;

    for (let i = 0; i < arr.length; i++) {
        const subjectMetadata = subjectMetadataArr.find(sbj => sbj.name === arr[i].subject.toUpperCase().trim());

        if (!subjectMetadata) {
            throw Error("Invalid subject input got detected!");
        }

        let subject: Subject = {
            marksheetId: marksheet.id,
            subjectMetadataId: subjectMetadata.id,
            year1: arr[i].year1,
            year2: stream.name === "BCOM" ? Number(arr[i].year2) : null,
            internalMarks: formatMarks(arr[i].internal_marks),
            theoryMarks: formatMarks(arr[i].theory_marks),
            practicalMarks: arr[i].practical_marks ? formatMarks(arr[i].practical_marks) : null,
            tutorialMarks: formatMarks(arr[i].tutorial_marks),
            totalMarks: formatMarks(arr[i].total),
            letterGrade: arr[i].grade,
            ngp: formatMarks(arr[i].ngp)?.toString(),
            tgp: formatMarks(arr[i].tgp)?.toString(),
        };

        // Calculate totalMarksObtained and fullMarksSum
        let total = formatMarks(arr[i].total);
        totalMarksObtained += total ? total : 0;
        fullMarksSum += subjectMetadata.fullMarks

        // Calculate NGP and set the letterGrade
        if (total) {
            let subjectPercent = (total * 100) / subjectMetadata.fullMarks;
            // Calculate NGP for each subject as % marks / 10 for each subject
            subject.ngp = (subjectPercent / 10).toFixed(3).toString();

            subject.tgp = subjectMetadata.credit && subject.ngp ? (Number(subject.ngp) * subjectMetadata.credit).toFixed(3).toString() : null;

            // Mark the letterGrade for each subject
            subject.letterGrade = await getLetterGrade(subject);

            if (!subject.letterGrade) {
                subject.status = null;
            }
            if (subject.letterGrade?.startsWith("F")) {
                subject.status = "FAIL";
            }
            else {
                subject.status = "PASS";
            }
        }

        // Calculate sum of product of NGP and Credit
        if (subject.ngp && subjectMetadata.credit) {
            ngp_credit += +subject.ngp * subjectMetadata.credit;

            // Calculate sum of all credits
            creditSum += subjectMetadata.credit;
        }

        // Insert the subject
        subject = (await db.insert(subjectModel).values(subject).returning())[0];

        subjects.push(subject);

    }

    const tmpMarksheet = (await findMarksheetById(marksheet.id as number)) as MarksheetType;
    marksheet.sgpa = calculateSGPA(tmpMarksheet);

    const subjectList: SubjectType[] = (await Promise.all(subjects.map(async (subject) => {
        return await subjectResponseFormat(subject);
    }))).filter((subject): subject is SubjectType => subject !== null);

    let marksheetPercent = (totalMarksObtained * 100) / fullMarksSum;

    // Set the remarks for the marksheet
    marksheet.remarks = getRemarks(marksheetPercent, stream, arr[0].course.toUpperCase() as "HONOURS" | "GENERAL", semester, subjectList);

    if (semester === 6) {
        const cgpa = await calculateCGPA(marksheet.studentId);
        if (cgpa) {
            marksheet.cgpa = cgpa.toString();
            marksheet.classification = await getClassification(+cgpa, marksheet.studentId);
        }
    }

    marksheet = (await db.update(marksheetModel).set(marksheet).where(eq(marksheetModel.id, marksheet.id as number)).returning())[0];


    const updatedMarksheet = await marksheetResponseFormat(marksheet);

    await postMarksheetOperation(updatedMarksheet as MarksheetType);

    return marksheet;
}


async function postMarksheetOperation(marksheet: MarksheetType) {
    const [foundStudent] = await db.select().from(studentModel).where(eq(studentModel.id, marksheet.studentId));
    if (!foundStudent) {
        return;
    }
    foundStudent.framework = marksheet.subjects[0].subjectMetadata.framework;
    console.log("Framework:", marksheet.subjects[0].subjectMetadata.framework);
    // For Passing the semester, update the student fields
    if (marksheet.sgpa) {
        // Updated the last passed year
        foundStudent.lastPassedYear = marksheet.year;
        // Update the student's status 
        if (marksheet.semester === 6) {
            foundStudent.active = true;
            foundStudent.alumni = true;
        }
        await db.update(studentModel).set(foundStudent).where(eq(studentModel.id, foundStudent.id as number));
    }
    // Update the registration_number and roll_number, if found empty
    const [foundAcademicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.studentId, foundStudent.id));
    if (!foundAcademicIdentifier) {
        return;
    }
    if (!foundAcademicIdentifier.registrationNumber) {
        foundAcademicIdentifier.registrationNumber = marksheet.academicIdentifier.registrationNumber as string;
    }
    if (!foundAcademicIdentifier.rollNumber) {
        foundAcademicIdentifier.rollNumber = marksheet.academicIdentifier.rollNumber as string;
    }
    if (!foundAcademicIdentifier.course) {
        foundAcademicIdentifier.course = marksheet.academicIdentifier.course ?? null;
    }
    if (!foundAcademicIdentifier.frameworkType) {
        foundAcademicIdentifier.frameworkType = marksheet.subjects[0].subjectMetadata.framework;
    }
    if (!foundAcademicIdentifier.section) {
        foundAcademicIdentifier.section = marksheet.academicIdentifier.section ?? null;
    }

    await db.update(academicIdentifierModel).set(foundAcademicIdentifier).where(eq(academicIdentifierModel.id, foundAcademicIdentifier.id as number));

    return;
}

export async function validateData(dataArr: MarksheetRow[]) {
    // Step 1: Find the smallest year from the dataArr[]
    const startingYear = Math.min(...dataArr.map(row => row.year1));

    // Step 2: Fetch all the streams
    const streams = await findAllStreams();
    // Step 3: Loop over the array.
    for (let y = startingYear; y <= new Date().getFullYear(); y++) { // Iterate over the years

        for (let s = 0; s < streams.length; s++) { // Iterate over the streams

            for (let sem = 1; sem <= 6; sem++) { // Iterate over the semesters
                // Filter the data
                const arr = filterData({
                    dataArr,
                    semester: sem,
                    framework: dataArr[0].framework,
                    stream: streams[s],
                    year: y
                });

                // Iterate over the arr[]
                const doneRollNumber = new Set<string>();
                for (let i = 0; i < arr.length; i++) {
                    // Skip the `uid` if already processed
                    if (doneRollNumber.has(arr[i].roll_no)) continue;

                    doneRollNumber.add(arr[i].roll_no);

                    const studentMksArr = arr.filter(ele => ele.roll_no === arr[i].roll_no);

                    // Select all the subject rows for the uid: arr[i].roll_no
                    const subjectArr = arr.filter(row => row.roll_no === arr[i].roll_no);

                    // Fetch the subjects
                    const subjectMetadataArr = await db.select().from(subjectMetadataModel).where(and(
                        eq(subjectMetadataModel.streamId, streams[s].id as number),
                        eq(subjectMetadataModel.semester, sem),
                        eq(subjectMetadataModel.framework, arr[0].framework),
                    ));

                    // Check all the subjects (range of marks, subject name, duplicates)
                    const seenSubjects = new Set<number>(); // Track subject IDs for duplicate check

                    for (let k = 0; k < studentMksArr.length; k++) {
                        const subjectMetadata = subjectMetadataArr.find(ele => ele.name === studentMksArr[k].subject.toUpperCase().trim());

                        // ✅ Ensure subjectMetadata exists before proceeding
                        if (!subjectMetadata) {
                            throw Error(`Subject metadata not found for subject: ${studentMksArr[k].subject}`);
                        }

                        // ✅ Check for duplicate subjects
                        if (seenSubjects.has(subjectMetadata?.id as number)) {
                            throw Error("Duplicate Subjects");
                        }

                        seenSubjects.add(subjectMetadata?.id as number);

                        // ✅ Check invalid marks range (Assuming 0-100 as valid)
                        let { internal_marks, theory_marks, total, tutorial_marks, stream, year2: practical_marks } = studentMksArr[k];

                        internal_marks = formatMarks(internal_marks)?.toString() || null;
                        theory_marks = formatMarks(theory_marks)?.toString() || null;
                        tutorial_marks = formatMarks(tutorial_marks)?.toString() || null;
                        total = formatMarks(total)?.toString() || null;
                        practical_marks = stream.toUpperCase() !== "BCOM" ? formatMarks(practical_marks)?.toString() || null : null;

                        if (internal_marks && subjectMetadata?.fullMarksInternal && +internal_marks > (subjectMetadata?.fullMarksInternal as number)) {
                            throw Error("Invalid marks");
                        }

                        if (theory_marks && subjectMetadata?.fullMarksTheory && +theory_marks > (subjectMetadata?.fullMarksTheory as number)) {
                            throw Error("Invalid marks");
                        }

                        if (practical_marks && subjectMetadata?.fullMarksPractical && +practical_marks > (subjectMetadata?.fullMarksPractical as number)) {
                            throw Error("Invalid marks");
                        }

                        if (tutorial_marks && subjectMetadata?.fullMarksTutorial && +tutorial_marks > (subjectMetadata?.fullMarksTutorial as number)) {
                            throw Error("Invalid marks");
                        }

                        if (total && subjectMetadata?.fullMarks && +total > (subjectMetadata?.fullMarks as number)) {
                            throw Error("Invalid marks");
                        }

                    }
                    console.log(`Done year ${y} | stream ${streams[s].name} | semester ${sem} | Total: ${i + 1} ${arr.length}`);
                }
            }
        }
    }
}


// export async function cleanData(dataArr: MarksheetRow[]) {
//     // Step 1: Find the smallest year from the dataArr[]
//     const startingYear = Math.min(...dataArr.map(row => row.year1));

//     // Step 2: Fetch all the streams
//     const streams = await findAllStreams();

//     // Step 3: Loop over the array.
//     const formattedArr = [];

//     for (let y = startingYear; y <= new Date().getFullYear(); y++) { // Iterate over the years

//         for (let s = 0; s < streams.length; s++) { // Iterate over the streams

//             for (let sem = 1; sem <= 6; sem++) { // Iterate over the semesters
//                 // Filter the data
//                 const arr = filterData({
//                     dataArr,
//                     semester: sem,
//                     framework: dataArr[0].framework,
//                     stream: streams[s],
//                     year: y
//                 });


//                 // Iterate over the arr[]
//                 const doneRollNumber: string[] = [];
//                 for (let i = 0; i < arr.length; i++) {
//                     // Skip the `uid` if already processed
//                     if (doneRollNumber.includes(arr[i].roll_no)) continue;

//                     const studentMksArr = arr.filter(ele => ele.roll_no === arr[i].roll_no);

//                     for (let k = 0; k < studentMksArr.length; k++) {
//                         studentMksArr[k].stream = streams[s].name.toUpperCase().trim();
//                         studentMksArr[k].uid = studentMksArr[k].uid.toUpperCase().trim();
//                         studentMksArr[k].registration_no = cleanTilde(studentMksArr[k].registration_no) as string;
//                         studentMksArr[k].roll_no = cleanTilde(studentMksArr[k].roll_no) as string;
//                         studentMksArr[k].stream = studentMksArr[k].stream.toUpperCase().trim();
//                         studentMksArr[k].course = studentMksArr[k].course.toUpperCase().trim();
//                         studentMksArr[k].name = studentMksArr[k].name.toUpperCase().trim();
//                         studentMksArr[k].subject = studentMksArr[k].subject.toUpperCase().trim();
//                         studentMksArr[k].framework = studentMksArr[k].framework.toUpperCase().trim() as "CBCS" | "CCF";
//                         studentMksArr[k].specialization = studentMksArr[k].framework.toUpperCase().trim();
//                         studentMksArr[k].section = studentMksArr[k].section ? (studentMksArr[k].section as string).toUpperCase().trim() : null;

//                         studentMksArr[k].internal_marks = formatMarks(studentMksArr[k].internal_marks)?.toString() || null;
//                         studentMksArr[k].theory_marks = formatMarks(studentMksArr[k].theory_marks)?.toString() || null;
//                         studentMksArr[k].tutorial_marks = formatMarks(studentMksArr[k].tutorial_marks)?.toString() || null;
//                         studentMksArr[k].total = formatMarks(studentMksArr[k].total)?.toString() || null;
//                         studentMksArr[k].year2 = studentMksArr[k].stream.toUpperCase() !== "BCOM" ? formatMarks(studentMksArr[k].year2)?.toString() || null : null;

//                         formattedArr.push(...studentMksArr);
//                     }

//                     doneRollNumber.push(arr[i].roll_no);

//                     console.log(`Done year ${y} | stream ${streams[s].name} | semester ${sem} | Total: ${i + 1} ${arr.length}`);
//                 }


//             }
//         }
//     }

//     return formattedArr;
// }


export async function cleanData(dataArr: MarksheetRow[]) {
    const startingYear = Math.min(...dataArr.map(row => row.year1));
    const streams = await findAllStreams();
    const formattedArr: MarksheetRow[] = [];

    for (let y = startingYear; y <= new Date().getFullYear(); y++) {
        for (let s = 0; s < streams.length; s++) {
            for (let sem = 1; sem <= 6; sem++) {
                const arr = filterData({
                    dataArr,
                    semester: sem,
                    framework: dataArr[0].framework,
                    stream: streams[s],
                    year: y
                });

                const doneRollNumber = new Set<string>(); // Use a Set to prevent duplicates

                for (let i = 0; i < arr.length; i++) {
                    if (doneRollNumber.has(arr[i].roll_no)) continue; // Skip if already processed

                    let studentMksArr = arr.filter(ele => ele.roll_no === arr[i].roll_no);

                    // Normalize and clean the data
                    studentMksArr = studentMksArr.map((mks) => ({
                        ...mks,
                        stream: streams[s].name.toUpperCase().trim(),
                        uid: mks.uid.toUpperCase().trim(),
                        registration_no: cleanTilde(mks.registration_no) as string,
                        roll_no: cleanTilde(mks.roll_no) as string,
                        course: mks.course.toUpperCase().trim(),
                        name: mks.name.toUpperCase().trim(),
                        subject: mks.subject.toUpperCase().trim(),
                        framework: mks.framework.toUpperCase().trim() as "CBCS" | "CCF",
                        specialization: mks.specialization ? mks.specialization.toUpperCase().trim() : null,
                        section: mks.section ? mks.section.toUpperCase().trim() : null,
                        internal_marks: formatMarks(mks.internal_marks)?.toString() || null,
                        theory_marks: formatMarks(mks.theory_marks)?.toString() || null,
                        tutorial_marks: formatMarks(mks.tutorial_marks)?.toString() || null,
                        total: formatMarks(mks.total)?.toString() || null,
                        year2: mks.stream.toUpperCase() !== "BCOM" ? formatMarks(mks.year2)?.toString() || null : null,
                    }));

                    formattedArr.push(...studentMksArr);
                    doneRollNumber.add(arr[i].roll_no); // Mark roll number as processed

                    console.log(`Done year ${y} | stream ${streams[s].name} | semester ${sem} | Total: ${i + 1}/${arr.length}`);
                }
            }
        }
    }

    return formattedArr;
}



const cleanTilde = (value: unknown): string | null => {
    if (typeof value === 'string') {
        return value.replace(/~/g, '').trim();  // Remove all tildes and trim the string
    }
    return null;  // Return undefined for non-string values
};