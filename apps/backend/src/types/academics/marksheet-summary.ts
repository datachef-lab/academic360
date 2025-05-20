import { SubjectMetadataType } from "./subject-metadata";

export interface MarksheetSummary {
    id: number;
    uid: string;
    semester: number;
    year1: number; // Year of appearance
    year2: number | null; // Year of passing
    sgpa: string | null;
    cgpa: string | null;
    credits: number;
    totalCredits: number;
    result: "PASSED" | "FAILED";
    percentage: number;
    classification: string | null;
    remarks: string | null;
    failedSubjects: SubjectMetadataType[];
}