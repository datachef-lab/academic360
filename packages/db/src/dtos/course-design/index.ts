import { CourseT, DegreeT, PaperComponentT, ExamComponentT, PaperT, TopicT, ProgramCourseT, StreamT, CourseTypeT, CourseLevelT, AffiliationT, RegulationTypeT, SubjectT, SubjectTypeT, AcademicYearT, ClassT, SubjectGroupingMainT, SubjectGroupingProgramCourseT, SubjectGroupingSubjectT } from "@/schemas/models";

export interface CourseDto extends Omit<CourseT, "degreeId"> {
    degree: DegreeT | null;
}

export interface PaperComponentDto extends Omit<PaperComponentT, "examComponentId"> {
    examComponent: ExamComponentT;
}

export interface PaperDto extends PaperT {
    components: PaperComponentDto[];
    topics: TopicT[];
}

export interface PaperWithDetailsDto extends PaperDto {
    subject: SubjectT;
    affiliation: AffiliationT;
    regulationType: RegulationTypeT;
    academicYear: AcademicYearT;
    subjectType: SubjectTypeT;
    programCourse: ProgramCourseDto;
    class: ClassT;
}

export interface ProgramCourseDto extends Omit<ProgramCourseT, "streamId" | "courseId" | "courseTypeId" | "courseLevelId" | "affiliationId" | "regulationTypeId"> {
    stream: StreamT | null;
    course: CourseT | null;
    courseType: CourseTypeT | null;
    courseLevel: CourseLevelT | null;
    affiliation: AffiliationT | null;
    regulationType: RegulationTypeT | null;
}

// Basic DTO for Subject model (extendable for relations if needed later)
export interface SubjectDto extends SubjectT { }


export interface SubjectGroupingProgramCourseDto extends SubjectGroupingProgramCourseT { 
    programCourse: ProgramCourseDto;
}

export interface SubjectGroupingSubjectDto extends SubjectGroupingSubjectT { 
    subject: SubjectDto;
}

export interface SubjectGroupingMainDto extends SubjectGroupingMainT { 
    academicYear: AcademicYearT;
    subjectType: SubjectTypeT;
    subjectGroupingProgramCourses: SubjectGroupingProgramCourseDto[];
    subjectGroupingSubjects: SubjectGroupingSubjectDto[];
}