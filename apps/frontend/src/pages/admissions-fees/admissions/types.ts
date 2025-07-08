
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