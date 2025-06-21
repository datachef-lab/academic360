export type FeesStructure = {
    id: number;
    closingDate: string;
    academicYearId: number;
    courseId: number;
    semester: number;
    advanceForCourseId: number;
    advanceForSemester?: number;
    feeSlabId: number;
    startDate: string;
    endDate: string;
    onlineDateFrom: string;
    onlineDateTo: string;
    numberOfInstalments?: number;
    instalmentFromDate: string;
    instalmentToDate: string;
    createdAt: Date;
    updatedAt: Date;
};
