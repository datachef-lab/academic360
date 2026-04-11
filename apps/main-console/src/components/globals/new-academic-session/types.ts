/** Persisted while the wizard is open or until final confirmation (step 3). */
export type NewAcademicSessionDraft = {
  version: 2;
  updatedAt: string;
  /** 1 = Year/session · 2 = Promotion · 3 = Confirm */
  step: 1 | 2 | 3;
  furthestStep?: number;
  academicYearId?: number | null;
  academicYearLabel?: string;
  isCurrentYear?: boolean;
  /** Step 2 — filters & promotion range ids (for API + draft). */
  promotionDraft?: {
    fromSessionId?: number;
    toSessionId?: number;
    fromClassId?: number;
    toClassId?: number;
    affiliationId?: number;
    regulationTypeId?: number;
    programCourseId?: number;
    shiftId?: number;
    loadedAt?: string;
  };
  promotionReviewAcknowledged?: boolean;
};

export const DRAFT_STORAGE_KEY = "academic360:newAcademicSessionDraft";
