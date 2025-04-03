
// import { db } from "@/db/index";
// import { marksheetModel } from "@/features/academics/models/marksheet.model";
// import { eq, ilike, or, count } from "drizzle-orm";
// import { academicIdentifierModel } from "../models/academicIdentifier.model";
// import { userModel } from "../models/user.model";
// import { subjectMetadataModel } from "@/features/academics/models/subjectMetadata.model";
// import { subjectModel } from "@/features/academics/models/subject.model";
// import { ApiResponse } from "@/utils";
// import { NextFunction, Request, Response } from "express";

// type ReportQueryParams = {
//     page: number;
//     pageSize: number;
//     searchText?: string;
// }

// export const getReports = async ({ page, pageSize, searchText }: ReportQueryParams) => {



//         const student = db
//             .select({
//                             id: marksheetModel.studentId,
//                             rollNumber: academicIdentifierModel.rollNumber,
//                             registrationNumber: academicIdentifierModel.registrationNumber,
//                             uid: academicIdentifierModel.uid,
//                             name: userModel.name,
//                             semester: marksheetModel.semester,
//                             year: marksheetModel.year,
//                             fullMarks: subjectMetadataModel.fullMarks,
//                             obtainedMarks: subjectModel.totalMarks,
//                             credit: subjectMetadataModel.credit,
//                             sgpa: marksheetModel.sgpa,
//                             cgpa: marksheetModel.cgpa,
//                             letterGrade: subjectModel.letterGrade,
//                             remarks: marksheetModel.remarks
//                         })
//                         .from(marksheetModel)
//                         .leftJoin(academicIdentifierModel, eq(marksheetModel.studentId,academicIdentifierModel.studentId))
//                         .leftJoin(userModel, eq(academicIdentifierModel.studentId, userModel.id))
//                         .leftJoin(subjectModel, eq(marksheetModel.id, subjectModel.marksheetId))
//                         .leftJoin(subjectMetadataModel, eq(subjectModel.subjectMetadataId, subjectMetadataModel.id));

//         if (searchText && searchText.trim()) {
//             const baseQuery = student.where(
//                 or(
//                     ilike(userModel.name, `%${searchText}%`),
//                     ilike(academicIdentifierModel.rollNumber, `%${searchText}%`),
//                     ilike(academicIdentifierModel.registrationNumber, `%${searchText}%`)
//                 )
//             );
//         }

//         const reports = await student.limit(pageSize).offset((page - 1) * pageSize);

//         if (!reports.length) {
//             return {
//                 content: [],
//                 page,
//                 pageSize,
//                 totalRecords: 0,
//                 totalPages: 0,
//             };
//         }

//         const [{ count: totalRecords }] = await db
//             .select({ count: count() })
//             .from(marksheetModel);

//         const studentData: { [key: number]: any } = {};
//         reports.forEach(record => {
//             if (record.id !== null && !studentData[record.id]) {
//                 studentData[record.id] = {
//                     id: record.id,
//                     rollNumber: record.rollNumber,
//                     registrationNumber: record.registrationNumber,
//                     uid: record.uid,
//                     name: record.name,
//                     semester: record.semester,
//                     year: record.year,
//                     totalfullMarks: 0,
//                     totalobtainedMarks: 0,
//                     credit: record.credit ?? 0,
//                     sgpa: record.sgpa ? Number(record.sgpa) : 0,
//                     cgpa: record.cgpa ? Number(record.cgpa) : 0,
//                     letterGrade: record.letterGrade,
//                     remarks: record.remarks,
//                     percentage: "0.00%"
//                 };
//             }
//             // studentData[record.id].totalfullMarks += record.fullMarks;
//             // studentData[record.id].totalobtainedMarks += record.obtainedMarks ?? 0;
//         });

//         const formattedData = Object.values(studentData).map((student) => ({
//             ...student,
//             percentage:
//                 student.totalFullMarks > 0
//                     ? ((student.totalObtainedMarks * 100) / student.totalFullMarks).toFixed(2) + "%"
//                     : "0.00%",
//         }));

//         return {
//             content: formattedData,
//             page,
//             pageSize,
//             totalRecords: Number(totalRecords),
//             totalPages: Math.ceil(Number(totalRecords) / pageSize),
//         };

// };

import { db } from "@/db/index";
import { marksheetModel } from "@/features/academics/models/marksheet.model";
import { eq, ilike, or, count, and, gt } from "drizzle-orm";
import { academicIdentifierModel } from "../models/academicIdentifier.model";
import { userModel } from "../models/user.model";
import { subjectMetadataModel } from "@/features/academics/models/subjectMetadata.model";
import { subjectModel } from "@/features/academics/models/subject.model";
import { ApiResponse } from "@/utils";
import { NextFunction, Request, Response } from "express";
import { streamModel } from "@/features/academics/models/stream.model";
import { degreeModel } from "@/features/resources/models/degree.model";
import { PgColumn } from "drizzle-orm/pg-core";

type ReportQueryParams = {
    page: number;
    pageSize: number;
    searchText?: string;
    stream?: string;
    framework?: string;
    semester?: number;
    year?: number;
    showFailedOnly?: boolean;
}

export const getReports = async ({ page, pageSize, searchText, stream, framework, semester, year, showFailedOnly }: ReportQueryParams) => {



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
            year: marksheetModel.year,
            subjectName: subjectMetadataModel.name,
            fullMarks: subjectMetadataModel.fullMarks,
            obtainedMarks: subjectModel.totalMarks,
            credit: subjectMetadataModel.credit,
            sgpa: marksheetModel.sgpa,
            cgpa: marksheetModel.cgpa,
            letterGrade: subjectModel.letterGrade,
            remarks: marksheetModel.remarks
        })
        .from(marksheetModel)
        .leftJoin(academicIdentifierModel, eq(marksheetModel.studentId, academicIdentifierModel.studentId))
        .leftJoin(userModel, eq(academicIdentifierModel.studentId, userModel.id))
        .leftJoin(streamModel, eq(academicIdentifierModel.streamId, streamModel.id))
        .leftJoin(degreeModel, eq(streamModel.degreeId, degreeModel.id))
        .leftJoin(subjectModel, eq(marksheetModel.id, subjectModel.marksheetId))
        .leftJoin(subjectMetadataModel, eq(subjectModel.subjectMetadataId, subjectMetadataModel.id))
        .$dynamic();


    let query = baseQuery;
    if (searchText && searchText.trim()) {
        query = query.where(
            and(or(
                ilike(userModel.name, `%${searchText}%`),
                ilike(academicIdentifierModel.rollNumber, `%${searchText}%`),
                ilike(academicIdentifierModel.registrationNumber, `%${searchText}%`)
            ),
            stream ? eq(degreeModel.name, stream) : undefined,
            framework ? eq(streamModel.framework, framework as "CCF" | "CBCS") : undefined,
            semester !== undefined ? eq(marksheetModel.semester, semester) : undefined,
            year && semester != null ? or(
                eq(marksheetModel.year, year),
                and(
                    gt(marksheetModel.year, year),
                    eq(marksheetModel.semester, semester)
                )
            ) : undefined
        )
        );
    }
    // if (stream) query = query.where(eq(degreeModel.name, stream));
    // if (framework) query = query.where(eq(streamModel.framework, framework as "CCF" | "CBCS"));
    // if (semester !== undefined) query = query.where(eq(marksheetModel.semester, semester));
    // if (year && semester != null) {
    //     query = query.where(
    //         or(
    //             eq(marksheetModel.year, year),
    //             and(
    //                 gt(marksheetModel.year, year),
    //                 eq(marksheetModel.semester, semester)
    //             )
    //         )
    //     );
    // }

    const reportResult = await query.limit(pageSize).offset((page - 1) * pageSize);

    if (!reportResult) {
        return {
            content: [],
            page,
            pageSize,
            totalRecords: 0,
            totalPages: 0,
        };
    }

    const totalQuery = db
        .select({ count: count() })
        .from(marksheetModel)
        .innerJoin(academicIdentifierModel, eq(marksheetModel.studentId, academicIdentifierModel.studentId))
        .innerJoin(userModel, eq(academicIdentifierModel.studentId, userModel.id))
        .innerJoin(streamModel, eq(academicIdentifierModel.streamId, streamModel.id))
        .innerJoin(degreeModel, eq(streamModel.degreeId, degreeModel.id))

        .innerJoin(subjectModel, eq(marksheetModel.id, subjectModel.marksheetId))
        .innerJoin(subjectMetadataModel, eq(subjectModel.subjectMetadataId, subjectMetadataModel.id));

    let countQuery = totalQuery.$dynamic();

    if (searchText && searchText.trim()) {
        query = query.where(
            and(
                or(
                ilike(userModel.name, `%${searchText}%`),
                ilike(academicIdentifierModel.rollNumber, `%${searchText}%`),
                ilike(academicIdentifierModel.registrationNumber, `%${searchText}%`)
            ),
            stream ? eq(degreeModel.name, stream) : undefined,
            framework ? eq(streamModel.framework, framework as "CCF" | "CBCS") : undefined,
            semester !== undefined ? eq(marksheetModel.semester, semester) : undefined,
            year && semester != null ? or(
                eq(marksheetModel.year, year),
                and(
                    gt(marksheetModel.year, year),
                    eq(marksheetModel.semester, semester)
                )
            ) : undefined
        )
        );
    }

  
    const totalResult = await countQuery;
    console.log("Total Result: ", totalResult);
    const totalRecords = totalResult.length > 0 ? Number(totalResult[0].count) : 0;


    const studentData: { [key: number]: any } = {};
    reportResult.forEach(record => {
        if (record.id !== null && !studentData[record.id]) {
            studentData[record.id] = {
                id: record.id,
                rollNumber: record.rollNumber,
                registrationNumber: record.registrationNumber,
                uid: record.uid,
                name: record.name,
                semester: record.semester,
                stream: record.stream,
                framework: record.framework,
                year: record.year,
                // totalfullMarks: 0,
                // totalobtainedMarks: 0,
                // credit: record.credit ?? 0,
                sgpa: record.sgpa ? Number(record.sgpa) : 0,
                cgpa: record.cgpa ? Number(record.cgpa) : 0,
                letterGrade: record.letterGrade,
                remarks: record.remarks,
                percentage: "0.00%",
                subjects: []
            };
        }
        // studentData[record.id].totalfullMarks += record.fullMarks;
        // studentData[record.id].totalobtainedMarks += record.obtainedMarks ?? 0;
    });

    reportResult.forEach(record => {
        // Ensure subjects array exists (defensive programming)
        if (!studentData[record.id].subjects) {
            studentData[record.id].subjects = []; // <-- ADD THIS SAFETY CHECK
        }

        const existingSubjectIndex = studentData[record.id].subjects.findIndex(
            (s: any) => s.name === record.subjectName
        );

        if (existingSubjectIndex === -1) {
            studentData[record.id].subjects.push({
                name: record.subjectName,
                obtainedMarks: record.obtainedMarks,
                fullMarks: record.fullMarks,
                credit: record.credit,
                status: record.remarks,
                letterGrade: record.letterGrade,
                examYear: record.year,
            });
        } else {
            const existing = studentData[record.id].subjects[existingSubjectIndex];
            if (
                (record.obtainedMarks ?? 0) > (existing.obtainedMarks ?? 0) ||
                record.year > existing.examYear
            ) {
                studentData[record.id].subjects[existingSubjectIndex] = {
                    ...record,
                    examYear: record.year,
                };
            }
        }
    });
    // Calculate final status for each student
    const formattedData = Object.values(studentData).map((student) => {

        student.totalFullMarks = student.subjects.reduce((sum: number, sub: any) => sum + sub.fullMarks, 0);
        student.totalObtainedMarks = student.subjects.reduce((sum: number, sub: any) => sum + (sub.obtainedMarks || 0), 0);
        student.totalCredit = student.subjects.reduce((sum: number, sub: any) => sum + (sub.credit || 0), 0);

        const percentage = student.totalFullMarks > 0
            ? (student.totalObtainedMarks / student.totalFullMarks) * 100
            : 0;

        // Define SubjectStatus if not imported
        // Replace with actual enum or object if available
        const hasFailedSubject = student.subjects.some((sub: any) => sub.status === "FAIL");
        const hasLowPercentage = percentage < 30;
        const isFailed = hasFailedSubject || hasLowPercentage;

        // Determine detailed status
        let status: string;
        if (hasFailedSubject && hasLowPercentage) {
            status = "FAIL (Subjects & Overall <30%)";
        } else if (hasFailedSubject) {
            status = "FAIL (Subjects)";
        } else if (hasLowPercentage) {
            status = "FAIL (Overall <30%)";
        } else {
            status = "PASS";
        }

        // Add improvement notes for re-exams
        const subjectsWithHistory = student.subjects.map((sub: any) => {
            const baseSubject = {
                name: sub.name,
                obtained: sub.obtainedMarks,
                outOf: sub.fullMarks,
                status: sub.status,
                credit: sub.credit,
                letterGrade: sub.letterGrade,
            };

            // For re-exams, add improvement note
            if (sub.examYear > (year || student.examYear)) {
                return {
                    ...baseSubject,
                    remark: `Improved in ${sub.examYear} re-exam`,
                };
            }
            return baseSubject;
        });

        return {
            ...student,
            percentage: percentage.toFixed(2) + "%",
            isFailed,
            status,
            historicalStatus: year
                ? (student.examYear <= year && isFailed ? "FAILED" : "PASSED")
                : isFailed ? "FAILED" : "PASSED",
            subjects: subjectsWithHistory,
        };
    });

    // Filter failed students if requested
    const filteredData = showFailedOnly
        ? formattedData.filter((student) => student.isFailed)
        : formattedData;

    return {
        content: filteredData,
        page,
        pageSize,
        totalRecords: Number(totalRecords),
        totalPages: Math.ceil(Number(totalRecords) / pageSize),
    }
};

function countDistinct(studentId: PgColumn<{ name: "student_id_fk"; tableName: "marksheets"; dataType: "number"; columnType: "PgInteger"; data: number; driverParam: string | number; notNull: true; hasDefault: false; isPrimaryKey: false; isAutoincrement: false; hasRuntimeDefault: false; enumValues: undefined; baseColumn: never; identity: undefined; generated: undefined; }, {}, {}>): any {
    throw new Error("Function not implemented.");
}
