// Mock data for courses, semesters, and subjects for Course Material Page
export const courses = [
  { id: 'bba_h', name: 'BBA (H)' },
  { id: 'bcom', name: 'B.Com' },
  { id: 'ba', name: 'BA' },
];

export const semesters = [
  { id: '1', name: '1st Year' },
  { id: '2', name: '2nd Year' },
  { id: '3', name: '3rd Year' },
];

export const subjects = [
  // BBA (H) 1st Year
  { id: 1, courseId: 'bba_h', semesterId: '1', subject: 'Business English', type: 'Honours', paper: 'Business English(Paper-I)' },
  { id: 2, courseId: 'bba_h', semesterId: '1', subject: 'Accounts & Audit', type: 'Honours', paper: 'Accounts & Audit (Paper-V)' },
  { id: 3, courseId: 'bba_h', semesterId: '1', subject: 'Business Economics', type: 'Honours', paper: 'Business Economics (Paper-II)' },
  { id: 4, courseId: 'bba_h', semesterId: '1', subject: 'Business Maths/Stats', type: 'Honours', paper: 'Business Maths/Stats (Paper-III)' },
  { id: 5, courseId: 'bba_h', semesterId: '1', subject: 'Computer Application', type: 'Honours', paper: 'Computer Application (Paper-VI)' },
  { id: 6, courseId: 'bba_h', semesterId: '1', subject: 'Law & Tax', type: 'Honours', paper: 'Law & Tax (Paper-IV)' },
  // B.Com 1st Year
  { id: 7, courseId: 'bcom', semesterId: '1', subject: 'Financial Accounting', type: 'Honours', paper: 'Financial Accounting (Paper-I)' },
  { id: 8, courseId: 'bcom', semesterId: '1', subject: 'Business Law', type: 'Honours', paper: 'Business Law (Paper-II)' },
  // BA 1st Year
  { id: 9, courseId: 'ba', semesterId: '1', subject: 'English Literature', type: 'Honours', paper: 'English Literature (Paper-I)' },
  { id: 10, courseId: 'ba', semesterId: '1', subject: 'History', type: 'Honours', paper: 'History (Paper-II)' },
];
