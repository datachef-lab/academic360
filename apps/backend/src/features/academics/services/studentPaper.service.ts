import { db } from "@/db/index.js";
import { findSubjectMetdataByStreamId } from "./subjectMetadata.service.js";
import { offeredSubjectModel } from "../models/offeredSubject.model.js";
import { eq, inArray } from "drizzle-orm";
import { paperModel } from "../models/paper.model.js";
import { batchModel } from "../models/batch.model.js";
import { batchPaperModel } from "../models/batchPaper.model.js";
import { BatchType } from "@/types/academics/batch.js";
import { BatchPaperType } from "@/types/academics/batch-paper.js";
import { batchFormatResponse, findBatchById } from "./batch.service.js";
import { studentPaperModel } from "../models/studentPaper.model.js";
import { batchPaperFormatResponse } from "./batchPaper.service.js";
import { count } from 'drizzle-orm';
import { academicIdentifierModel } from "@/features/user/models/academicIdentifier.model.js";
import path from "path";
import { fileURLToPath } from "url";
import { writeExcelFile } from "@/utils/writeExcel.js";
import { findAcademicIdentifierByStudentId } from "@/features/user/services/academicIdentifier.service.js";

const directoryName = path.dirname(fileURLToPath(import.meta.url));

interface FormattedStudentBatchPaperResult {
    batch: BatchType | null;
    papers: BatchPaperType[]
}

export async function findStudents() {
    // Fetch the distinct student-ids 
    const studentIds = await db
        .selectDistinct({ studentId: studentPaperModel.studentId })
        .from(studentPaperModel);


    const arr = [];

    for (let p = 0; p < studentIds.length; p++) {
        const studentPapersArr = await db.select().from(studentPaperModel).where(eq(studentPaperModel.studentId, studentIds[p].studentId));

        const foundAcademicIdentifier = await findAcademicIdentifierByStudentId(studentIds[p].studentId);

        for (let i = 0; i < studentPapersArr.length; i++) {
            const [foundBatchPaper] = await db.select().from(batchPaperModel).where(eq(batchPaperModel.id, studentPapersArr[i].batchPaperId));

            if (!foundBatchPaper) continue;

            const [foundBatch] = await db.select().from(batchModel).where(eq(batchModel.id, foundBatchPaper.batchId));

            if (!foundBatch) continue;

            const formattedBatch = await batchFormatResponse(foundBatch);

            const formattedBatchPaper = await batchPaperFormatResponse(foundBatchPaper);

            const obj = {
                course: formattedBatch?.course?.name,
                class: formattedBatch?.academicClass?.name,
                section: formattedBatch?.section?.name,
                shift: formattedBatch?.shift?.name,
                session: formattedBatch?.sessionId,
                rollNumber: foundAcademicIdentifier?.rollNumber,
                paper: formattedBatchPaper?.paper.name,
                subject: formattedBatchPaper?.paper.offeredSubject.subjectMetadata.name,
                code: formattedBatchPaper?.paper.offeredSubject.subjectMetadata.marksheetCode,
            }

            arr.push(obj);

        }


    }



    // write in excel
    path.resolve(directoryName, "../../../..", "public/temp"),

        writeExcelFile(directoryName, "student-subjects", arr);


    // const BATCH_SIZE = 10;
    // // Fetch the paginated wise and loop
    // const [{ count: totalRows }] = await db.select({ count: count() }).from(studentPaperModel);

    // const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches


    // for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {


    // }
}

export async function findStudentPapersByRollNumber(streamId: number, rollNumber: string) {
    const subjectMetadataArr = await findSubjectMetdataByStreamId(streamId);

    const result: FormattedStudentBatchPaperResult[] = [];

    for (let sem = 1; sem <= 6; sem++) {
        const subjectArr = subjectMetadataArr.filter(sbj => sbj.semester === sem);

        if (subjectArr.length === 0) continue;

        // Find the offered-subjects by subjectArr[]
        const offeredSubjectArr = await db
            .select()
            .from(offeredSubjectModel)
            .where(inArray(offeredSubjectModel.subjectMetadataId, subjectArr.map(sbj => sbj.id as number)))

        if (offeredSubjectArr.length === 0) continue;

        // Find the paper
        const paperArr = await db
            .select()
            .from(paperModel)
            .where(inArray(paperModel.offeredSubjectId, offeredSubjectArr.map(ele => ele.id as number)))

        if (paperArr.length === 0) continue;

        // Find the batch papers for the paperArr
        const batchPaperArr = await db
            .select()
            .from(batchPaperModel)
            .where(inArray(batchPaperModel.paperId, paperArr.map(ele => ele.id as number)))

        if (batchPaperArr.length === 0) continue;

        // Extract distinct batch IDs
        const batchIds = [...new Set(batchPaperArr.map(ele => ele.batchId))];

        // Find the batches
        let batchArr = await db
            .select()
            .from(batchModel)
            .where(
                inArray(batchModel.id, batchIds)
            );

        // Sort the batches by session in descending
        batchArr = batchArr.sort((a, b) => ((b.sessionId as number) - (a.sessionId as number)));

        for (let i = 0; i < batchArr.length; i++) {
            // Create the object for the result
            const obj: FormattedStudentBatchPaperResult = { batch: null, papers: [] }

            obj.batch = await batchFormatResponse(batchArr[i]);

            const batchPapersByBatch = batchPaperArr.filter(ele => ele.batchId === obj.batch?.id);

            // Find the student links for the batch papers
            const foundStudentPapers = await db
                .select()
                .from(studentPaperModel)
                .where(inArray(studentPaperModel.batchPaperId, batchPapersByBatch.map(ele => ele.batchId)));

            for (let j = 0; j < foundStudentPapers.length; j++) {
                const batchPaper = batchPapersByBatch.find(b => b.id === foundStudentPapers[j].batchPaperId);

                if (!batchPaper) continue;

                const formattedBatchPaper = await batchPaperFormatResponse(batchPaper);

                obj.papers.push(formattedBatchPaper as BatchPaperType);
            }

            result.push(obj);
        }

    }

    return result;
}

export async function getExtractedData() {
    const BATCH_SIZE = 10;
    // Fetch the paginated wise and loop
    const [{ count: totalRows }] = await db.select({ count: count() }).from(batchModel);

    const totalBatches = Math.ceil(totalRows / BATCH_SIZE); // Calculate total number of batches


    for (let offset = 0; offset < totalRows; offset += BATCH_SIZE) {
        const batch = await db.select().from(batchModel);
    }
}

export async function studentFormatResponse() {

}