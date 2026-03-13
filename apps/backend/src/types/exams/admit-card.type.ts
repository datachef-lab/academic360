import { StudentType } from "../user/student.js";

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

export interface AdmitCardSearchResponse {
  candidate: AdmitCardCandidate;
  papers: AdmitCardPaper[];
  alreadyDistributed: boolean;
  isUserInactive: boolean;
  collectionDate: string | null;
  distributedByName: string | null;
  distributedByUserImage: string | null;
  venueOfExamination: string | null;
  roomName: string | null;
  seatNumber: string | null;
}

export interface DistributeAdmitCardRequest {
  studentId: number;
}
