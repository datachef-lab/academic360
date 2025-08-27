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

export interface SubjectMetadataType {
    readonly id: number;
    stream: {
        id?: number | undefined;
        framework?: "CCF" | "CBCS" | null | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        degreeProgramme?: "HONOURS" | "GENERAL";
        duration?: number | undefined;
        numberOfSemesters?: number | undefined;

        degree: {
            name: string;
            id?: number | undefined;
            createdAt?: Date | undefined;
            updatedAt?: Date | undefined;
            sequence?: number | null | undefined;
            level?: "SECONDARY" | "HIGHER_SECONDARY" | "UNDER_GRADUATE" | "POST_GRADUATE" | null | undefined;
        }
    } | null;
    specialization?: {
        name: string;
        id?: number | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        sequence?: number | null | undefined;
    } | null;
    subjectType: {
        id?: number | undefined;
        createdAt?: Date | undefined;
        updatedAt?: Date | undefined;
        irpName?: string | null | undefined;
        irpShortName?: string | null | undefined;
        marksheetName?: string | undefined;
        marksheetShortName?: string | undefined;
    } | null;

    semester: number;

    category: string | null;

    irpName: string | null;
    name: string;
    irpCode: string | null;
    marksheetCode: string | null;
    isOptional: boolean;
    credit: string | null;
    theoryCredit: number | null;
    fullMarksTheory: number | null;
    practicalCredit: number | null;
    fullMarksPractical: number | null;
    internalCredit: number | null;
    fullMarksInternal: number | null;
    projectCredit: number | null;
    fullMarksProject: number | null;
    vivalCredit: number | null;
    fullMarksViva: number | null;
    fullMarks: number | null;
    createdAt: Date | string | null;
    updatedAt: Date | string | null;
}