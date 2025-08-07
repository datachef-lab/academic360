import { Degree } from "../resources/degree.types";

export interface Course {
    readonly id?: number;
    degree: Degree | null;
    name: string;
    shortName: string | null;
    sequence: number | null;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface AffiliationType {
    readonly id?: number;
    name: string;
    description: string | null;
    sequence: number | null;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Affiliation {
    readonly id?: number;
    name: string;
    shortName: string | null;
    sequence: number | null;
    disabled: boolean;
    remarks: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface BatchStudentPaper {
    readonly id?: number;
    batchStudentMappingId: number;
    paperId: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CourseLevel {
    readonly id?: number;
    name: string;
    shortName: string | null;
    sequence: number | null;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CourseType {
    readonly id?: number;
    name: string;
    shortName: string | null;
    sequence: number | null;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ExamComponent {
    readonly id?: number;
    name: string;
    shortName: string | null;
    code: string | null;
    sequence: number | null;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}



export interface PaperComponent {
    readonly id?: number;
    paperId: number;
    examComponent: ExamComponent;
    fullMarks: number | null;
    credit: number | null;
    createdAt?: Date;
    updatedAt?: Date;
} 

export interface Paper {
    readonly id?: number;
    subjectId: number;
    affiliationId: number;
    regulationTypeId: number;
    academicYearId: number;
    subjectTypeId: number;
    courseId: number;
    classIds: number[]; // changed from classId: number
    name: string;
    code: string;
    isOptional: boolean;
    sequence: number | null;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    components: PaperComponent[];
    topics: Topic[];
}

// Enhanced paper type for detailed paper response with direct foreign key relationships and class details
export interface PaperWithDetails {
    readonly id?: number;
    subjectId: number;
    affiliationId: number;
    regulationTypeId: number;
    academicYearId: number;
    subjectTypeId: number;
    courseId: number;
    classIds: number[]; // changed from classId: number
    name: string;
    code: string | null;
    isOptional: boolean;
    sequence: number | null;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    
    // Class details (from join)
    className: string;
    
    // Enhanced paper components with exam component details
    paperComponents: Array<{
        id?: number;
        paperId: number;
        examComponentId: number;
        fullMarks: number;
        credit: number;
        createdAt?: Date;
        updatedAt?: Date;
        
        // Exam component details
        examComponentName: string;
        examComponentShortName: string | null;
        examComponentCode: string | null;
    }>;
}

export interface ProgramCourse {
    readonly id?: number;
    streamId: number;
    courseId: number;
    courseTypeId: number;
    courseLevelId: number;
    duration: number;
    totalSemesters: number;
    affiliationId: number;
    regulationTypeId: number;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface RegulationType {
    readonly id?: number;
    name: string;
    shortName: string | null;
    sequence: number | null;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Specialization {
    readonly id?: number;
    name: string;
    sequence: number | null;
    disabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Stream {
    readonly id?: number;
    name: string;
    shortName: string | null;
    code: string | null;
    sequence: number | null;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}



export interface SubjectType {
    readonly id?: number;
    name: string;
    code: string | null;
    sequence: number | null;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Subject {
    readonly id?: number;
    name: string;
    code: string | null;
    sequence: number | null;
    disabled: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface Topic {
    readonly id?: number;
    paperId: number;
    name: string;
    disabled: boolean;
    sequence: number | null;
    createdAt?: Date;
    updatedAt?: Date;
}