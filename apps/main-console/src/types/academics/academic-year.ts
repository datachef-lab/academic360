export interface AcademicYear {
  readonly id?: number;
  legacyAcademicYearId?: number | null;
  year: string;
  isCurrentYear?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
