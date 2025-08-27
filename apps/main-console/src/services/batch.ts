import axiosInstance from "@/utils/api";
import { Batch, BatchDetails, BatchSummary, BatchStudentRow } from "@/types/academics/batch";

// Get all batches (now uses summaries endpoint)
export async function getAllBatches(academicYearId?: number): Promise<BatchSummary[]> {
  const params = new URLSearchParams();
  if (academicYearId) params.append("academicYearId", academicYearId.toString());
  const res = await axiosInstance.get(`/api/batches/summaries?${params.toString()}`);
  return res.data.payload;
}

// Get batch details by ID
export async function getBatchById(id: number | string): Promise<BatchDetails> {
  const res = await axiosInstance.get(`/api/batches/${id}`);
  return res.data.payload;
}

// Get batch details by ID (new details endpoint)
export async function getBatchDetailsById(id: number | string): Promise<BatchDetails> {
  const res = await axiosInstance.get(`/api/batches/${id}/details`);
  return res.data.payload;
}

// Create a new batch
export async function createBatch(data: Partial<Batch>): Promise<Batch> {
  const res = await axiosInstance.post("/api/batches", data);
  return res.data.payload;
}

// Update a batch
export async function updateBatch(id: number | string, data: Partial<Batch>): Promise<Batch> {
  const res = await axiosInstance.put(`/api/batches/${id}`, data);
  return res.data.payload;
}

// Delete a batch
export async function deleteBatch(id: number | string): Promise<void> {
  await axiosInstance.delete(`/api/batches/${id}`);
}

// Get batch summaries by filters (e.g., academicYearId)
export async function getBatchSummariesByFilters(filters: { academicYearId?: number }): Promise<BatchSummary[]> {
  return getAllBatches(filters.academicYearId);
}

// Upload batch (bulk)
export async function uploadBatch(batchRows: BatchStudentRow[]): Promise<{ success: boolean, exceptions: BatchStudentRow[] }> {
  const res = await axiosInstance.post("/api/batches/upload", batchRows);
  return res.data.payload;
} 