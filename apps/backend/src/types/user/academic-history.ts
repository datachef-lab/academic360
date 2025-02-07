import { AcademicHistory } from "@/features/user/models/academicHistory.model.js";

export interface AcademicHistoryType extends Omit<AcademicHistory, "lastInstitutionId" | "lastBoardUniversityId" | "lastResultId"> {
    lastInstitution: string | null;
    lastBoardUniversity: string | null;
    lastResult: string | null;
}