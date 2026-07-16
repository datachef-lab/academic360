import { axiosInstance } from "@/lib/utils";
import type { ApiResponse } from "@/types/api-response";
import type { BrandingData } from "@/features/settings/types/branding.type";

export async function fetchBranding(): Promise<BrandingData> {
  const res = await axiosInstance.get<ApiResponse<BrandingData>>("/api/v1/settings/branding");
  return res.data.payload;
}
