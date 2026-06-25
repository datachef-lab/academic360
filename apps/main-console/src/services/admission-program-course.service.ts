import axiosInstance from "@/utils/api";

const COURSES = "/api/admissions/courses";

export type AdmissionProgramCourse = {
  id: number;
  admissionId: number;
  programCourseId: number;
  amount: number;
  shiftId: number | null;
  classId: number | null;
  isActive: boolean;
  isClosed: boolean;
  remarks: string | null;
};

export type SimpleOption = { id: number; name: string };

const payload = <T>(data: unknown, fallback: T): T => {
  if (data && typeof data === "object" && "payload" in data) {
    return ((data as { payload: unknown }).payload ?? fallback) as T;
  }
  return (data ?? fallback) as T;
};

export async function getAdmissionCourses(admissionId: number): Promise<AdmissionProgramCourse[]> {
  const res = await axiosInstance.get(`${COURSES}/admission/${admissionId}`);
  return payload<AdmissionProgramCourse[]>(res.data, []);
}

export async function createAdmissionCourse(data: Partial<AdmissionProgramCourse>) {
  const res = await axiosInstance.post(COURSES, data);
  return payload(res.data, null);
}

export async function updateAdmissionCourse(id: number, data: Partial<AdmissionProgramCourse>) {
  const res = await axiosInstance.put(`${COURSES}/${id}`, data);
  return payload(res.data, null);
}

export async function deleteAdmissionCourse(id: number) {
  await axiosInstance.delete(`${COURSES}/${id}`);
}

// Admission cycles + supporting lists (session-based; bypasses legacy /api/admissions)
export type AdmissionCycle = {
  id: number;
  sessionId: number;
  status?: string;
  isClosed?: boolean;
  sessionName?: string | null;
};

export async function getAdmissionCycles(): Promise<AdmissionCycle[]> {
  const res = await axiosInstance.get("/api/admission-cycles");
  return payload<AdmissionCycle[]>(res.data, []);
}

export async function createAdmissionCycle(data: {
  sessionId: number;
  status: string;
  startDate?: string | null;
  lastDate?: string | null;
}) {
  const res = await axiosInstance.post("/api/admission-cycles", data);
  return payload(res.data, null);
}

export async function getSessions(): Promise<SimpleOption[]> {
  const res = await axiosInstance.get("/api/sessions");
  return payload<SimpleOption[]>(res.data, []);
}

export async function getProgramCourses(): Promise<SimpleOption[]> {
  const res = await axiosInstance.get("/api/course-design/program-courses");
  const list = payload<Array<Record<string, unknown>>>(res.data, []);
  return list.map((p) => ({
    id: Number(p.id),
    name: String(p.name ?? p.shortName ?? `Program Course #${p.id}`),
  }));
}

export async function getShifts(): Promise<SimpleOption[]> {
  const res = await axiosInstance.get("/api/v1/shifts");
  const list = payload<Array<Record<string, unknown>>>(res.data, []);
  return list.map((s) => ({ id: Number(s.id), name: String(s.name ?? `Shift #${s.id}`) }));
}

export async function getClasses(): Promise<SimpleOption[]> {
  const res = await axiosInstance.get("/api/classes");
  const list = payload<Array<Record<string, unknown>>>(res.data, []);
  return list.map((c) => ({ id: Number(c.id), name: String(c.name ?? `Class #${c.id}`) }));
}
