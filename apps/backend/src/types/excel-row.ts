export type ExcelRow = {
    id: number;
    registration_no: string;
    stream: string;
    course: string;
    name: string;
    semester: number;
    sgpa?: number;
    remarks?: string;
    full_marks: number;
    year1: number;
    year2?: number;
    ngp?: number;
    credit?: number;
    tgp?: number;
    subject: string;
    internal_marks?: number | string;
    theory_marks?: number | string;
    total?: number | string;
    status?: string;
    grade?: string;
    roll_no: string;
    uid?: string | null;
    email?: string
}