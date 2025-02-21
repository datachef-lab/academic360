import { StudentPaper } from "@/features/academics/models/studentPaper.model";
import { BatchPaperType } from "./batch-paper";

export interface StudentPaperType extends Omit<StudentPaper, "batchPaperId"> {
    batchPaper: BatchPaperType;
}