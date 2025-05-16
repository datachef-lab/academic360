import { db } from "@/db/index";
import { marksheetModel } from "../models/marksheet.model";
import { studentModel } from "@/features/user/models/student.model";
import { and, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { academicIdentifierModel } from "@/features/user/models/academicIdentifier.model";
import { userModel } from "@/features/user/models/user.model";
import { streamModel } from "../models/stream.model";
import { degreeModel } from "@/features/resources/models/degree.model";
import { subjectModel } from "../models/subject.model";
import { subjectMetadataModel } from "../models/subjectMetadata.model";







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
            id: marksheetModel.id,
            registrationNumber: academicIdentifierModel.registrationNumber,
            rollNumber: academicIdentifierModel.rollNumber,
            uid: academicIdentifierModel.uid,
            name: userModel.name,
            stream: degreeModel.name,
            type: streamModel.degreeProgramme,
            framework: streamModel.framework,
            semester: marksheetModel.semester,
            year1: subjectModel.year1,
            year2: subjectModel.year2,
            subjectName: subjectMetadataModel.name,
            marksheetCode: subjectMetadataModel.marksheetCode,
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
        .leftJoin(studentModel, eq(marksheetModel.studentId, studentModel.id))
        .leftJoin(academicIdentifierModel, eq(studentModel.id, academicIdentifierModel.studentId))
        .leftJoin(userModel, eq(userModel.id, studentModel.id))
        .leftJoin(streamModel, eq(academicIdentifierModel.streamId, streamModel.id))
        .leftJoin(degreeModel, eq(streamModel.id, degreeModel.id))
        .leftJoin(subjectModel, eq(marksheetModel.id, subjectModel.id))
        .leftJoin(subjectMetadataModel, eq(subjectModel.subjectMetadataId, subjectMetadataModel.id));

    const countQuery = db
        .select({ count: count() })
        .from(marksheetModel)

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
                .orderBy(asc(marksheetModel.id));

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
                .orderBy(desc(marksheetModel.id))
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