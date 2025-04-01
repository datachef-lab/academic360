
import { db } from "@/db/index";
import { marksheetModel } from "@/features/academics/models/marksheet.model";
import { eq, ilike, or, count } from "drizzle-orm";
import { academicIdentifierModel } from "../models/academicIdentifier.model";
import { userModel } from "../models/user.model";
import { subjectMetadataModel } from "@/features/academics/models/subjectMetadata.model";
import { subjectModel } from "@/features/academics/models/subject.model";

interface ReportQueryParams {
    page: number;
    pageSize: number;
    searchText?: string;
}

export const getReports = async ({ page, pageSize, searchText }: ReportQueryParams) => {
  
        if (page < 1 || pageSize < 1) {
            throw new Error("Invalid pagination parameters.");
        }

        const student = db
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
       
        if (searchText && searchText.trim()) {
            const baseQuery = student.where(
                or(
                    ilike(userModel.name, `%${searchText}%`),
                    ilike(academicIdentifierModel.rollNumber, `%${searchText}%`),
                    ilike(academicIdentifierModel.registrationNumber, `%${searchText}%`)
                )
            );
        }

        const reports = await student.limit(pageSize).offset((page - 1) * pageSize);

        if (!reports.length) {
            return {
                content: [],
                page,
                pageSize,
                totalRecords: 0,
                totalPages: 0,
            };
        }

        const [{ count: totalRecords }] = await db
            .select({ count: count() })
            .from(marksheetModel);

        const studentData: { [key: number]: any } = {};
        reports.forEach(record => {
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
                    percentage: "0.00%"
                };
            }
            studentData[record.id].totalfullMarks += record.fullMarks;
            studentData[record.id].totalobtainedMarks += record.obtainedMarks ?? 0;
        });

        const formattedData = Object.values(studentData).map((student) => ({
            ...student,
            percentage:
                student.totalFullMarks > 0
                    ? ((student.totalObtainedMarks * 100) / student.totalFullMarks).toFixed(2) + "%"
                    : "0.00%",
        }));

        return {
            content: formattedData,
            page,
            pageSize,
            totalRecords: Number(totalRecords),
            totalPages: Math.ceil(Number(totalRecords) / pageSize),
        };
    
};
