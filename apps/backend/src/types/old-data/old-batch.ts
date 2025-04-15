export interface OldBatch {
    readonly id?: number;
    courseId: number;
    classId: number;
    sectionId: number | null;
    shiftId: number;
    sessionId: number;
    instituteId: number;
}