export type StudyMaterialAvailability = "ALWAYS" | "CURRENT_SESSION_ONLY" | "COURSE_LEVEL" | "BATCH_LEVEL";
export type StudyMaterialType = "FILE" | "LINK";
export type StudyMaterialVariant = "RESOURCE" | "WORKSHEET" | "ASSIGNMENT" | "PROJECT"

export interface StudyMaterial {
    readonly id?: number;
    availability: StudyMaterialAvailability;
    subjectMetadataId: number | null;
    sessionId: number | null;
    courseId: number | null;
    batchId: number | null;
    type: StudyMaterialType;
    variant: StudyMaterialVariant;
    name: string;
    url: string | null;
    filePath: string | null;
    dueDate: Date | string  | null;
    createdAt?: Date | string  | null;
    updatedAt?: Date | string  | null;
}

export interface CreateStudyMaterial extends Omit<StudyMaterial, "batchId" | "courseId"> {
    batchIds: number[];
    courseIds: number[];
}