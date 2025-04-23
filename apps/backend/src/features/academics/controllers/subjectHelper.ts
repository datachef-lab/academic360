import { Request, Response } from "express";
import { db } from "@/db/index.js";
import { eq, and, sql } from "drizzle-orm";
import { subjectMetadataModel } from "../models/subjectMetadata.model.js";
import { streamModel } from "../models/stream.model.js";
import { degreeModel } from "@/features/resources/models/degree.model.js";

// Handler for the filtered subjects endpoint
export const getFilteredSubjectsHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { framework, semester, stream } = req.query;

        // Validate required parameters
        if (!framework || !semester || !stream) {
            res.status(400).json({
                success: false,
                message: "Missing required parameters: framework, semester, and stream are required",
            });
            return;
        }

        // Convert semester to number (removing 'sem ' prefix if exists)
        const semNumber = parseInt(String(semester).toLowerCase().replace("sem ", ""), 10);
        
        if (isNaN(semNumber) || semNumber < 1 || semNumber > 8) {
            res.status(400).json({
                success: false,
                message: "Invalid semester: should be between 1 and 8",
            });
            return;
        }

        // Get the degree ID based on the provided stream
        const streamQuery = await db
            .select({ id: degreeModel.id, name: degreeModel.name })
            .from(degreeModel)
            .where(sql`LOWER(${degreeModel.name}) = LOWER(${String(stream)})`)
            .limit(1);

        if (!streamQuery.length) {
            res.status(404).json({
                success: false,
                message: "Stream not found",
            });
            return;
        }

        const degreeId = streamQuery[0].id;
        const degreeName = streamQuery[0].name;

        // Find the stream ID from the streams table
        const streamResult = await db
            .select({ 
                id: streamModel.id,
                framework: streamModel.framework,
                degreeProgramme: streamModel.degreeProgramme,
                duration: streamModel.duration,
                numberOfSemesters: streamModel.numberOfSemesters
            })
            .from(streamModel)
            .where(
                and(
                    eq(streamModel.framework, String(framework).toUpperCase() as any),
                    eq(streamModel.degreeId, degreeId)
                )
            )
            .limit(1);

        if (!streamResult.length) {
            res.status(404).json({
                success: false,
                message: "No matching stream found for the provided framework and stream",
            });
            return;
        }

        const streamId = streamResult[0].id;
        const streamDetails = {
            id: streamId,
            framework: streamResult[0].framework,
            degreeProgramme: streamResult[0].degreeProgramme,
            duration: streamResult[0].duration,
            numberOfSemesters: streamResult[0].numberOfSemesters
        };

        // Get all subject metadata for the matching criteria - select all fields
        const subjects = await db
            .select()
            .from(subjectMetadataModel)
            .where(
                and(
                    eq(subjectMetadataModel.streamId, streamId),
                    eq(subjectMetadataModel.semester, semNumber)
                )
            );

        if (!subjects.length) {
            res.status(404).json({
                success: false,
                message: "No subjects found for the specified criteria",
            });
            return;
        }

        // Format the response with all subject data fields
        res.status(200).json({
            success: true,
            framework: streamDetails.framework,
            semester: `Sem ${semNumber}`,
            stream: degreeName,
            streamDetails: streamDetails,
            subjects: subjects.map(subject => ({
                id: subject.id,
                name: subject.name || subject.irpName,
                code: subject.marksheetCode || subject.irpCode,
                irpName: subject.irpName,
                irpCode: subject.irpCode,
                marksheetCode: subject.marksheetCode,
                streamId: subject.streamId,
                semester: subject.semester,
                specializationId: subject.specializationId,
                category: subject.category,
                subjectTypeId: subject.subjectTypeId,
                isOptional: subject.isOptional,
                credit: subject.credit,
                theoryCredit: subject.theoryCredit,
                practicalCredit: subject.practicalCredit,
                internalCredit: subject.internalCredit,
                projectCredit: subject.projectCredit,
                vivalCredit: subject.vivalCredit,
                fullMarks: subject.fullMarks,
                fullMarksTheory: subject.fullMarksTheory,
                fullMarksPractical: subject.fullMarksPractical,
                fullMarksInternal: subject.fullMarksInternal,
                fullMarksProject: subject.fullMarksProject,
                fullMarksViva: subject.fullMarksViva,
                createdAt: subject.createdAt,
                updatedAt: subject.updatedAt
            }))
        });
    } catch (error) {
        console.error("Error fetching filtered subjects:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error while fetching subjects",
        });
    }
}; 