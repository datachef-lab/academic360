type Subject ={
  name: string;
  obtained: number;
  outOf: number;
  status: string;
  credit: number;
  letterGrade: string;
}

export type Report= {
  id: number;
  rollNumber: string;
  registrationNumber: string;
  uid: string;
  name: string;
  semester: number;
  stream: string;
  framework: string;
  year: number;
  sgpa: number;
  cgpa: number;
  letterGrade: string;
  remarks: string;
  percentage: string;
  subjects: Subject[];
  totalFullMarks: number;
  totalObtainedMarks: number;
  totalCredit: number;
  isFailed: boolean;
  status: string;
  historicalStatus: string;
}

export interface Payment {
    roll: number;
    semester: number;
    name: string;
    year: number;
    fullMarks: number;
    marksObtained: number;
    semesterCredit: number;
    sgpa: number;
    cumulativeCredit: number;
    cgpa: number;
    letterGrade: string;
    stream: string;
}