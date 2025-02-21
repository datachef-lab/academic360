import { Course } from "@/features/academics/models/course.model.js";
import { StreamType } from "./stream";

export interface CourseType extends Omit<Course, "streamId"> {
    stream: StreamType;
}