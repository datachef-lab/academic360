import { Class } from "@/features/academics/models/class.model.js";
import { SubjectMetadataType } from "./subject-metadata.js";

export interface MarksheetSummary {
    id: number;
    uid: string;
    class: Class;
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