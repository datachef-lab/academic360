import { Specialization } from "../resources/specialization";
import { ResultStatus } from "../enums"
import { Institution } from "../resources/institution.types";
import { BoardUniversity } from "../resources/board-university.types";
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