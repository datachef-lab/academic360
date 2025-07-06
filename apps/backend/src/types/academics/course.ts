import { Course } from "@/features/academics/models/course.model.js";
// import { StreamType } from "./stream";
import { Degree } from "@/features/resources/models/degree.model";

export interface CourseType extends Omit<Course, "degreeId"> {
    // stream: StreamType | null;
    degree: Degree | null;
}