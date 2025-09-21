import axiosInstance from "@/utils/api";

export interface BoardSubjectNameDto {
  id: number;
  name: string;
  code: string | null;
  sequence: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  legacyBoardSubjectNameId: number | null;
}

const API_BASE_URL = "/api/admissions/board-subject-names";

export const boardSubjectNameService = {
  async getAll(): Promise<BoardSubjectNameDto[]> {
    try {
      const response = await axiosInstance.get(API_BASE_URL);
      return response.data.payload || [];
    } catch (error) {
      console.error("Error fetching board subject names:", error);
      throw error;
    }
  },

  async getById(id: number): Promise<BoardSubjectNameDto | null> {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/${id}`);
      return response.data.payload || null;
    } catch (error: unknown) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      console.error("Error fetching board subject name:", error);
      throw error;
    }
  },

  async create(data: {
    name: string;
    code?: string | null;
    sequence?: number | null;
    isActive?: boolean;
  }): Promise<BoardSubjectNameDto> {
    try {
      const response = await axiosInstance.post(API_BASE_URL, data);
      return response.data.payload!;
    } catch (error) {
      console.error("Error creating board subject name:", error);
      throw error;
    }
  },

  async update(
    id: number,
    data: {
      name?: string;
      code?: string | null;
      sequence?: number | null;
      isActive?: boolean;
    },
  ): Promise<BoardSubjectNameDto> {
    try {
      const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, data);
      return response.data.payload!;
    } catch (error) {
      console.error("Error updating board subject name:", error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await axiosInstance.delete(`${API_BASE_URL}/${id}`);
    } catch (error) {
      console.error("Error deleting board subject name:", error);
      throw error;
    }
  },
};
