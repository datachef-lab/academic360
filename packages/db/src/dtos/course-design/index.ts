import { Course, Degree, ExamComponent, Paper, PaperComponent, Topic } from "@/schemas/models";

export interface CourseDto extends Omit<Course, "degreeId"> {
    degree: Degree | null;
}

export interface PaperComponentDto extends Omit<PaperComponent, "examComponentId"> {
    examComponent: ExamComponent;
}

export interface PaperDto extends Paper {
    components: PaperComponentDto[];
    topics: Topic[];
}