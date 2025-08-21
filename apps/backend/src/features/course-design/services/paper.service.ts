import { db } from "@/db/index.js";
import { eq, and, ilike, countDistinct } from "drizzle-orm";
import { Paper, paperModel } from "../models/paper.model.js";
import { PaperDto } from "@/types/course-design/index.type.js";
import {
    createPaperComponent,
    // updatePaperComponent,
    // deletePaperComponent,
    findPaperComponentsByPaperId,
} from "./paper-component.service.js";
import XLSX from "xlsx";
import fs from "fs";
import { createTopic, getTopicsByPaperId, updateTopic } from "./topic.service.js";
import { paperComponentModel } from "../models/paper-component.model.js";
import { examComponentModel } from "../models/exam-component.model.js";
import { classModel } from "@/features/academics/models/class.model.js";
import { topicModel } from "../models/topic.model.js";
import { marksheetPaperMappingModel } from "@/features/academics/models/marksheet-paper-mapping.model.js";
import { batchStudentPaperModel } from "../models/batch-student-paper.model.js";
// import { findCourseById } from "./course.service";
// import { findAcademicYearById } from "@/features/academics/services/academic-year.service";
// import { findClassById } from "@/features/academics/services/class.service";
// import { getSubjectById } from "./subject.service";
// import { getAffiliationById } from "./affiliation.service";
// import { getRegulationTypeById } from "./regulation-type.service";
// import { getSubjectTypeById } from "./subject-type.service";
// import { getPaperComponentById } from "../controllers/paper-component.controller";

export interface BulkUploadResult {
  success: Paper[];
  errors: Array<{ row: number; data: unknown[]; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

export async function createPaper(data: PaperDto) {
    const {
        id,
        createdAt,
        updatedAt,
        components,
        topics,
        ...props
    } = data;

    let [existingPaper] = await db
        .select()
        .from(paperModel)
        .where(
            and(
                eq(paperModel.code, data.code),
                eq(paperModel.subjectId, data.subjectId!),
                eq(paperModel.programCourseId, data.programCourseId!),
                eq(paperModel.classId, data.classId!),
                eq(paperModel.affiliationId, data.affiliationId),
                eq(paperModel.regulationTypeId, data.regulationTypeId),
                eq(paperModel.academicYearId, data?.academicYearId!),
                ilike(paperModel.name, data.name.trim()),
            ),
        );
    if (!existingPaper) {
        const [created] = await db
            .insert(paperModel)
            .values({
                ...props,
                subjectId: data?.subjectId!,
                affiliationId: data.affiliationId,
                regulationTypeId: data.regulationTypeId,
                academicYearId: data.academicYearId!,
                programCourseId: data.programCourseId!,
                classId: data.classId!,
            })
            .returning();
        existingPaper = created;
    }

    for (const component of components) {
        // Only create components with valid marks and credit
        if ((component.fullMarks || 0) > 0 && (component.credit || 0) > 0) {
            await createPaperComponent({ ...component, paperId: existingPaper.id! });
        }
    }
    for (const topic of topics) {
        await createTopic({ ...topic, paperId: existingPaper.id! });
    }
    return existingPaper;
}

export async function createPapers(data: PaperDto[]) {
    const createdPapers: Paper[] = [];

    for (const paper of data) {
        const [existingPaper] = await db
            .select()
            .from(paperModel)
            .where(
                and(
                    eq(paperModel.code, paper.code),
                    eq(paperModel.subjectId, paper.subjectId!),
                    eq(paperModel.programCourseId, paper.programCourseId!),
                    eq(paperModel.classId, paper.classId!),
                    eq(paperModel.affiliationId, paper.affiliationId),
                    eq(paperModel.regulationTypeId, paper.regulationTypeId),
                    eq(paperModel.academicYearId, paper.academicYearId!),
                ),
            );

        if (existingPaper) {
            console.log("Paper already exists:", existingPaper);
            createdPapers.push(existingPaper);
            continue; // Skip to the next paper if it already exists
        }

        const newPaper = await createPaper(paper);
        if (newPaper) {
            createdPapers.push(newPaper);
        }
    }

    return (
        await Promise.all(
            createdPapers.map(async (paper) => await modelToDto(paper)),
        )
    ).filter((paper) => paper !== null) as PaperDto[]; // Ensure we return only valid PaperDto objects
}

export async function getPaperById(id: number) {
    // Fetch paper with all related data including direct foreign key relationships
    const [paper] = await db
        .select()
        .from(paperModel)
        .where(eq(paperModel.id, id));

    if (!paper) {
        return null;
    }

    // Return the complete paper object with components
    return await modelToDto(paper);
}

export async function getAllPapers() {
    const papers = await db.select().from(paperModel);

    return (
        await Promise.all(
            papers.map(async (paper) => await modelToDto(paper)),
        )
    ).filter((paper) => paper !== null) as PaperDto[]; // Ensure we return only valid PaperDto objects
}

export async function updatePaper(id: number, data: PaperDto) {
    const [updatedPaper] = await db
        .update(paperModel)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(paperModel.id, id))
        .returning();

    return await modelToDto(updatedPaper);
}

export async function updatePaperWithComponents(id: number, data: Omit<PaperDto, "id" | "createdAt" | "updatedAt">) {
    console.log("Updating paper with components:", { id, data });
    console.log("Received data fields:", data);

    // const { academicYear, components, subject, } = data;

    // Find the class ID based on semester name
    console.log("Looking for class with name:", data.classId);
    const [classRecord] = await db
        .select()
        .from(classModel)
        .where(eq(classModel.id, data.classId!));

    if (!classRecord) {
        throw new Error(`Class not found for class id: ${data.classId}`);
    }
    console.log("Found class record:", classRecord);

    // Update the paper with all the mapping data directly
    const [updatedPaper] = await db
        .update(paperModel)
        .set({
            name: data.name,
            code: data.code,
            isOptional: data.isOptional,
            subjectId: data.subjectId,
            affiliationId: data.affiliationId,
            regulationTypeId: data.regulationTypeId,
            academicYearId: data.academicYearId,
            subjectTypeId: data.subjectTypeId,
            programCourseId: data.programCourseId,
            classId: classRecord.id,
            disabled: data.disabled,
        })
        .where(eq(paperModel.id, id))
        .returning();

    console.log("Updated paper:", updatedPaper);

    // Delete existing paper components
    await db
        .delete(paperComponentModel)
        .where(eq(paperComponentModel.paperId, id));

    console.log("Deleted existing paper components");

    // Create new paper components
    const validComponents = data.components.filter(
        (component) => component?.fullMarks! > 0 || component?.credit! > 0,
    );

    console.log("Valid components to create:", validComponents);

    for (const componentData of validComponents) {
        await db.insert(paperComponentModel).values({
            paperId: id,
            examComponentId: componentData.examComponent.id!,
            fullMarks: componentData.fullMarks,
            credit: componentData.credit,
        });
    }

    console.log("Created new paper components");

    const result = {
        paper: updatedPaper,
        components: validComponents,
    };

    console.log("Final result:", result);
    return await modelToDto(updatedPaper);
}

export async function deletePaper(id: number) {
    const [deleted] = await db
        .delete(paperModel)
        .where(eq(paperModel.id, id))
        .returning();

    return await modelToDto(deleted);
}

export async function deletePaperSafe(id: number) {
    const [found] = await db.select().from(paperModel).where(eq(paperModel.id, id));
    if (!found) return null;

    const [{ mksMapCount }] = await db
        .select({ mksMapCount: countDistinct(marksheetPaperMappingModel.id) })
        .from(marksheetPaperMappingModel)
        .leftJoin(batchStudentPaperModel, eq(batchStudentPaperModel.id, marksheetPaperMappingModel.batchStudentPaperId))
        .where(eq(batchStudentPaperModel.paperId, id));

    const [{ bspCount }] = await db
        .select({ bspCount: countDistinct(batchStudentPaperModel.id) })
        .from(batchStudentPaperModel)
        .where(eq(batchStudentPaperModel.paperId, id));

    const [{ topicCount }] = await db
        .select({ topicCount: countDistinct(topicModel.id) })
        .from(topicModel)
        .where(eq(topicModel.paperId, id));

    const [{ componentCount }] = await db
        .select({ componentCount: countDistinct(paperComponentModel.id) })
        .from(paperComponentModel)
        .where(eq(paperComponentModel.paperId, id));

    if (mksMapCount > 0 || bspCount > 0 || topicCount > 0 || componentCount > 0) {
        return {
            success: false,
            message: "Cannot delete paper. It is associated with other records.",
            records: [
                { count: mksMapCount, type: "Mks-paper-mapping" },
                { count: bspCount, type: "Batch-student-paper" },
                { count: componentCount, type: "Paper-component" },
                { count: topicCount, type: "Topic" },
            ],
        };
    }

    const [deleted] = await db.delete(paperModel).where(eq(paperModel.id, id)).returning();
    if (deleted) {
        return { success: true, message: "Paper deleted successfully.", records: [] };
    }
    return { success: false, message: "Failed to delete paper.", records: [] };
}


export async function modelToDto(paper: Paper): Promise<PaperDto | null> {
    const components = await findPaperComponentsByPaperId(paper.id!);
    const topics = await getTopicsByPaperId(paper.id!);


    return {
        ...paper,
        topics,
        components,
    };
}



// export const bulkUploadCourses = async (
//   filePath: string,
//   io?: any,
//   uploadSessionId?: string
// ): Promise<BulkUploadResult> => {
//   const result: BulkUploadResult = { 
//     success: [], 
//     errors: [], 
//     summary: { total: 0, successful: 0, failed: 0 } 
//   };
//   try {
//     const workbook = XLSX.readFile(filePath);
//     const sheetName = workbook.SheetNames[0];
//     const worksheet = workbook.Sheets[sheetName];
//     const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

//     result.summary.total = data.length - 1;

//     for (let i = 1; i < data.length; i++) {
//       const row = data[i] as any[];
//       const rowNumber = i + 1;
//       try {
//         const paperData: Paper = {
//           name: row[0]?.toString()?.trim(),
//           code: row[7]?.toString()?.trim(),
//         };
//         if (!paperData.name) {
//           result.errors.push({ row: rowNumber, data: row, error: "Name is required" });
//           result.summary.failed++;
//           continue;
//         }
//         // Insert the paper
//         const [newPaper] = await db.insert(paperModel).values(paperData).returning();
//         result.success.push(newPaper);
//         result.summary.successful++;
//       } catch (error: unknown) {
//         console.error(`Error processing row ${rowNumber}:`, error);
//         result.errors.push({ row: rowNumber, data: row, error: error instanceof Error ? error.message : "Unknown error" });
//         result.summary.failed++;
//       }
//       if (io && uploadSessionId) {
//         io.to(uploadSessionId).emit("bulk-upload-progress", {
//           processed: i,
//           total: data.length - 1,
//           percent: Math.round((i / (data.length - 1)) * 100)
//         });
//       }
//     }
//     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//     if (io && uploadSessionId) {
//       if (result.errors.length > 0) {
//         io.to(uploadSessionId).emit("bulk-upload-failed", { errorCount: result.errors.length });
//       } else {
//         io.to(uploadSessionId).emit("bulk-upload-done", { successCount: result.success.length });
//       }
//     }
//     return result;
//   } catch (error: unknown) {
//     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//     throw new Error(`Failed to process Excel file: ${error instanceof Error ? error.message : "Unknown error"}`);
//   }
// };