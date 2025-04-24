
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
    rollNumber: string | null;
    registrationNumber: string | null;
    uid: string | null;
    name: string | null;
    semester: number | 0;
    year: number | 0;
    totalfullMarks: number | 0;
    totalobtainedMarks: number | 0;
    credit: number | 0;
    sgpa: number | 0;
    cgpa: number | 0;
    letterGrade: string | null;
    remarks: string | null;
    percentage: string | null;
}



type FrameworkType = "CCF" | "CBCS";

interface ReportQueryParams {
    page?: number;
    pageSize?: number;

    stream?: string;
    framework?: FrameworkType;
    semester?: number;
    year?: number;
    showFailedOnly?: boolean;
}


export const getReportId = async (req: Request, res: Response, next: NextFunction) => {
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
        handleError(error, res, next)
    }
};

export const getAllReports = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            page = 1,
            pageSize = 10,

            stream,
            framework,
            year,
            semester,
            showFailedOnly
        } = req.query as ReportQueryParams;

        if (page < 1 || pageSize < 1) {
            throw new Error("Invalid page or pageSize.");
        }

        const reportsData = await getReports({
            page,
            pageSize,
            stream,
            framework,
            year,
            semester,
            showFailedOnly
        });

        if (!reportsData) {
            res.status(404).json(
                new ApiResponse(404, "NOT_FOUND", null, "No reports found.")
            );
        }

        res.status(200).json(
            new ApiResponse(200, "SUCCESS", reportsData, "Reports retrieved successfully.")
        );
    } catch (error) {
        handleError(error, res, next);
    }
};