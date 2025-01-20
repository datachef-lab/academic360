import React from "react";

type ClassSchedule = {
  day: string;
  time: string;
  room: string;
};

type Course = {
  courseCode: string;
  courseName: string;
  schedule: ClassSchedule[];
};

type CourseCardProps = {
  courses: Course[];
  showAllDays?: boolean; // If true, display the schedule for the entire week
};

const CourseCard: React.FC<CourseCardProps> = ({ courses, showAllDays = false }) => {
  const currentDay = new Date().toLocaleString("en-US", { weekday: "long" });

  return (
    <div className="p-4 bg-gray-100 rounded-lg shadow-md max-w-screen-lg mx-auto">
      {courses.map((course, index) => {
        const filteredSchedule = showAllDays
          ? course.schedule
          : course.schedule.filter((cls) => cls.day === currentDay);

        return (
          <div key={index} className="border-b py-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              {/* Course details */}
              <div className="text-left mb-4 sm:mb-0">
                <h4 className="text-lg font-semibold text-gray-800">{course.courseCode}</h4>
                <p className="text-gray-600">{course.courseName}</p>
              </div>

              {/* Schedule details */}
              <div className="text-left sm:text-right">
                {filteredSchedule.length > 0 ? (
                  filteredSchedule.map((cls, idx) => (
                    <div key={idx} className="mb-2">
                      <p className="text-gray-700 font-medium">{cls.time}</p>
                      <p className="text-sm text-blue-600 font-semibold">Room {cls.room}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No classes scheduled for today.</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CourseCard;
