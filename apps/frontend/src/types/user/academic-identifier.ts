import { Stream } from "../academics/stream";
import { DegreeProgramme, Framework } from "../enums";

export interface AcademicIdentifier {
    readonly id?: number,
    studentId: number,
    frameworkType: Framework | null,
    rfid: string | null,
    stream: Stream | null,
    degreeProgramme: DegreeProgramme | null,
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