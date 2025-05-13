import { academicIdentifier } from "../user/academic-identifier";
import { User } from "../user/user";
import { Subject } from "./subject";

export interface Marksheet {
    readonly id?: number;
    studentId: number | null;
    semester: number;
    year: number;
    sgpa: number | null;
    cgpa: number | null;
    classification: string | null;
    remarks: string | null;
    createdAt: Date;
    updatedAt: Date;
    source: "FILE_UPLOAD" | "ADDED";
    file: string | null;
    createdByUser: User;
    updatedByUser: User;
    subjects: Subject[];
    name: string;
    academicIdentifier: academicIdentifier;
}

export interface MarksheetLog {
    item: string;
    source: string;
    file: string | null;
    createdByUser: User;
    updatedByUser: User;
    createdAt: Date;
    updatedAt: Date;
}