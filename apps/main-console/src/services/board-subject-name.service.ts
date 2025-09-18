import { ApiResponse } from "@/types/api-response";

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

const API_BASE_URL = "http://localhost:8080/api/admissions/board-subject-names";

export const boardSubjectNameService = {
  async getAll(): Promise<BoardSubjectNameDto[]> {
    try {
      const response = await fetch(API_BASE_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<BoardSubjectNameDto[]> = await response.json();
      return result.payload || [];
    } catch (error) {
      console.error("Error fetching board subject names:", error);
      throw error;
    }
  },

  async getById(id: number): Promise<BoardSubjectNameDto | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<BoardSubjectNameDto> = await response.json();
      return result.payload || null;
    } catch (error) {
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
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<BoardSubjectNameDto> = await response.json();
      return result.payload!;
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
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<BoardSubjectNameDto> = await response.json();
      return result.payload!;
    } catch (error) {
      console.error("Error updating board subject name:", error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting board subject name:", error);
      throw error;
    }
  },
};
