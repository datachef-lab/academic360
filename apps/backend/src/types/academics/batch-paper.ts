import { BatchPaper } from "@/features/academics/models/batchPaper.model.js";
import { BatchType } from "./batch.js";
import { PaperType } from "./paper.js";

export interface BatchPaperType extends Omit<BatchPaper, "batchId" | "paperId"> {
    batch: BatchType;
    paper: PaperType;
}