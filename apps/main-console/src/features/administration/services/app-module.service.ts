import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";
import type { AppModuleDto } from "@repo/db/dtos/administration";

const BASE_URL = "/api/administration/app-modules";

export type AppModulePayload = {
  name: string;
  application: string;
  parentAppModuleId?: number | null;
  description: string;
  iconType?: string | null;
  iconValue?: string | null;
  componentKey?: string | null;
  routePath?: string | null;
  moduleUrl?: string | null;
  image?: string | null;
  isDynamic?: boolean;
  isLayout?: boolean;
  isProtected?: boolean;
  isMasterModule?: boolean;
  isReadOnly?: boolean;
  isActive?: boolean;
};

export async function getAllAppModules() {
  const { data } = await axiosInstance.get<ApiResponse<AppModuleDto[]>>(BASE_URL);
  return data;
}

export async function createAppModule(payload: AppModulePayload, imageFile?: File) {
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  if (imageFile) formData.append("image", imageFile);

  const { data } = await axiosInstance.post<ApiResponse<AppModuleDto>>(BASE_URL, formData);
  return data;
}

export async function updateAppModule(
  id: number,
  payload: Partial<AppModulePayload>,
  imageFile?: File,
) {
  const formData = new FormData();
  formData.append("data", JSON.stringify(payload));
  if (imageFile) formData.append("image", imageFile);

  const { data } = await axiosInstance.put<ApiResponse<AppModuleDto>>(
    `${BASE_URL}/${id}`,
    formData,
  );
  return data;
}

export async function deleteAppModule(id: number) {
  const { data } = await axiosInstance.delete<ApiResponse<AppModuleDto | null>>(
    `${BASE_URL}/${id}`,
  );
  return data;
}
