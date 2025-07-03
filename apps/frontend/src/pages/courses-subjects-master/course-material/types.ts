export interface CourseMaterialRow {
  id: number;
  subject: string;
  type: string;
  paper: string;
  materials?: string;
}

export interface Subject {
  id: number;
  courseId: string;
  semesterId: string;
  subject: string;
  type: string;
  paper: string;
  materials?: string;
} 