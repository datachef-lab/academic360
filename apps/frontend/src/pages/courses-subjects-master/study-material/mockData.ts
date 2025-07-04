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
  { id: 1, courseId: 'ba', semesterId: '1', subject: 'English Literature', type: 'Honours', paper: 'English Literature (Paper-I)', materials: undefined, name: 'English Literature Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/english-lit' },
  { id: 2, courseId: 'ba', semesterId: '1', subject: 'History', type: 'Honours', paper: 'History (Paper-I)', materials: undefined, name: 'History Material', availability: 'Available', variant: 'DOCX', url: 'https://example.com/history' },
  { id: 3, courseId: 'ba', semesterId: '1', subject: 'Political Science', type: 'Honours', paper: 'Political Science (Paper-I)', materials: undefined, name: 'Political Science Material', availability: 'Unavailable', variant: 'PDF', url: '' },
  { id: 4, courseId: 'ba', semesterId: '1', subject: 'Sociology', type: 'Honours', paper: 'Sociology (Paper-I)', materials: undefined, name: 'Sociology Material', availability: 'Available', variant: 'PPT', url: 'https://example.com/sociology' },
  { id: 5, courseId: 'ba', semesterId: '1', subject: 'Philosophy', type: 'Honours', paper: 'Philosophy (Paper-I)', materials: undefined, name: 'Philosophy Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/philosophy' },
  // BA Subjects - 2nd Semester
  { id: 6, courseId: 'ba', semesterId: '2', subject: 'English Literature II', type: 'Honours', paper: 'English Literature (Paper-II)', materials: undefined, name: 'English Literature II Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/english-lit-ii' },
  { id: 7, courseId: 'ba', semesterId: '2', subject: 'History II', type: 'Honours', paper: 'History (Paper-II)', materials: undefined, name: 'History II Material', availability: 'Available', variant: 'DOCX', url: 'https://example.com/history-ii' },
  { id: 8, courseId: 'ba', semesterId: '2', subject: 'Political Science II', type: 'Honours', paper: 'Political Science (Paper-II)', materials: undefined, name: 'Political Science II Material', availability: 'Unavailable', variant: 'PDF', url: '' },
  { id: 9, courseId: 'ba', semesterId: '2', subject: 'Sociology II', type: 'Honours', paper: 'Sociology (Paper-II)', materials: undefined, name: 'Sociology II Material', availability: 'Available', variant: 'PPT', url: 'https://example.com/sociology-ii' },
  { id: 10, courseId: 'ba', semesterId: '2', subject: 'Philosophy II', type: 'Honours', paper: 'Philosophy (Paper-II)', materials: undefined, name: 'Philosophy II Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/philosophy-ii' },
  // B.Sc Subjects - 1st Semester
  { id: 11, courseId: 'bsc', semesterId: '1', subject: 'Physics', type: 'Honours', paper: 'Physics (Paper-I)', materials: undefined, name: 'Physics Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/physics' },
  { id: 12, courseId: 'bsc', semesterId: '1', subject: 'Chemistry', type: 'Honours', paper: 'Chemistry (Paper-I)', materials: undefined, name: 'Chemistry Material', availability: 'Available', variant: 'DOCX', url: 'https://example.com/chemistry' },
  { id: 13, courseId: 'bsc', semesterId: '1', subject: 'Mathematics', type: 'Honours', paper: 'Mathematics (Paper-I)', materials: undefined, name: 'Mathematics Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/mathematics' },
  { id: 14, courseId: 'bsc', semesterId: '1', subject: 'Biology', type: 'Honours', paper: 'Biology (Paper-I)', materials: undefined, name: 'Biology Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/biology' },
  { id: 15, courseId: 'bsc', semesterId: '1', subject: 'Environmental Science', type: 'Honours', paper: 'Environmental Science (Paper-I)', materials: undefined, name: 'Environmental Science Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/environmental-science' },
  // B.Sc Subjects - 2nd Semester
  { id: 16, courseId: 'bsc', semesterId: '2', subject: 'Physics II', type: 'Honours', paper: 'Physics (Paper-II)', materials: undefined, name: 'Physics II Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/physics-ii' },
  { id: 17, courseId: 'bsc', semesterId: '2', subject: 'Chemistry II', type: 'Honours', paper: 'Chemistry (Paper-II)', materials: undefined, name: 'Chemistry II Material', availability: 'Available', variant: 'DOCX', url: 'https://example.com/chemistry-ii' },
  { id: 18, courseId: 'bsc', semesterId: '2', subject: 'Mathematics II', type: 'Honours', paper: 'Mathematics (Paper-II)', materials: undefined, name: 'Mathematics II Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/mathematics-ii' },
  { id: 19, courseId: 'bsc', semesterId: '2', subject: 'Biology II', type: 'Honours', paper: 'Biology (Paper-II)', materials: undefined, name: 'Biology II Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/biology-ii' },
  { id: 20, courseId: 'bsc', semesterId: '2', subject: 'Computer Science', type: 'Honours', paper: 'Computer Science (Paper-I)', materials: undefined, name: 'Computer Science Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/computer-science' },
  // B.Com Subjects - 1st Semester
  { id: 21, courseId: 'bcom', semesterId: '1', subject: 'Financial Accounting', type: 'Honours', paper: 'Financial Accounting (Paper-I)', materials: undefined, name: 'Financial Accounting Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/financial-accounting' },
  { id: 22, courseId: 'bcom', semesterId: '1', subject: 'Business Law', type: 'Honours', paper: 'Business Law (Paper-I)', materials: undefined, name: 'Business Law Material', availability: 'Available', variant: 'DOCX', url: 'https://example.com/business-law' },
  { id: 23, courseId: 'bcom', semesterId: '1', subject: 'Economics', type: 'Honours', paper: 'Economics (Paper-I)', materials: undefined, name: 'Economics Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/economics' },
  { id: 24, courseId: 'bcom', semesterId: '1', subject: 'Business Mathematics', type: 'Honours', paper: 'Business Mathematics (Paper-I)', materials: undefined, name: 'Business Mathematics Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/business-mathematics' },
  { id: 25, courseId: 'bcom', semesterId: '1', subject: 'Principles of Management', type: 'Honours', paper: 'Principles of Management (Paper-I)', materials: undefined, name: 'Principles of Management Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/principles-of-management' },
  // B.Com Subjects - 2nd Semester
  { id: 26, courseId: 'bcom', semesterId: '2', subject: 'Corporate Accounting', type: 'Honours', paper: 'Corporate Accounting (Paper-II)', materials: undefined, name: 'Corporate Accounting Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/corporate-accounting' },
  { id: 27, courseId: 'bcom', semesterId: '2', subject: 'Cost Accounting', type: 'Honours', paper: 'Cost Accounting (Paper-II)', materials: undefined, name: 'Cost Accounting Material', availability: 'Available', variant: 'DOCX', url: 'https://example.com/cost-accounting' },
  { id: 28, courseId: 'bcom', semesterId: '2', subject: 'Business Communication', type: 'Honours', paper: 'Business Communication (Paper-II)', materials: undefined, name: 'Business Communication Material', availability: 'Available', variant: 'PPT', url: 'https://example.com/business-communication' },
  { id: 29, courseId: 'bcom', semesterId: '2', subject: 'Statistics', type: 'Honours', paper: 'Statistics (Paper-II)', materials: undefined, name: 'Statistics Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/statistics' },
  { id: 30, courseId: 'bcom', semesterId: '2', subject: 'Marketing Management', type: 'Honours', paper: 'Marketing Management (Paper-II)', materials: undefined, name: 'Marketing Management Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/marketing-management' },
  // B.Tech (CSE) Subjects - 1st Semester
  { id: 31, courseId: 'btech_cse', semesterId: '1', subject: 'Programming in C', type: 'Core', paper: 'Programming in C (Paper-I)', materials: undefined, name: 'Programming in C Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/programming-in-c' },
  { id: 32, courseId: 'btech_cse', semesterId: '1', subject: 'Mathematics-I', type: 'Core', paper: 'Mathematics-I (Paper-I)', materials: undefined, name: 'Mathematics-I Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/mathematics-i' },
  { id: 33, courseId: 'btech_cse', semesterId: '1', subject: 'Physics for Engineers', type: 'Core', paper: 'Physics for Engineers (Paper-I)', materials: undefined, name: 'Physics for Engineers Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/physics-for-engineers' },
  { id: 34, courseId: 'btech_cse', semesterId: '1', subject: 'Basic Electrical Engineering', type: 'Core', paper: 'Basic Electrical Engineering (Paper-I)', materials: undefined, name: 'Basic Electrical Engineering Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/basic-electrical-engineering' },
  { id: 35, courseId: 'btech_cse', semesterId: '1', subject: 'Engineering Graphics', type: 'Core', paper: 'Engineering Graphics (Paper-I)', materials: undefined, name: 'Engineering Graphics Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/engineering-graphics' },
  // B.Tech (CSE) Subjects - 2nd Semester
  { id: 36, courseId: 'btech_cse', semesterId: '2', subject: 'Data Structures', type: 'Core', paper: 'Data Structures (Paper-II)', materials: undefined, name: 'Data Structures Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/data-structures' },
  { id: 37, courseId: 'btech_cse', semesterId: '2', subject: 'Mathematics-II', type: 'Core', paper: 'Mathematics-II (Paper-II)', materials: undefined, name: 'Mathematics-II Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/mathematics-ii' },
  { id: 38, courseId: 'btech_cse', semesterId: '2', subject: 'Digital Logic Design', type: 'Core', paper: 'Digital Logic Design (Paper-II)', materials: undefined, name: 'Digital Logic Design Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/digital-logic-design' },
  { id: 39, courseId: 'btech_cse', semesterId: '2', subject: 'Object Oriented Programming', type: 'Core', paper: 'Object Oriented Programming (Paper-II)', materials: undefined, name: 'Object Oriented Programming Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/object-oriented-programming' },
  { id: 40, courseId: 'btech_cse', semesterId: '2', subject: 'Environmental Science', type: 'Core', paper: 'Environmental Science (Paper-II)', materials: undefined, name: 'Environmental Science Material', availability: 'Available', variant: 'PDF', url: 'https://example.com/environmental-science' },
];
