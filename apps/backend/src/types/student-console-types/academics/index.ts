// import { Class, Course, Degree, Specialization, StudyMaterial, SubjectMetadata, SubjectType } from "@/db/schema";

// import { Class } from   "@/features/academics/models/class.model";
// import { Course } from "@/features/course-design/models/course.model";
// import { Degree } from "@/features/resources/models/degree.model";
// import { Specialization } from "@/features/course-design/models/specialization.model";


// export interface CourseDto extends Omit<Course, "degreeId"> {
//     degree: Degree;
// }

// export interface SubjectMetadataDto extends Omit<SubjectMetadata, "subjectTypeId" | "specializationId" | "classId" | "degreeId"> {
//     subjectType: SubjectType | null;
//     specialization: Specialization | null;
//     class: Class;
//     degree: Degree;
//     studyMaterials: studyMaterial[];
// }