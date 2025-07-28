import { Class } from "./class";
import { Course } from "../course-design";
import { Section } from "./section";
import { Shift } from "./shift";
import { Session } from "./session";
import { SubjectMetadata } from "./subject-metadata";
import { PaginatedResponse } from "../pagination";
import { Framework, ProgrammeType, StudentStatus } from "../enums";

export interface Batch {
    readonly id?: number;
    academicYearId: number;
    course: Course;
    academicClass: Class | null;
    section: Section | null;
    shift: Shift | null;
    session: Session | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface StudentBatchEntry {
    studentId: number;
    studentName: string;
    roll: string | null;
    registrationNumber: string | null;
    uid: string;
    subjects: SubjectMetadata[];
    status: StudentStatus;
}

export interface StudentBatchSubjectEntry {
    studentId: number;
    studentName: string;
    roll: string | null;
    registrationNumber: string | null;
    uid: string;
    subject: SubjectMetadata;
    status: StudentStatus;
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
