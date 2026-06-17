import axiosInstance from "@/utils/api";
import { ApiResponse } from "@/types/api-response";

export type FloorPlanLayoutRack = {
  id: string;
  rackId: number | null;
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
};

export type FloorPlanLayout = {
  width: number;
  height: number;
  racks: FloorPlanLayoutRack[];
};

export type FloorPlanSummary = {
  id: number;
  branchId: number;
  name: string;
  updatedAt: string;
};

export type FloorPlanWithInventory = {
  id: number;
  branchId: number;
  name: string;
  layout: {
    width: number;
    height: number;
    racks: Array<FloorPlanLayoutRack & { copyCount: number; recentGateEvents: number }>;
  };
};

const BASE = "/api/library/floor-plans";

export async function listFloorPlans(branchId?: number | null) {
  const res = await axiosInstance.get<ApiResponse<FloorPlanSummary[]>>(BASE, {
    params: branchId != null ? { branchId } : {},
  });
  return res.data;
}

export async function getFloorPlanWithInventory(id: number) {
  const res = await axiosInstance.get<ApiResponse<FloorPlanWithInventory>>(`${BASE}/${id}`);
  return res.data;
}

export async function createFloorPlan(input: {
  branchId: number;
  name: string;
  layout: FloorPlanLayout;
}) {
  const res = await axiosInstance.post<ApiResponse<{ id: number }>>(BASE, input);
  return res.data;
}

export async function updateFloorPlan(
  id: number,
  input: { branchId: number; name: string; layout: FloorPlanLayout },
) {
  const res = await axiosInstance.put<ApiResponse<{ id: number }>>(`${BASE}/${id}`, input);
  return res.data;
}

export async function deleteFloorPlan(id: number) {
  const res = await axiosInstance.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return res.data;
}
