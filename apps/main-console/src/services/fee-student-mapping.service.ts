import axiosInstance from "@/utils/api";

export async function downloadFeeReceipt(feeStructureId: number, studentId: number): Promise<Blob> {
  const response = await axiosInstance.get(
    `/api/v1/fees/student-mappings/download-receipt?feeStructureId=${feeStructureId}&studentId=${studentId}`,
    {
      responseType: "blob",
    },
  );
  return response.data;
}
