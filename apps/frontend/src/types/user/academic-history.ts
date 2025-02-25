import { BoardUniversity } from "../resources/board-university";
import { Institution } from "../resources/institution";
import { Specialization } from "../resources/specialization";
import { ResultStatus } from "../enums"
export interface AcademicHistory {
    readonly id?: number;
    lastInstitution?: Institution | null;
    lastBoardUniversity?: BoardUniversity | null;
    lastResult?: ResultStatus | null;
    specialization?: Specialization | null;
    studentId: number,
    studiedUpToClass: number | null,
    passedYear: number | null,
    remarks: string | null,
    createdAt?: Date;
    updatedAt?: Date;
}