
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
}

export interface AdmissionCourse {
    id?: number;
    admissionId: number;
    courseId: number;
    disabled: boolean;
    isClosed: boolean;
    createdAt: string | null;
    updatedAt: string | null;
    remarks: string | null;
}

export interface Admission {
    id: number;
    year: number;
    startDate: string | null;
    lastDate: string | null;
    isClosed: boolean;
    courses: AdmissionCourse[];
}

export interface Course {
  id: number;
  name: string;
  disabled: boolean;
  shortName?: string;
}
