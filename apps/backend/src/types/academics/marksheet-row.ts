export interface MarksheetRow {
    readonly id?: number;
    registration_no: string;
    stream: string;
    course: string;
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

    subjectName: string;
    paperCode: string;

    internal_year: number | null;
    full_marks_internal: number | null;
    internal_marks: string | null;
    internal_credit: number | null;
    internal_credit_obtained: number | null;


    practical_year: number | null;
    full_marks_practical: number | null;
    practical_marks: string | null;
    practical_credit: number | null;
    practical_credit_obtained: number | null;

    theory_year: number | null;
    full_marks_theory: number | null;
    theory_marks: string | null;
    theory_credit: number | null;
    theory_credit_obtained: number | null;

    viva_year: number | null;
    full_marks_viva: number | null;
    viva_marks: string | null;
    viva_credit: number | null;
    viva_credit_obtained: number | null;

    project_year: number | null;
    full_marks_project: number | null;
    project_marks: string | null;
    project_credit: number | null;
    project_credit_obtained: number | null;

    total: string | null;
    status: string | null;
    grade: string | null;
    roll_no: string;
    uid: string;
    framework: "CBCS" | "CCF";
    specialization: string | null;
    shift: "Morning" | "Afternoon" | "Evening" | "Day" | null;
    section: string | null;
    errorMessage?: string;
    cgpa: string | number | null | undefined;
    classification: string | null;
}