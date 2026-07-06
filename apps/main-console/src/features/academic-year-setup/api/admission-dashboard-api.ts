import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type Bucket = { key: string; label: string; count: number };

export interface AdmissionDashboard {
  academicYearId: number | null;
  filters: { level: string | null; formStatus: string | null };
  kpis: {
    totalApplications: number;
    drafts: number;
    submitted: number;
    approved: number;
    rejected: number;
    cancelled: number;
    admitted: number;
    blocked: number;
    courseApplications: number;
    paymentReceived: number;
    paymentPending: number;
    amountCollected: number;
    feesPaid: number;
    verified: number;
    meritListed: number;
    courseCancelled: number;
  };
  breakdowns: {
    byStatus: Bucket[];
    byLevel: Bucket[];
    byStep: Bucket[];
    byProgramCourse: Bucket[];
    byGender: Bucket[];
    byCategory: Bucket[];
    byReligion: Bucket[];
    byNationality: Bucket[];
    byBloodGroup: Bucket[];
    byCountry: Bucket[];
    byState: Bucket[];
    byAnnualIncome: Bucket[];
    byBoard: Bucket[];
    specialGroups: Bucket[];
  };
  trend: { date: string; count: number }[];
}

export async function getAdmissionDashboard(params: {
  academicYearId?: number;
  level?: string;
  formStatus?: string;
}) {
  const res = await axiosInstance.get<ApiResponse<AdmissionDashboard>>(
    "/api/admissions/dashboard",
    { params },
  );
  return res.data.payload;
}
