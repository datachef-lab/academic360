
export interface Stats {
  admissionYearCount: number;
  totalApplications: number;
  totalPayments: number;
  totalDrafts: number;
}

export interface AdmissionSummary {
  id: number;
  admissionYear: number;
  isClosed: boolean;
  totalApplications: number;
  totalPayments: number;
  totalDrafts: number;
  startDate?: string;
  lastDate?: string;
  courses?: AdmissionCourse[];
}

export interface AdmissionCourse {
  id?: number;
  admissionId: number;
  courseId: number;
  disabled: boolean;
  isClosed: boolean;
  remarks: string | null;
}