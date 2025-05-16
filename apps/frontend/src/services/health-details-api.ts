import { ApiResonse } from "@/types/api-response";
import { BloodGroup } from "@/types/resources/blood-group";
import { Health } from "@/types/user/health";
import axiosInstance from "@/utils/api";

/**
 * Find health details by student ID
 */
export async function findHealthDetailsByStudentId(studentId: number): Promise<ApiResonse<Health | null>> {
    console.log(`[API] Fetching health details for student ID: ${studentId}`);
    try {
        const response = await axiosInstance.get(`/api/health/student/${studentId}`);
        console.log(`[API] Health details response:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`[API] Error fetching health details for student ID ${studentId}:`, error);
        throw error;
    }
}

export async function updateBloodGroup(data: { id: number; type: string }): Promise<ApiResonse<BloodGroup[]>> {
  console.log("blood group is coming....", data);
  const response = await axiosInstance.put(`/api/blood-groups/${data.id}`, data);
  return response.data;
}

/**
 * Find health details by ID
 */
export async function findHealthDetailsById(id: number): Promise<ApiResonse<Health | null>> {
    const response = await axiosInstance.get(`/api/health/${id}`);
    return response.data;
}

/**
 * Create new health details
 */
export async function createHealthDetails(healthData: Partial<Health>): Promise<ApiResonse<Health>> {
    const response = await axiosInstance.post('/api/health', healthData);
    return response.data;
}

/**
 * Update health details
 */
export async function updateHealthDetails(id: number, healthData: Partial<Health>): Promise<ApiResonse<Health>> {
    console.log(`[API] Updating health details for ID: ${id}`, healthData);
    try {
        const response = await axiosInstance.put(`/api/health/${id}`, healthData);
        console.log(`[API] Health details update response:`, response.data);
        return response.data;
    } catch (error) {
        console.error(`[API] Error updating health details for ID ${id}:`, error);
        throw error;
    }
}

/**
 * Delete health details by ID
 */
export async function deleteHealthDetails(id: number): Promise<ApiResonse<null>> {
    const response = await axiosInstance.delete(`/api/health/${id}`);
    return response.data;
}

/**
 * Delete health details by student ID
 */
export async function deleteHealthDetailsByStudentId(studentId: number): Promise<ApiResonse<null>> {
    const response = await axiosInstance.delete(`/api/health/student/${studentId}`);
    return response.data;
}
