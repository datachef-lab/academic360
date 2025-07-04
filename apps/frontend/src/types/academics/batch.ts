import { Class } from "./class";
import { Course } from "./course";
import { Section } from "./section";
import { Shift } from "./shift";
import { Session } from "./session";
import { SubjectMetadata } from "./subject-metadata";
import { PaginatedResponse } from "../pagination";
import { Framework, ProgrammeType } from "../enums";

export interface Batch {
    readonly id?: number;
    academicYearId: number;
    course: Course;
    academicClass: Class | null;
    section: Section | null;
    shift: Shift | null;
    session: Session | null;
    creaytedAt?: Date;
    updatedAt?: Date;
}

export interface StudentBatchEntry {
    studentId: number;
    uid: string;
    subjects: SubjectMetadata[];
    status: string;
}

export interface BatchDetails extends Batch  {
    paginatedStudentEntry: PaginatedResponse<StudentBatchEntry>
}

export interface BatchSummary extends Batch {
    courseName: string;
    className: string;
    sectionName: string;
    shift: Shift | null;
    session: Session | null;
    totalStudents: number;
    totalSubjects: number;
}

export interface BatchStudentRow {
    academicYear: string;
    course: string;
    session: string;
    class: string;
    section: string;
    shift: string;
    studentName: string;
    uid: string;
    paperCode: string;
    error?: string;
    framework: Framework;
    programmeType: ProgrammeType;
}
