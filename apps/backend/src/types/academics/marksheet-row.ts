export interface MarksheetRow {
    readonly id?: number;
    registration_no: string;
    stream: string;
    course: "honours" | "general";
    semester: number;
    name: string;
    sgpa: number | null;
    remarks: string | null;
    full_marks: number | null;
    year1: number;
    year2: string | null;
    ngp: string | null;
    credit: number | null;
    tgp: string | null;
    subject: string;
    internal_marks: string | null;
    theory_marks: string | null;
    total: string | null;
    tutorial_marks: string | null;
    status: string | null;
    grade: string | null;
    roll_no: string;
    uid: string;
    framework: "CBCS" | "CCF";
    specialization: string | null;
    shift: "Morning" | "Afternoon" | "Evening" | "Day" | null;
    section: string | null;
}