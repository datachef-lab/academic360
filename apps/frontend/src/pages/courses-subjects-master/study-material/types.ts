export interface StudyMaterialRow {
  [key: string]: unknown;
  id: number;
  name: string;
  type: string;
  availability: string;
  variant: string;
  url: string;
  subject: string;
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
  name: string;
  availability: string;
  variant: string;
  url: string;
} 