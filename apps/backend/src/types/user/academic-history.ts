import { AcademicHistory } from "@/features/user/models/academicHistory.model.js";
import { BoardUniversityType } from "../resources/board-university";
import { InstitutionType } from "../resources/institution";
import { BoardResultStatus } from "@/features/resources/models/boardResultStatus.model";
import { Specialization } from "@/features/user/models/specialization.model";

export interface AcademicHistoryType extends Omit<AcademicHistory, "lastInstitutionId" | "lastBoardUniversityId" | "lastResultId" | "specializationId"> {
    lastInstitution?: InstitutionType | null;
    lastBoardUniversity?: BoardUniversityType | null;
    lastResult?: BoardResultStatus | null;
    specialization?: Specialization | null;
}