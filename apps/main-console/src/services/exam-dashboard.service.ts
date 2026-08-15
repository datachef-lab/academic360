import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type ExamDashboardFilters = {
  academicYearIds?: number[];
  examTypeIds?: number[];
  classIds?: number[];
  shiftIds?: number[];
  programCourseIds?: number[];
  subjectTypeIds?: number[];
  dateFrom?: string | null;
  dateTo?: string | null;
};

export type ExamDashboardStats = {
  examGroups: number;
  exams: number;
  papersScheduled: number;
  candidateRows: number;
  students: number;
  studentsSeated: number;
  studentsDownloaded: number;
  /** 0–100, of students in scope that downloaded their admit card. */
  downloadRate: number;
  physicalDistributions: number;
  upcomingPapers30d: number;
  pendingAllotmentCount: number;
  cycleStatus: { today: number; upcoming: number; completed: number };
  roomsTotal: number;
  floorsTotal: number;
  roomsInUse: number;
  floorsInUse: number;
  totalRoomCapacity: number;

  formFillupTotal: number;
  formFillupCompleted: number;
  promotionsFormSubmitted: number;
  linkedStudents: number;
  uploadedNotSubmitted: number;
  submittedNotUploaded: number;

  papersByMonth: Array<{ month: string; papers: number; exams: number }>;
  papersByMonthDetail: Array<{
    month: string;
    programCourse: string;
    className: string | null;
    papers: number;
  }>;
  downloadsByDay: Array<{ day: string; count: number }>;
  distributionsByDay: Array<{ day: string; count: number }>;
  formFillupByDay: Array<{ day: string; count: number }>;
  studentSubmissionsByDay: Array<{ day: string; count: number }>;

  studentsByShift: Array<{ name: string; count: number }>;
  studentsBySubjectType: Array<{ name: string; count: number }>;
  examCyclesByType: Array<{ name: string; shortName: string | null; count: number }>;
  formsByAppearType: Array<{ name: string; count: number }>;
  formReconciliationByProgramCourse: Array<{
    name: string;
    staffRecorded: number;
    studentSubmitted: number;
    linked: number;
  }>;

  upcomingPapers: Array<{
    examSubjectId: number;
    subjectName: string;
    paperCode: string | null;
    examGroupName: string | null;
    className: string | null;
    startTime: string;
    endTime: string;
    candidateCount: number;
  }>;
  /** Exams still missing rooms and/or candidates — the allotment queue. */
  pendingAllotment: Array<{
    examId: number;
    examGroupName: string | null;
    examTypeName: string | null;
    className: string | null;
    firstPaperAt: string | null;
    candidates: number;
    rooms: number;
  }>;
  /** One row per exam group: feeds the admit-card and seating tables. */
  groupStats: Array<{
    examGroupId: number;
    name: string;
    commencementDate: string;
    students: number;
    studentsSeated: number;
    studentsDownloaded: number;
    rooms: number;
    admitCardStart: string | null;
    admitCardLast: string | null;
  }>;
  roomsByFloor: Array<{ floor: string; rooms: number; capacity: number; inUse: number }>;
  topRooms: Array<{
    name: string;
    floor: string | null;
    capacity: number;
    timesUsed: number;
  }>;
  scheduledBy: Array<{ name: string; count: number }>;
  topDistributors: Array<{ name: string; count: number }>;
};

const BASE = "/api/exams/dashboard";

export async function getExamDashboardStats(filters: ExamDashboardFilters = {}) {
  const params: Record<string, string> = {};
  const csv = (key: string, v?: number[]) => {
    if (v && v.length) params[key] = v.join(",");
  };
  csv("academicYearIds", filters.academicYearIds);
  csv("examTypeIds", filters.examTypeIds);
  csv("classIds", filters.classIds);
  csv("shiftIds", filters.shiftIds);
  csv("programCourseIds", filters.programCourseIds);
  csv("subjectTypeIds", filters.subjectTypeIds);
  if (filters.dateFrom) params.dateFrom = filters.dateFrom;
  if (filters.dateTo) params.dateTo = filters.dateTo;
  const res = await axiosInstance.get<ApiResponse<ExamDashboardStats>>(`${BASE}/stats`, {
    params,
  });
  return res.data;
}
