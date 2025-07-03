// Mock data for courses, semesters, and subjects for Course Material Page
export const courses = [
  { id: 'ba', name: 'BA' },
  { id: 'bsc', name: 'B.Sc' },
  { id: 'bcom', name: 'B.Com' },
  { id: 'btech_cse', name: 'B.Tech (CSE)' },
];

export const semesters = [
  { id: '1', name: '1st Semester' },
  { id: '2', name: '2nd Semester' },
  { id: '3', name: '3rd Semester' },
  { id: '4', name: '4th Semester' },
];

export const subjects = [
  // BA Subjects - 1st Semester
  { id: 1, courseId: 'ba', semesterId: '1', subject: 'English Literature', type: 'Honours', paper: 'English Literature (Paper-I)', materials: undefined },
  { id: 2, courseId: 'ba', semesterId: '1', subject: 'History', type: 'Honours', paper: 'History (Paper-I)', materials: undefined },
  { id: 3, courseId: 'ba', semesterId: '1', subject: 'Political Science', type: 'Honours', paper: 'Political Science (Paper-I)', materials: undefined },
  { id: 4, courseId: 'ba', semesterId: '1', subject: 'Sociology', type: 'Honours', paper: 'Sociology (Paper-I)', materials: undefined },
  { id: 5, courseId: 'ba', semesterId: '1', subject: 'Philosophy', type: 'Honours', paper: 'Philosophy (Paper-I)', materials: undefined },
  // BA Subjects - 2nd Semester
  { id: 6, courseId: 'ba', semesterId: '2', subject: 'English Literature II', type: 'Honours', paper: 'English Literature (Paper-II)', materials: undefined },
  { id: 7, courseId: 'ba', semesterId: '2', subject: 'History II', type: 'Honours', paper: 'History (Paper-II)', materials: undefined },
  { id: 8, courseId: 'ba', semesterId: '2', subject: 'Political Science II', type: 'Honours', paper: 'Political Science (Paper-II)', materials: undefined },
  { id: 9, courseId: 'ba', semesterId: '2', subject: 'Sociology II', type: 'Honours', paper: 'Sociology (Paper-II)', materials: undefined },
  { id: 10, courseId: 'ba', semesterId: '2', subject: 'Philosophy II', type: 'Honours', paper: 'Philosophy (Paper-II)', materials: undefined },
  // B.Sc Subjects - 1st Semester
  { id: 11, courseId: 'bsc', semesterId: '1', subject: 'Physics', type: 'Honours', paper: 'Physics (Paper-I)', materials: undefined },
  { id: 12, courseId: 'bsc', semesterId: '1', subject: 'Chemistry', type: 'Honours', paper: 'Chemistry (Paper-I)', materials: undefined },
  { id: 13, courseId: 'bsc', semesterId: '1', subject: 'Mathematics', type: 'Honours', paper: 'Mathematics (Paper-I)', materials: undefined },
  { id: 14, courseId: 'bsc', semesterId: '1', subject: 'Biology', type: 'Honours', paper: 'Biology (Paper-I)', materials: undefined },
  { id: 15, courseId: 'bsc', semesterId: '1', subject: 'Environmental Science', type: 'Honours', paper: 'Environmental Science (Paper-I)', materials: undefined },
  // B.Sc Subjects - 2nd Semester
  { id: 16, courseId: 'bsc', semesterId: '2', subject: 'Physics II', type: 'Honours', paper: 'Physics (Paper-II)', materials: undefined },
  { id: 17, courseId: 'bsc', semesterId: '2', subject: 'Chemistry II', type: 'Honours', paper: 'Chemistry (Paper-II)', materials: undefined },
  { id: 18, courseId: 'bsc', semesterId: '2', subject: 'Mathematics II', type: 'Honours', paper: 'Mathematics (Paper-II)', materials: undefined },
  { id: 19, courseId: 'bsc', semesterId: '2', subject: 'Biology II', type: 'Honours', paper: 'Biology (Paper-II)', materials: undefined },
  { id: 20, courseId: 'bsc', semesterId: '2', subject: 'Computer Science', type: 'Honours', paper: 'Computer Science (Paper-I)', materials: undefined },
  // B.Com Subjects - 1st Semester
  { id: 21, courseId: 'bcom', semesterId: '1', subject: 'Financial Accounting', type: 'Honours', paper: 'Financial Accounting (Paper-I)', materials: undefined },
  { id: 22, courseId: 'bcom', semesterId: '1', subject: 'Business Law', type: 'Honours', paper: 'Business Law (Paper-I)', materials: undefined },
  { id: 23, courseId: 'bcom', semesterId: '1', subject: 'Economics', type: 'Honours', paper: 'Economics (Paper-I)', materials: undefined },
  { id: 24, courseId: 'bcom', semesterId: '1', subject: 'Business Mathematics', type: 'Honours', paper: 'Business Mathematics (Paper-I)', materials: undefined },
  { id: 25, courseId: 'bcom', semesterId: '1', subject: 'Principles of Management', type: 'Honours', paper: 'Principles of Management (Paper-I)', materials: undefined },
  // B.Com Subjects - 2nd Semester
  { id: 26, courseId: 'bcom', semesterId: '2', subject: 'Corporate Accounting', type: 'Honours', paper: 'Corporate Accounting (Paper-II)', materials: undefined },
  { id: 27, courseId: 'bcom', semesterId: '2', subject: 'Cost Accounting', type: 'Honours', paper: 'Cost Accounting (Paper-II)', materials: undefined },
  { id: 28, courseId: 'bcom', semesterId: '2', subject: 'Business Communication', type: 'Honours', paper: 'Business Communication (Paper-II)', materials: undefined },
  { id: 29, courseId: 'bcom', semesterId: '2', subject: 'Statistics', type: 'Honours', paper: 'Statistics (Paper-II)', materials: undefined },
  { id: 30, courseId: 'bcom', semesterId: '2', subject: 'Marketing Management', type: 'Honours', paper: 'Marketing Management (Paper-II)', materials: undefined },
  // B.Tech (CSE) Subjects - 1st Semester
  { id: 31, courseId: 'btech_cse', semesterId: '1', subject: 'Programming in C', type: 'Core', paper: 'Programming in C (Paper-I)', materials: undefined },
  { id: 32, courseId: 'btech_cse', semesterId: '1', subject: 'Mathematics-I', type: 'Core', paper: 'Mathematics-I (Paper-I)', materials: undefined },
  { id: 33, courseId: 'btech_cse', semesterId: '1', subject: 'Physics for Engineers', type: 'Core', paper: 'Physics for Engineers (Paper-I)', materials: undefined },
  { id: 34, courseId: 'btech_cse', semesterId: '1', subject: 'Basic Electrical Engineering', type: 'Core', paper: 'Basic Electrical Engineering (Paper-I)', materials: undefined },
  { id: 35, courseId: 'btech_cse', semesterId: '1', subject: 'Engineering Graphics', type: 'Core', paper: 'Engineering Graphics (Paper-I)', materials: undefined },
  // B.Tech (CSE) Subjects - 2nd Semester
  { id: 36, courseId: 'btech_cse', semesterId: '2', subject: 'Data Structures', type: 'Core', paper: 'Data Structures (Paper-II)', materials: undefined },
  { id: 37, courseId: 'btech_cse', semesterId: '2', subject: 'Mathematics-II', type: 'Core', paper: 'Mathematics-II (Paper-II)', materials: undefined },
  { id: 38, courseId: 'btech_cse', semesterId: '2', subject: 'Digital Logic Design', type: 'Core', paper: 'Digital Logic Design (Paper-II)', materials: undefined },
  { id: 39, courseId: 'btech_cse', semesterId: '2', subject: 'Object Oriented Programming', type: 'Core', paper: 'Object Oriented Programming (Paper-II)', materials: undefined },
  { id: 40, courseId: 'btech_cse', semesterId: '2', subject: 'Environmental Science', type: 'Core', paper: 'Environmental Science (Paper-II)', materials: undefined },
];
