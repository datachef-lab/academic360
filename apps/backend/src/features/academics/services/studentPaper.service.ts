import { db } from "@/db/index.js";
import { findSubjectMetdataByStreamId } from "./subjectMetadata.service.js";
import { offeredSubjectModel } from "../models/offeredSubject.model.js";
import { inArray } from "drizzle-orm";
import { paperModel } from "../models/paper.model.js";
import { batchModel } from "../models/batch.model.js";
import { batchPaperModel } from "../models/batchPaper.model.js";
import { BatchType } from "@/types/academics/batch.js";
import { BatchPaperType } from "@/types/academics/batch-paper.js";
import { batchFormatResponse, findBatchById } from "./batch.service.js";
import { studentPaperModel } from "../models/studentPaper.model.js";
import { batchPaperFormatResponse } from "./batchPaper.service.js";

interface FormattedStudentBatchPaperResult {
    batch: BatchType | null;
    papers: BatchPaperType[]
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
        batchArr = batchArr.sort((a, b) => b.session - a.session);

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


export async function studentFormatResponse() {

}