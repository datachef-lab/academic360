import { Course } from "../course-design";
import { Framework } from "../enums";

export interface AcademicIdentifier {
    readonly id?: number,
    studentId: number,
    frameworkType: Framework | null,
    rfid: string | null,
    course: Course | null;
    // stream: Stream | null,
    // programmeType: ProgrammeType | null,
    cuFormNumber: string | null,
    uid: string | null,
    oldUid: string | null,
    registrationNumber: string | null,
    rollNumber: string | null,
    section: string | null,
    classRollNumber: string | null,
    apaarId: string | null,
    abcId: string | null,
    apprid: string | null,
    checkRepeat: boolean,
    createdAt?: Date,
    updatedAt?: Date,
}