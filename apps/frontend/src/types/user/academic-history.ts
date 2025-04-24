import { BoardUniversity } from "../resources/board-university";
import { Institution } from "../resources/institution";
import { Specialization } from "../resources/specialization";
import { ResultStatus } from "../enums"
export interface AcademicHistory {
    readonly id?: number;
    studentId: number,
    lastInstitution?: Institution | null;
    lastBoardUniversity?: BoardUniversity | null;
    specialization?: Specialization | null;
    lastResult?: ResultStatus | null;    
    studiedUpToClass: number | null,
    passedYear: number | null,
    remarks: string | null,
    createdAt?: Date;
    updatedAt?: Date;
}