import { Affiliation, Course, CourseLevel, CourseType, Degree, ExamComponent, RegulationType, Paper, PaperComponent, ProgramCourse, Stream, Topic, CourseT, DegreeT, PaperComponentT, ExamComponentT, PaperT, TopicT, ProgramCourseT, StreamT, CourseTypeT, CourseLevelT, AffiliationT, RegulationTypeT } from "@/schemas/models";

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

export interface ProgramCourseDto extends Omit<ProgramCourseT, "streamId" | "courseId" | "courseTypeId" | "courseLevelId" | "affiliationId" | "regulationTypeId"> {
    stream: StreamT | null;
    course: CourseT | null;
    courseType: CourseTypeT | null;
    courseLevel: CourseLevelT | null;
    affiliation: AffiliationT | null;
    regulationType: RegulationTypeT | null;
}