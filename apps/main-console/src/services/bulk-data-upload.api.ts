import axios from "axios";
import axiosInstance from "@/utils/api";
import type { ApiResponse } from "@/types/api-response";

const BASE = "/api/v1/bulk-data-uploads";

export type BulkDataUploadMode = "exam-form-fillup" | "cu-reg-roll";

export async function downloadBulkDataUploadTemplate(mode: BulkDataUploadMode): Promise<Blob> {
  const res = await axiosInstance.get(`${BASE}/template`, {
    params: { mode },
    responseType: "blob",
  });
  return res.data as Blob;
}

export type BulkDataExportParams = {
  mode: BulkDataUploadMode;
  affiliationId: number;
  regulationTypeId: number;
  academicYearId: number;
  classId?: number;
};

/** GET /export — Excel of existing promotions + student fields for the selected context */
export async function downloadBulkDataExport(params: BulkDataExportParams): Promise<Blob> {
  try {
    const res = await axiosInstance.get(`${BASE}/export`, {
      params: {
        mode: params.mode,
        affiliationId: params.affiliationId,
        regulationTypeId: params.regulationTypeId,
        academicYearId: params.academicYearId,
        ...(params.classId != null ? { classId: params.classId } : {}),
      },
      responseType: "blob",
      _skipGlobalErrorHandler: true,
    } as Parameters<typeof axiosInstance.get>[1] & { _skipGlobalErrorHandler?: boolean });
    return res.data as Blob;
  } catch (e: unknown) {
    if (axios.isAxiosError(e) && e.response?.data instanceof Blob) {
      const text = await (e.response.data as Blob).text();
      try {
        const j = JSON.parse(text) as ApiResponse<null>;
        throw new Error(j.message || "Export failed");
      } catch (parseErr) {
        if (parseErr instanceof SyntaxError) {
          throw new Error("Export failed");
        }
        throw parseErr;
      }
    }
    throw e;
  }
}

export async function postBulkDataUpload(
  mode: BulkDataUploadMode,
  formData: FormData,
  dryRun: boolean,
): Promise<unknown> {
  const res = await axiosInstance.post<ApiResponse<unknown>>(`${BASE}/`, formData, {
    params: { mode, ...(dryRun ? { dryRun: "true" } : {}) },
    _skipGlobalErrorHandler: true,
  } as Parameters<typeof axiosInstance.post>[2] & { _skipGlobalErrorHandler?: boolean });
  return res.data.payload;
}
