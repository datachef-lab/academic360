import { SubjectType } from "./academics/subject-metadata";


export interface StudentInfo {
  name: string;
  registrationNo: string;
  rollNo: string;
  semester: string;
  examination: string;
}

export interface CourseComponent {
  id: string;
  courseId: string;
  componentType: "Theoretical" | "Practical" | "Tutorial"; // Extend as needed
  fullMarks: number;
  marksObtained: number;
  
  credit: number;
}

export interface Course {
  id: string;
  courseCode: string;
  courseType: string | SubjectType;
  courseName: string;
  year: string | number;
  components: CourseComponent[];
}


export interface GradeCardData {
  universityName: string;
  studentInfo: StudentInfo;
  courses: Course[];
} 