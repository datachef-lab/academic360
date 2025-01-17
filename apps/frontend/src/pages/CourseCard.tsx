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
  
  type  CourseCardProps = {
    courses: Course[];
    showAllDays?: boolean; // If true, display the schedule for the entire week
  };
  
  const  CourseCard: React.FC< CourseCardProps> = ({ courses, showAllDays = false }) => {
    const currentDay = new Date().toLocaleString("en-US", { weekday: "long" });
  
    return (
      <div className="max-w-4xl mx-auto p-4 bg-gray-100 rounded-lg shadow-md">
        {courses.map((course, index) => {
          const filteredSchedule = showAllDays
            ? course.schedule
            : course.schedule.filter((cls) => cls.day === currentDay);
  
          return (
            <div key={index} className="border-b py-4">
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <h4 className="text-lg font-semibold text-gray-800">{course.courseCode}</h4>
                  <p className="text-gray-600">{course.courseName}</p>
                </div>
                <div className="text-right">
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