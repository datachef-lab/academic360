export interface AcademicYear {
    readonly id?: number;
    year: string;
    isCurrentYear: boolean;
    sessionId: number;
    creaytedAt?: Date;
    updatedAt?: Date;
}