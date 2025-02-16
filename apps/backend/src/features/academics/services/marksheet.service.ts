import path from "path";
import { fileURLToPath } from "url";
import { MarksheetType } from "@/types/academics/marksheet";
import { readExcelFile } from "@/utils/readExcel";
import { db } from "@/db/index.js";
import { MarksheetRow } from "@/types/academics/marksheet-row.js";
import { findAllStreams } from "./stream.service";
import { Stream } from "../models/stream.model";
import { academicIdentifierModel } from "@/features/user/models/academicIdentifier.model";
import { and, eq } from "drizzle-orm";
import { findStudentById } from "@/features/user/services/student.service";
import { studentModel } from "@/features/user/models/student.model";
import { Marksheet, marksheetModel } from "../models/marksheet.model";
import { Subject, subjectModel } from "../models/subject.model";
import { subjectMetadataModel } from "../models/subjectMetadata.model";
import { SubjectType } from "@/types/academics/subject";
import { subjectResponseFormat } from "./subject.service";
import { stream } from "xlsx";

const directoryName = path.dirname(fileURLToPath(import.meta.url));

export async function addMarksheet(): Promise<MarksheetType | null> {

    return null;
}

export async function uploadFile(fileName: string): Promise<boolean> {
    // Read the file from the `/public/temp/` directory
    const filePath = path.resolve(directoryName, "../../../..", "public", "temp", fileName);

    const dataArr = readExcelFile<MarksheetRow>(filePath);

    // TODO: Check if all the entries are valid.

    // Step 1: Find the smallest year from the dataArr[]
    const startingYear = Math.min(...dataArr.map(row => row.year1));

    // Step 2: Fetch all the streams
    const streams = await findAllStreams();

    // Step 3: Loop over the array.
    for (let y = startingYear; y < dataArr.length; y++) { // Iterate over the years

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
                const doneUid: string[] = [];
                for (let i = 0; i < arr.length; i++) {
                    // Skip the `uid` if already processed
                    if (doneUid.includes(arr[i].uid)) continue;

                    // Select all the subject rows for the uid: arr[i].uid
                    const subjectArr = arr.filter(row => row.uid === arr[i].uid);

                    // Process the student
                    await processStudent(subjectArr, streams[s], sem);

                }

            }
        }
    }


    return false;
}

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

    // TODO: Create the object

    return null;
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
        row.stream === stream.name &&
        row[yearKey] === year &&
        row.semester === semester
    );
}

async function processStudent(arr: MarksheetRow[], stream: Stream, semester: number) {
    // Step 1: Check if the uid already exist
    const [foundAcademicIdentifier] = await db.select().from(academicIdentifierModel).where(eq(academicIdentifierModel.uid, arr[0].uid));

    if (!foundAcademicIdentifier) { // TODO: Create new student

    }

    const [foundStudent] = await db.select().from(studentModel).where(eq(studentModel.id, foundAcademicIdentifier.studentId));

    let marksheet: Marksheet = {
        studentId: foundStudent.id,
        semester: arr[0].semester,
        year: arr[0].year1,
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
            year2: stream.name !== "BCOM" ? arr[i].year2 : null,
            internalMarks: formatMarks(arr[i].internal_marks),
            theoryMarks: formatMarks(arr[i].theory_marks),
            practicalMarks: stream.name !== "BCOM" ? formatMarks(arr[i].year2?.toString()) : null,
            tutorialMarks: formatMarks(arr[i].tutorial_marks),
            totalMarks: formatMarks(arr[i].total),
            letterGrade: arr[i].grade,
            ngp: formatMarks(arr[i].ngp)?.toString(),
            tgp: formatMarks(arr[i].tgp)?.toString(),
        };

        // Calculate totalMarksObtained and fullMarksSum
        let total = formatMarks(arr[i].total);
        totalMarksObtained +=  total ? total : 0;
        fullMarksSum += subjectMetadata.fullMarks

        // Calculate NGP and set the letterGrade
        if (total) {
            let subjectPercent = (total * 100) / subjectMetadata.fullMarks;
            // Calculate NGP for each subject as % marks / 10 for each subject
            subject.ngp = (subjectPercent / 10).toString();
            // Mark the letterGrade for each subject
            subject.letterGrade = getLetterGrade(subjectPercent);

            if (subjectPercent < 30) {
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

    let marksheetPercent = (totalMarksObtained * 100) / fullMarksSum;
    if (marksheetPercent < 30) {
        marksheet.sgpa = null;
    }
    else {
        marksheet.sgpa = (ngp_credit / creditSum).toFixed(3);
    }

    const subjectList: SubjectType[] = (await Promise.all(subjects.map(async (subject) => {
        return await subjectResponseFormat(subject);
    }))).filter((subject): subject is SubjectType => subject !== null);

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

    return marksheet;
}

function formatMarks(marks: string | null): number | null {
    if (!marks || marks.trim() === "") {
        return null;
    }

    if (marks.toUpperCase() === "AB") {
        return -1;
    }

    const tmpMarks = Number(marks);
    return isNaN(tmpMarks) ? null : tmpMarks;
}

function getLetterGrade(subjectPercent: number) {
    if (subjectPercent >= 90 && subjectPercent <= 100) {
        return "A++";
    }
    if (subjectPercent >= 80 && subjectPercent < 90) {
        return "A+";
    }
    if (subjectPercent >= 70 && subjectPercent < 80) {
        return "A";
    }
    if (subjectPercent >= 60 && subjectPercent < 70) {
        return "B+";
    }
    if (subjectPercent >= 50 && subjectPercent < 60) {
        return "B"
    }
    if (subjectPercent >= 40 && subjectPercent < 50) {
        return "C+";
    }
    if (subjectPercent >= 30 && subjectPercent < 40) {
        return "C";
    }
    if (subjectPercent >= 0 && subjectPercent < 30) {
        return "F";
    }
}

async function getClassification(cgpa: number, studentId: number) {
    const marksheetList: Marksheet[] = await findMarksheetsByStudentId(studentId);

    let isClearedSemester = false;
    for (let i = 0; i < 6; i++) {
        const marksheetObj = marksheetList.find(marksheet => marksheet.semester == i + 1);
        if (!marksheetObj || !marksheetObj.sgpa) {
            isClearedSemester = false;
            break;
        }
        isClearedSemester = true;
    }

    if (!isClearedSemester) {
        return "Previous Semester not cleared";
    }
    else {
        if (cgpa >= 9 && cgpa <= 10) {
            return "Outstanding";
        }
        else if (cgpa >= 8 && cgpa < 9) {
            return "Excellent";
        }
        else if (cgpa >= 7 && cgpa < 8) {
            return "Very Good";
        }
        else if (cgpa >= 6 && cgpa < 7) {
            return "Good";
        }
        else if (cgpa >= 5 && cgpa < 6) {
            return "Average";
        }
        else if (cgpa >= 4 && cgpa < 5) {
            return "Fair";
        }
        else if (cgpa >= 3 && cgpa < 4) {
            return "Satisfactory";
        }
        else if (cgpa >= 0 && cgpa < 3) {
            return "Fail";
        }
    }
}

function getRemarks(marksheetPercent: number, stream: Stream, course: "HONOURS" | "GENERAL", semester: number, subjects: SubjectType[]) {
    // Firstly check if all the subjects are got cleared, if not then return "Semester not cleared."
    for (let i = 0; i < subjects.length; i++) {
        if (subjects[i].totalMarks === null || subjects[i].totalMarks === -1) {
            return "Semester not cleared.";
        }

        let percentMarks = ((subjects[i].totalMarks as number) * 100) / subjects[i].subjectMetadata.fullMarks;

        if (percentMarks < 30) {
            return "Semester not cleared.";
        }
    }

    // Get the remarks by total_marks percentage 
    if (marksheetPercent < 30) { // For failed marksheet
        return "Semester not cleared.";
    }
    else { // For passed marksheet
        if (semester != 6) { // For semester: 1, 2, 3, 4, 5
            return "Semester cleared.";
        }
        else { // For semester: 6
            if (stream.name.toUpperCase() !== "BCOM") { // For BA & BSC
                return "Qualified with Honours.";
            }
            else { // For BCOM
                if (course.toUpperCase() === "HONOURS") { // For honours
                    return "Semester cleared with honours."
                }
                else { // For general
                    return "Semester cleared with general.";
                }
            }
        }
    }
}

async function calculateCGPA(studentId: number) {
    const marksheetList = await findMarksheetsByStudentId(studentId);

    const updatedMarksheetList: MarksheetType[] = [];

    // Step 1: Select and update all the passed marksheets
    for (let semester = 1; semester <= 6; semester++) {
        // Filter marksheets for the current semester
        const semesterWiseArr = marksheetList.filter(mks => mks.semester === semester);

        if (semesterWiseArr.length === 0) {
            return null;
        }

        // Sort all the filtered marksheets by createdAt (assuming createdAt is a Date object)
        semesterWiseArr.sort((a, b) => new Date(a.createdAt as Date).getTime() - new Date(b.createdAt as Date).getTime());

        let updatedSemesterMarksheet: MarksheetType = semesterWiseArr[0];

        for (let i = 0; i < semesterWiseArr.length; i++) {
            if (semesterWiseArr[i].sgpa) { // Student had cleared the semester
                updatedSemesterMarksheet = semesterWiseArr[i];
                continue;
            }
            // If student has not cleared the semester, then do go on updating the subjects upto recent status.
            const { subjects } = semesterWiseArr[i];
            for (let j = 0; j < subjects.length; j++) {
                updatedSemesterMarksheet.subjects = updatedSemesterMarksheet.subjects.map(sbj => {
                    if (subjects[j].subjectMetadata.id === sbj.subjectMetadata.id) {
                        return subjects[j]; // Return the recent changes for the subject
                    }
                    return sbj; // Otherwise, return the existing state which are not changed
                });
            }

        }

        updatedMarksheetList.push(updatedSemesterMarksheet);
    }


    let sgpa_totalcredit = 0, creditSumAllSem = 0;

    for (let i = 1; i <= 6; i++) {
        const marksheet = marksheetList.find(obj => obj.semester == i);
        if (!marksheet) {
            return -1;
        }
        const sgpa = formatMarks((marksheet.sgpa as string)) as number;
        const totalCredit = calculateTotalCredit(marksheet);
        sgpa_totalcredit += sgpa * totalCredit;
        creditSumAllSem += totalCredit;
    }

    // Return the cgpa
    return (sgpa_totalcredit / creditSumAllSem).toFixed(3);
}

function calculateTotalCredit(marksheet: MarksheetType) {
    let totalCredit = 0;
    for (let i = 0; i < marksheet.subjects.length; i++) {
        if (!marksheet.subjects[i].subjectMetadata.credit) {
            continue;
        }

        totalCredit += marksheet.subjects[i].subjectMetadata.credit as number;
    }

    return totalCredit;
}

// async function handleSemester6(studentId: number) {
//     const marksheetList = await findMarksheetsByStudentId(studentId);
    
//     // Fetch semester 6 marksheet
//     const marksheetSem6 = marksheetList.find(obj => obj.semester == 6);
//     console.log("List: ", marksheetSem6);
//     if (marksheetSem6 == undefined) { return null; }
//     // Set cgpa and classification for the marksheet having semester as 6
//     marksheetSem6.cgpa = calculateCGPA(marksheetList);
//     marksheetSem6.classification = getClassification(marksheetSem6.cgpa, marksheetList);

//     console.log("In handle semester6, marksheetSem6: ", marksheetSem6)
//     return marksheetSem6;

// }
