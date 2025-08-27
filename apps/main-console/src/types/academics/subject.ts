import { SubjectMetadata } from "./subject-metadata";

export interface Subject {
    readonly id?: number;
    marksheetId: number | null;
    subjectMetadata: SubjectMetadata;
    year1: number;
    year2: number | null;
    internalMarks: string | null;
    practicalMarks: string | null;
    tutorialMarks: string | null;
    theoryMarks: string | null;
    totalMarks: number | null;
    status: string | null;
    ngp: number | null;
    tgp: number | null;
    letterGrade: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}