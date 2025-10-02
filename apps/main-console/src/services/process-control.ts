import { ProcessControl, NewProcessControl } from "@repo/db/schemas/models/process-control";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

export interface ProcessControlFilters {
  academicYearId?: number;
  programCourseId?: number;
  semester?: number;
  processType?: "SUBJECT_SELECTION" | "CU_REGISTRATION";
  status?: "INACTIVE" | "ACTIVE" | "PAUSED" | "COMPLETED";
}

export interface ProcessControlUpdate {
  status?: "INACTIVE" | "ACTIVE" | "PAUSED" | "COMPLETED";
  startDate?: string;
  endDate?: string;
  allowLateSubmission?: boolean;
  requireApproval?: boolean;
  sendNotifications?: boolean;
  title?: string;
  description?: string;
  instructions?: string;
}

export class ProcessControlService {
  private static getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  static async getProcessControls(filters?: ProcessControlFilters): Promise<ProcessControl[]> {
    const params = new URLSearchParams();
    if (filters?.academicYearId) params.append("academicYearId", filters.academicYearId.toString());
    if (filters?.programCourseId) params.append("programCourseId", filters.programCourseId.toString());
    if (filters?.semester) params.append("semester", filters.semester.toString());
    if (filters?.processType) params.append("processType", filters.processType);
    if (filters?.status) params.append("status", filters.status);

    const response = await fetch(`${API_BASE}/api/process-controls?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch process controls: ${response.statusText}`);
    }

    const data = await response.json();
    return data.payload || [];
  }

  static async getProcessControl(id: number): Promise<ProcessControl> {
    const response = await fetch(`${API_BASE}/api/process-controls/${id}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch process control: ${response.statusText}`);
    }

    const data = await response.json();
    return data.payload;
  }

  static async createProcessControl(processControl: NewProcessControl): Promise<ProcessControl> {
    const response = await fetch(`${API_BASE}/api/process-controls`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(processControl),
    });

    if (!response.ok) {
      throw new Error(`Failed to create process control: ${response.statusText}`);
    }

    const data = await response.json();
    return data.payload;
  }

  static async updateProcessControl(id: number, updates: ProcessControlUpdate): Promise<ProcessControl> {
    const response = await fetch(`${API_BASE}/api/process-controls/${id}`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update process control: ${response.statusText}`);
    }

    const data = await response.json();
    return data.payload;
  }

  static async deleteProcessControl(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/api/process-controls/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete process control: ${response.statusText}`);
    }
  }

  static async toggleProcessStatus(id: number, newStatus: "ACTIVE" | "PAUSED" | "INACTIVE"): Promise<ProcessControl> {
    return this.updateProcessControl(id, { status: newStatus });
  }

  static async bulkUpdateProcesses(
    updates: Array<{ id: number; updates: ProcessControlUpdate }>,
  ): Promise<ProcessControl[]> {
    const response = await fetch(`${API_BASE}/api/process-controls/bulk`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ updates }),
    });

    if (!response.ok) {
      throw new Error(`Failed to bulk update process controls: ${response.statusText}`);
    }

    const data = await response.json();
    return data.payload || [];
  }
}
