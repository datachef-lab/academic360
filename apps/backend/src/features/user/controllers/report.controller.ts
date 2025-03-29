
import { NextFunction, Request, Response } from "express";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { marksheetModel } from "@/features/academics/models/marksheet.model";
import { subjectModel } from "@/features/academics/models/subject.model";
import { subjectMetadataModel } from "@/features/academics/models/subjectMetadata.model";
import { academicIdentifierModel } from "../models/academicIdentifier.model";
import { userModel } from "../models/user.model";
import { handleError } from "@/utils";

// Define the expected response structure
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
             res.status(400).json({ message: "Student ID is required." });
        }

        // Fetch student records
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
        res.status(404).json({ message: "No records found for the given student ID." });
        }

        // Calculate total full marks and total obtained marks
        const totalfullMarks = studentRecords.reduce((sum, record) => sum + record.fullMarks, 0);
        const totalobtainedMarks = studentRecords.reduce((sum, record) => sum + (record.obtainedMarks ?? 0), 0);
        const percentage = totalfullMarks > 0 ? ((totalobtainedMarks * 100) / totalfullMarks).toFixed(2) : "0.00";

        // Construct the response
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

         res.status(200).json(response);
    } catch (error) {
       handleError(error,res,next)
    }
};
export const getAllReports= async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Fetch all student records from the database
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
            .innerJoin(subjectMetadataModel, eq(subjectModel.subjectMetadataId, subjectMetadataModel.id));

        if (!studentRecords.length) {
            res.status(404).json({ message: "No student records found." });
        }

        // Group records by student ID
        const studentData: { [key: number]: StudentReport } = {};

        studentRecords.forEach(record => {
            if (!studentData[record.id]) {
                studentData[record.id] = {
                    id: record.id,
                    rollNumber: record.rollNumber,
                    registrationNumber: record.registrationNumber,
                    uid: record.uid,
                    name: record.name,
                    semester: record.semester,
                    year: record.year,
                    totalfullMarks: 0,
                    totalobtainedMarks: 0,
                    credit: record.credit ?? 0,
                    sgpa: record.sgpa ? Number(record.sgpa) : 0,
                    cgpa: record.cgpa ? Number(record.cgpa) : 0,
                    letterGrade: record.letterGrade,
                    remarks: record.remarks,
                    percentage: "0.00"
                };
            }
            studentData[record.id].totalfullMarks += record.fullMarks;
            studentData[record.id].totalobtainedMarks += record.obtainedMarks ?? 0;
        });

        // Calculate percentage for each student
        Object.values(studentData).forEach(student => {
            student.percentage = student.totalfullMarks > 0
                ? ((student.totalobtainedMarks * 100) / student.totalfullMarks).toFixed(2)+"%"
                : "0.00%";
        });

        res.status(200).json(Object.values(studentData));
    } catch (error) {
        handleError(error, res, next);
    }
};