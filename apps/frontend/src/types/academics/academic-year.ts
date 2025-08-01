export interface AcademicYear {
    readonly id?: number;
    year: string;
    isCurrentYear: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}