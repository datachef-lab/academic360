import { ApiResponse } from "@/types/api-response";
import { Settings } from "@/features/settings/types/settings.type";
import axiosInstance from "@/utils/api";

export async function findAllSettings() {
  const res = await axiosInstance.get<ApiResponse<Settings[]>>("/api/v1/settings");
  return res.data;
}

export async function updateSetting(settingId: number, value: string | File) {
  const formData = new FormData();
  formData.append(typeof value === "string" ? "value" : "file", value);

  // Omit Content-Type so the client sets multipart boundary correctly
  const res = await axiosInstance.put<ApiResponse<Settings>>(
    `/api/v1/settings/${settingId}`,
    formData,
  );

  return res.data;
}
