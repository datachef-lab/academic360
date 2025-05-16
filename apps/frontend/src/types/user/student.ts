import { Community, Framework, Level, Shift } from "../enums";
import { Specialization } from "../resources/specialization";
import { AcademicIdentifier } from "./academic-identifier";


import { PersonalDetails } from "./personal-details";

export interface Student {
    readonly id?: number,
    name: string;
    userId: number,
    community: Community | null,
    handicapped: boolean,
    level: Level | null,
    framework: Framework | null,
    specializationId: number,
    shift: Shift | null,
    lastPassedYear: number,
    notes: string,
    active: boolean,
    alumni: boolean,
    leavingDate: Date,
    leavingReason: string,
    specialization?: Specialization | null;
    academicIdentifier?: AcademicIdentifier | null;
    personalDetails?: PersonalDetails | null;
    createdAt: Date,
    updatedAt: Date,
}