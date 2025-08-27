import { Subject } from "./subject";

export interface DbPaperSubject {
    readonly id?: number;
    subjectTypeId: number;
    subjectId: number;
}

export interface PaperSubject extends Omit<DbPaperSubject, "subjectTypeId" | "subjectId"> {
    subject: Subject
}