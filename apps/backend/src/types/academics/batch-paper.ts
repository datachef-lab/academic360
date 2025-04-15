import { BatchPaper } from "@/features/academics/models/batchPaper.model.js";
import { PaperType } from "./paper.js";
export interface BatchPaperType extends Omit<BatchPaper, "paperId"> {
    paper: PaperType;
}