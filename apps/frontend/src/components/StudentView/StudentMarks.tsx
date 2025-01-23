import React, { useState } from "react";
import { MdKeyboardArrowDown } from "react-icons/md";

type Subject = {
  courseCode: string;
  courseName: string;
  marks: number;
  total: number;
  grade: string;
};

type Semester = {
  semester: string;
  subjects: Subject[];
};

const SemesterAccordion: React.FC = () => {
  const [activeSemester, setActiveSemester] = useState<string | null>(null);

  const semesters: Semester[] = [
    {
      semester: "Semester 1",
      subjects: [
        { courseCode: "CS101", courseName: "Introduction to CS", marks: 85, total: 100, grade: "A" },
        { courseCode: "MATH101", courseName: "Calculus I", marks: 90, total: 100, grade: "A+" },
        { courseCode: "PHY101", courseName: "Physics I", marks: 78, total: 100, grade: "B+" },
        { courseCode: "CHEM101", courseName: "Chemistry", marks: 88, total: 100, grade: "A" },
        { courseCode: "ENG101", courseName: "English I", marks: 92, total: 100, grade: "A+" },
      ],
    },
    {
      semester: "Semester 2",
      subjects: [
        { courseCode: "CS102", courseName: "Data Structures", marks: 80, total: 100, grade: "A-" },
        { courseCode: "MATH102", courseName: "Linear Algebra", marks: 85, total: 100, grade: "A" },
        { courseCode: "PHY102", courseName: "Physics II", marks: 75, total: 100, grade: "B+" },
        { courseCode: "CHEM102", courseName: "Organic Chemistry", marks: 82, total: 100, grade: "A-" },
        { courseCode: "ENG102", courseName: "English II", marks: 89, total: 100, grade: "A" },
      ],
    },
    {
      semester: "Semester 3",
      subjects: [
        { courseCode: "CS201", courseName: "Algorithms", marks: 88, total: 100, grade: "A" },
        { courseCode: "MATH201", courseName: "Discrete Math", marks: 83, total: 100, grade: "A-" },
        { courseCode: "PHY201", courseName: "Modern Physics", marks: 79, total: 100, grade: "B+" },
        { courseCode: "CHEM201", courseName: "Inorganic Chemistry", marks: 80, total: 100, grade: "A-" },
        { courseCode: "ENG201", courseName: "English Literature", marks: 87, total: 100, grade: "A" },
      ],
    },
    {
      semester: "Semester 4",
      subjects: [
        { courseCode: "CS202", courseName: "Operating Systems", marks: 86, total: 100, grade: "A" },
        { courseCode: "MATH202", courseName: "Statistics", marks: 89, total: 100, grade: "A" },
        { courseCode: "PHY202", courseName: "Thermodynamics", marks: 81, total: 100, grade: "A-" },
        { courseCode: "CHEM202", courseName: "Physical Chemistry", marks: 84, total: 100, grade: "A" },
        { courseCode: "ENG202", courseName: "Creative Writing", marks: 90, total: 100, grade: "A+" },
      ],
    },
    {
      semester: "Semester 5",
      subjects: [
        { courseCode: "CS301", courseName: "Machine Learning", marks: 90, total: 100, grade: "A+" },
        { courseCode: "MATH301", courseName: "Linear Programming", marks: 87, total: 100, grade: "A" },
        { courseCode: "PHY301", courseName: "Quantum Mechanics", marks: 85, total: 100, grade: "A-" },
        { courseCode: "CHEM301", courseName: "Biochemistry", marks: 88, total: 100, grade: "A" },
        { courseCode: "ENG301", courseName: "Research Writing", marks: 93, total: 100, grade: "A+" },
      ],
    },
    {
      semester: "Semester 6",
      subjects: [
        { courseCode: "CS302", courseName: "Artificial Intelligence", marks: 91, total: 100, grade: "A+" },
        { courseCode: "MATH302", courseName: "Differential Equations", marks: 88, total: 100, grade: "A" },
        { courseCode: "PHY302", courseName: "Nuclear Physics", marks: 83, total: 100, grade: "A-" },
        { courseCode: "CHEM302", courseName: "Advanced Chemistry", marks: 85, total: 100, grade: "A" },
        { courseCode: "ENG302", courseName: "Technical Communication", marks: 92, total: 100, grade: "A+" },
      ],
    },
  ];

  const toggleSemester = (semester: string) => {
    setActiveSemester(activeSemester === semester ? null : semester);
  };

  return (
    <div className="w-full p-4 rounded-lg shadow-lg space-y-1">
      {semesters.map((sem, index) => (
        <div key={index} className="border  border-gray-300 rounded-lg">
          <button
            onClick={() => toggleSemester(sem.semester)}
            className="w-full flex justify-between items-center px-5 py-2 font-medium text-lg bg-gray-300 text-gray-700 rounded-lg transition-all duration-300 hover:bg-gray-500 hover:text-white"
          >
            {sem.semester}
            <span
              className={`transform transition-transform ${
                activeSemester === sem.semester ? "rotate-180" : "rotate-0"
              } `}
            >
              <MdKeyboardArrowDown size={15}/>

            </span>
          </button>
          {activeSemester === sem.semester && (
            <div className="bg-white px-4 py-5 space-y-1">
              {sem.subjects.map((subject, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center border p-3 rounded-lg shadow-md hover:shadow-lg transition duration-300"
                >
                  <div>
                    <p className="font-semibold text-gray-700">{subject.courseCode}</p>
                    <p className="text-gray-500">{subject.courseName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-700 font-medium">
                      {subject.marks} / {subject.total}
                    </p>
                    <p className="text-blue-600 font-semibold">{subject.grade}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default SemesterAccordion;
