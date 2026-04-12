import axiosInstance from "@/utils/api";

const BASE = "/api/course-design/cascading-dropdowns";

export type CascadingAffiliation = {
  id: number;
  name: string;
  code: string | null;
};

export type CascadingAcademicYear = {
  id: number;
  year: string;
  isActive: boolean;
};

export type CascadingRegulationType = {
  id: number;
  name: string;
  code: string | null;
};

type LegacySuccess<T> = { success: boolean; data: T };

export async function fetchAvailableAffiliations(): Promise<CascadingAffiliation[]> {
  const res = await axiosInstance.get<LegacySuccess<CascadingAffiliation[]>>(
    `${BASE}/affiliations`,
  );
  return res.data.data;
}

export async function fetchAcademicYearsByAffiliation(
  affiliationId: number,
): Promise<CascadingAcademicYear[]> {
  const res = await axiosInstance.get<LegacySuccess<CascadingAcademicYear[]>>(
    `${BASE}/academic-years/${affiliationId}`,
  );
  return res.data.data;
}

export async function fetchRegulationTypes(
  affiliationId: number,
  academicYearId: number,
): Promise<CascadingRegulationType[]> {
  const res = await axiosInstance.get<LegacySuccess<CascadingRegulationType[]>>(
    `${BASE}/regulation-types/${affiliationId}/${academicYearId}`,
  );
  return res.data.data;
}
