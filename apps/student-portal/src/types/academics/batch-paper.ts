import { PaperSubject } from "./paper-subject";

export interface DbBatchPaper {
    readonly id?: number;
    index_col: number | null;
    parent_id: number;
    subjectTypeId: number;
    subjectId: number;
    paperId: number;
}

export interface BatchPaper extends Omit<DbBatchPaper, "parent_id"> {
    batchId: number;
    subjectTypeName: string;
    subjectName: string;
    paper: PaperSubject;
    paperName: string;
}