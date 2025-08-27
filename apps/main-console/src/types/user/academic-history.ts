import { Specialization } from "../resources/specialization";
import { Institution } from "../resources/institution.types";
import { BoardUniversity } from "../resources/board-university.types";
import { BoardResultStatus } from "../resources/board-result-status.types";

export interface AcademicHistory {
    readonly id?: number;
    studentId: number,
    lastInstitution?: Institution | null;
    lastBoardUniversity?: BoardUniversity | null;
    specialization?: Specialization | null;
    lastResult?: BoardResultStatus | null;
    studiedUpToClass: number | null,
    passedYear: number | null,
    remarks: string | null,
    createdAt?: Date;
    updatedAt?: Date;
}