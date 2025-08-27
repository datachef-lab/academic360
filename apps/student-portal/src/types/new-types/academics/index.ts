import { Class, Course, Degree, Specialization, StudyMaterial, SubjectMetadata, SubjectType } from "@/db/schema";

export interface CourseDto extends Omit<Course, "degreeId"> {
    degree: Degree;
}

export interface SubjectMetadataDto extends Omit<SubjectMetadata, "subjectTypeId" | "specializationId" | "classId" | "degreeId"> {
    subjectType: SubjectType | null;  
    specialization: Specialization | null;
    class: Class;
    degree: Degree;
    studyMaterials: StudyMaterial[];
}