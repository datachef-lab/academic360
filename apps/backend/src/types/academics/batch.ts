import { Batch } from "@/features/academics/models/batch.model.js";
import { CourseType } from "./course.js";
import { Class } from "@/features/academics/models/class.model.js";
import { Section } from "@/features/academics/models/section.model.js";
import { Shift } from "@/features/academics/models/shift.model.js";
import { Session } from "@/features/academics/models/session.model.js";
import { PaginatedResponse } from "@/utils/PaginatedResponse.js";
import { SubjectMetadataType } from "./subject-metadata.js";
import { frameworkTypeEnum, programmeTypeEnum } from "@/features/user/models/helper.js";


export interface BatchType extends Omit<Batch, "courseId" | "classId" | "sectionId" | "shiftId" | "sessionId"> {
    course: CourseType | null;
    academicClass: Class | null;
    section: Section | null;
    shift: Shift | null;
    session: Session | null;
}

export interface StudentBatchEntry {
    studentId: number;
    uid: string;
    subjects: SubjectMetadataType[];
    status: string;
}

export interface BatchDetails extends BatchType  {
    paginatedStudentEntry: PaginatedResponse<StudentBatchEntry>
}

export interface BatchSummary extends Batch {
    courseName: string;
    className: string;
    sectionName: string;
    shift: string;
    session: string;
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
    framework: typeof frameworkTypeEnum.enumValues[number];
    programmeType: typeof programmeTypeEnum.enumValues[number];
}