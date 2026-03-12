export interface AdmitCardCandidate {
  id: number;
  examId: number;
  studentId: number;
  name: string;
  examName: string | null;
  uid: string;
  rollNumber: string | null;
  registrationNumber: string | null;
  rfid: string | null;
  programCourse: string | null;
  semester: string | null;
  shift: string | null;
  section: string | null;
}

export interface AdmitCardPaper {
  paperCode: string;
  paperName: string;
}
