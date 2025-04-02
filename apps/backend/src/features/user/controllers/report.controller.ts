
import { NextFunction, Request, Response } from "express";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { marksheetModel } from "@/features/academics/models/marksheet.model";
import { subjectModel } from "@/features/academics/models/subject.model";
import { subjectMetadataModel } from "@/features/academics/models/subjectMetadata.model";
import { academicIdentifierModel } from "../models/academicIdentifier.model";
import { userModel } from "../models/user.model";
import { ApiResponse, handleError } from "@/utils";
import { getReports } from "../services/reports.service";

interface StudentReport {
    id: number | 0;
    rollNumber : string |null;
    registrationNumber : string |null;
    uid: string |null;
    name: string |null;
    semester: number | 0;
    year: number | 0;
    totalfullMarks: number | 0;
    totalobtainedMarks: number | 0;
    credit: number | 0;
    sgpa: number | 0;
    cgpa: number|0;
    letterGrade: string |null;
    remarks: string | null;
    percentage: string|null;
}

export const getReportId = async (req: Request, res: Response,next:NextFunction) => {
    try {
        const { studentId } = req.params;

        if (!studentId) {
             res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Student ID is required."));
        }

        const studentRecords = await db
            .select({
                id: marksheetModel.studentId,
                rollNumber: academicIdentifierModel.rollNumber,
                registrationNumber: academicIdentifierModel.registrationNumber,
                uid: academicIdentifierModel.uid,
                name: userModel.name,
                semester: marksheetModel.semester,
                year: marksheetModel.year,
                fullMarks: subjectMetadataModel.fullMarks,
                obtainedMarks: subjectModel.totalMarks,
                credit: subjectMetadataModel.credit,
                sgpa: marksheetModel.sgpa,
                cgpa: marksheetModel.cgpa,
                letterGrade: marksheetModel.classification,
                remarks: marksheetModel.remarks
            })
            .from(marksheetModel)
            .innerJoin(academicIdentifierModel, eq(marksheetModel.studentId, academicIdentifierModel.studentId))
            .innerJoin(userModel, eq(academicIdentifierModel.studentId, userModel.id))
            .innerJoin(subjectModel, eq(marksheetModel.id, subjectModel.marksheetId))
            .innerJoin(subjectMetadataModel, eq(subjectModel.subjectMetadataId, subjectMetadataModel.id))
            .where(eq(marksheetModel.studentId, Number(studentId)));

        if (!studentRecords.length) {
        res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "No report found for the given student ID."));
        }

        const totalfullMarks = studentRecords.reduce((sum, record) => sum + record.fullMarks, 0);
        const totalobtainedMarks = studentRecords.reduce((sum, record) => sum + (record.obtainedMarks ?? 0), 0);
        const percentage = totalfullMarks > 0 ? ((totalobtainedMarks * 100) / totalfullMarks).toFixed(2) : "0.00";

        const response: StudentReport = {
            id: studentRecords[0].id,
            rollNumber: studentRecords[0].rollNumber,
            registrationNumber: studentRecords[0].registrationNumber,
            uid: studentRecords[0].uid,
            name: studentRecords[0].name,
            semester: studentRecords[0].semester,
            year: studentRecords[0].year,
            totalfullMarks,
            totalobtainedMarks,
            credit: studentRecords[0].credit ?? 0,
            sgpa: studentRecords[0].sgpa ? Number(studentRecords[0].sgpa) : 0,
            cgpa: studentRecords[0].cgpa ? Number(studentRecords[0].cgpa) : 0,
            letterGrade: studentRecords[0].letterGrade,
            remarks: studentRecords[0].remarks,
            percentage
        };

         res.status(200).json(new ApiResponse(200, "SUCCESS", response, "Report fetched successfully!"));
    } catch (error) {
       handleError(error,res,next)
    }
};
// export const getAllReports= async (req: Request, res: Response, next: NextFunction) => {
//     try {
     
//         const studentRecords = await db
//             .select({
//                 id: marksheetModel.studentId,
//                 rollNumber: academicIdentifierModel.rollNumber,
//                 registrationNumber: academicIdentifierModel.registrationNumber,
//                 uid: academicIdentifierModel.uid,
//                 name: userModel.name,
//                 semester: marksheetModel.semester,
//                 year: marksheetModel.year,
//                 fullMarks: subjectMetadataModel.fullMarks,
//                 obtainedMarks: subjectModel.totalMarks,
//                 credit: subjectMetadataModel.credit,
//                 sgpa: marksheetModel.sgpa,
//                 cgpa: marksheetModel.cgpa,
//                 letterGrade: marksheetModel.classification,
//                 remarks: marksheetModel.remarks
//             })
//             .from(academicIdentifierModel)
//             .leftJoin(marksheetModel, eq(marksheetModel.studentId, academicIdentifierModel.studentId))
//             .leftJoin(userModel, eq(academicIdentifierModel.studentId, userModel.id))
//             .leftJoin(subjectModel, eq(marksheetModel.id, subjectModel.marksheetId))
//             .leftJoin(subjectMetadataModel, eq(subjectModel.subjectMetadataId, subjectMetadataModel.id));

//         if (!studentRecords.length) {
//             res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "No report found for the given student ID."));
//         }

    
//         const studentData: { [key: number]: StudentReport } = {};

//         studentRecords.forEach(record => {
//             if (record.id !== null && !studentData[record.id]) {
//                 studentData[record.id] = {
//                     id: record.id,
//                     rollNumber: record.rollNumber,
//                     registrationNumber: record.registrationNumber,
//                     uid: record.uid,
//                     name: record.name,
//                     semester: record.semester ?? 0,
//                     year: record.year??0,
//                     totalfullMarks: record.fullMarks??0,
//                     totalobtainedMarks: record.obtainedMarks ?? 0,
//                     credit: record.credit ?? 0,
//                     sgpa: record.sgpa ? Number(record.sgpa) : 0,
//                     cgpa: record.cgpa ? Number(record.cgpa) : 0,
//                     letterGrade: record.letterGrade,
//                     remarks: record.remarks,
//                     percentage: "0.00"
//                 };
//             }
//             if (record.id !== null) {
//                 studentData[record.id].totalfullMarks += record.fullMarks ?? 0;
//             }
//             if (record.id !== null) {
//                 studentData[record.id].totalobtainedMarks += record.obtainedMarks ?? 0;
//             }
//         });

     
//        Object.values(studentData).forEach(student => {
//             student.percentage = student.totalfullMarks > 0
//                 ? ((student.totalobtainedMarks * 100) / student.totalfullMarks).toFixed(2)+"%"
//                 : "0.00%";
//         });

//         res.status(200).json(new ApiResponse(200, "SUCCESS", studentData, "All reports are fetched!"));
//     } catch (error) {
//         handleError(error, res, next);
//     }
// };

export const getAllReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string, 10) || 1;
        const pageSize = parseInt(req.query.pageSize as string, 10) || 10;
        const searchText = req.query.searchText as string || "";

        if (isNaN(page) || isNaN(pageSize) || page < 1 || pageSize < 1) {
            res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid page or pageSize."));
        }

        const reportsData = await getReports({ page, pageSize, searchText });
        if(!reportsData) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "No reports found."));
        }
        res.status(200).json(new ApiResponse(200, "SUCCESS", reportsData, "Reports retrieved successfully."));
    } catch (error) {
       handleError(error, res, next);
    }
};