import React from "react";
import CourseCard from "./CourseCard";

const Courses: React.FC = () => {
  const sampleCourses = [
    {
      courseCode: "CS101",
      courseName: "Introduction to Computer Science",
      schedule: [
        { day: "Monday", time: "10:00 AM - 11:30 AM", room: "101" },
        { day: "Wednesday", time: "10:00 AM - 11:30 AM", room: "101" },
        { day: "Friday", time: "10:00 AM - 11:30 AM", room: "101" },
      ],
    },
    {
      courseCode: "MATH201",
      courseName: "Advanced Calculus",
      schedule: [
        { day: "Tuesday", time: "9:00 AM - 10:30 AM", room: "202" },
        { day: "Thursday", time: "9:00 AM - 10:30 AM", room: "202" },
      ],
    },
    {
      courseCode: "PHY301",
      courseName: "Physics for Engineers",
      schedule: [
        { day: "Monday", time: "2:00 PM - 3:30 PM", room: "303" },
        { day: "Wednesday", time: "2:00 PM - 3:30 PM", room: "303" },
        { day: "Friday", time: "2:00 PM - 3:30 PM", room: "303" },
      ],
    },
    {
      courseCode: "CHEM101",
      courseName: "Introduction to Chemistry",
      schedule: [
        { day: "Tuesday", time: "11:00 AM - 12:30 PM", room: "104" },
        { day: "Thursday", time: "11:00 AM - 12:30 PM", room: "104" },
      ],
    },
    {
      courseCode: "ENG202",
      courseName: "English Literature",
      schedule: [
        { day: "Monday", time: "1:00 PM - 2:30 PM", room: "105" },
        { day: "Wednesday", time: "1:00 PM - 2:30 PM", room: "105" },
      ],
    },
  ];

  return (
    <div className="p-4 flex flex-col items-center justify-center space-y-4 sm:space-y-6">
   
    <div className="w-full max-w-screen-lg">
      <CourseCard courses={sampleCourses} showAllDays={false} />
    </div>
  </div>
  );
};
export default Courses;
