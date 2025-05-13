// Types for course data
export interface CourseComponent {
  id: string;
  type: string;
  fullMarks: number;
  marksObtained: number;
  credit: number;
}

export interface CourseData {
  id: string;
  courseCode: string;
  courseType: string;
  courseName: string;
  year: string;
  components: CourseComponent[];
}

// Dummy initial data
export const initialCourseData: CourseData[] = [
  {
    id: "1",
    courseCode: "PHY-101",
    courseType: "Core",
    courseName: "Physics",
    year: "2023",
    components: [
      { id: "1-1", type: "Theoretical", fullMarks: 75, marksObtained: 60, credit: 3 },
      { id: "1-2", type: "Practical", fullMarks: 25, marksObtained: 20, credit: 1 }
    ]
  },
  {
    id: "2",
    courseCode: "CHEM-101",
    courseType: "Core",
    courseName: "Chemistry",
    year: "2023",
    components: [
      { id: "2-1", type: "Theoretical", fullMarks: 75, marksObtained: 55, credit: 3 },
      { id: "2-2", type: "Practical", fullMarks: 25, marksObtained: 18, credit: 1 }
    ]
  },
  {
    id: "3",
    courseCode: "MATH-101",
    courseType: "Core",
    courseName: "Mathematics",
    year: "2023",
    components: [
      { id: "3-1", type: "Theoretical", fullMarks: 75, marksObtained: 65, credit: 3 },
      { id: "3-2", type: "Practical", fullMarks: 25, marksObtained: 22, credit: 1 }
    ]
  }
];

// Calculate totals for a course's components
export const calculateTotals = (components: CourseComponent[]) => {
  return components.reduce((totals, component) => ({
    fullMarks: totals.fullMarks + component.fullMarks,
    marksObtained: totals.marksObtained + component.marksObtained,
    credit: totals.credit + component.credit
  }), { fullMarks: 0, marksObtained: 0, credit: 0 });
};

// Calculate grade based on percentage
export const calculateGrade = (marksObtained: number, fullMarks: number): string => {
  if (fullMarks === 0) return 'N/A';
  
  const percentage = (marksObtained / fullMarks) * 100;
  
  if (percentage >= 90) return 'O';
  if (percentage >= 80) return 'E';
  if (percentage >= 70) return 'A';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  if (percentage >= 30) return 'P';
  return 'F';
};

// Calculate credit points for a component
export const calculateCreditPoints = (component: CourseComponent): number => {
  if (component.fullMarks === 0) return 0;
  
  const percentage = (component.marksObtained / component.fullMarks) * 100;
  let gradePoint = 0;
  
  if (percentage >= 90) gradePoint = 10;
  else if (percentage >= 80) gradePoint = 9;
  else if (percentage >= 70) gradePoint = 8;
  else if (percentage >= 60) gradePoint = 7;
  else if (percentage >= 50) gradePoint = 6;
  else if (percentage >= 40) gradePoint = 5;
  else if (percentage >= 30) gradePoint = 4;
  else gradePoint = 0;
  
  return gradePoint * component.credit;
}; 