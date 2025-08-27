import React from "react";
import { CourseList } from "./course-list";
import { findAllDbCourses } from "@/lib/services/course.service";

const ITEMS_PER_PAGE = 10; // Define the limit

export default async function MastersPage() {
  // Fetch paginated courses and total count
  const { courses: initialCourses, totalCount: totalCourseCount } = await findAllDbCourses(1, ITEMS_PER_PAGE); // Use the defined limit

  return (
    <CourseList 
      initialCourses={initialCourses} 
      totalCount={totalCourseCount} 
      limit={ITEMS_PER_PAGE} // Pass the limit to CourseList
    />
  );
}
