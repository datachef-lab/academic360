import { ApiResponse } from "@/types/api-response";
import { City, State, Country } from "@repo/db/schemas";

export interface BoardSubjectDto {
  id: number;
  legacyBoardSubjectMappingSubId: number | null;
  boardId: number;
  boardSubjectNameId: number;
  fullMarksTheory: number | null;
  passingMarksTheory: number | null;
  fullMarksPractical: number | null;
  passingMarksPractical: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  board: {
    id: number;
    name: string;
    code: string | null;
    isActive: boolean;
    degree: {
      id: number;
      name: string;
      sequence: number | null;
      isActive: boolean;
    } | null;
    address: {
      id: number;
      addressLine: string | null;
      landmark: string | null;
      otherCity: string | null;
      otherState: string | null;
      otherCountry: string | null;
      country: Country | null;
      state: State | null;
      city: City | null;
      district: {
        id: number;
        name: string;
        code: string | null;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        legacyDistrictId: number | null;
        cityId: number | null;
        sequence: number | null;
      } | null;
    } | null;
  };
  boardSubjectName: {
    id: number;
    name: string;
    code: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    legacyBoardSubjectNameId: number | null;
    sequence: number | null;
  };
}

const API_BASE_URL = "http://localhost:8080/api/admissions/board-subjects";

export const boardSubjectService = {
  async getAll(): Promise<BoardSubjectDto[]> {
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

      const result: ApiResponse<BoardSubjectDto[]> = await response.json();
      return result.payload || [];
    } catch (error) {
      console.error("Error fetching board subjects:", error);
      throw error;
    }
  },

  async getById(id: number): Promise<BoardSubjectDto | null> {
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

      const result: ApiResponse<BoardSubjectDto> = await response.json();
      return result.payload || null;
    } catch (error) {
      console.error("Error fetching board subject:", error);
      throw error;
    }
  },

  async getByBoardId(boardId: number): Promise<BoardSubjectDto[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/board/${boardId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<BoardSubjectDto[]> = await response.json();
      return result.payload || [];
    } catch (error) {
      console.error("Error fetching board subjects by board ID:", error);
      throw error;
    }
  },

  async create(data: {
    boardId: number;
    boardSubjectNameId: number;
    fullMarksTheory?: number | null;
    passingMarksTheory?: number | null;
    fullMarksPractical?: number | null;
    passingMarksPractical?: number | null;
    isActive?: boolean;
  }): Promise<BoardSubjectDto> {
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

      const result: ApiResponse<BoardSubjectDto> = await response.json();
      return result.payload!;
    } catch (error) {
      console.error("Error creating board subject:", error);
      throw error;
    }
  },

  async update(
    id: number,
    data: {
      boardId?: number;
      boardSubjectNameId?: number;
      fullMarksTheory?: number | null;
      passingMarksTheory?: number | null;
      fullMarksPractical?: number | null;
      passingMarksPractical?: number | null;
      isActive?: boolean;
    },
  ): Promise<BoardSubjectDto> {
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

      const result: ApiResponse<BoardSubjectDto> = await response.json();
      return result.payload!;
    } catch (error) {
      console.error("Error updating board subject:", error);
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
      console.error("Error deleting board subject:", error);
      throw error;
    }
  },
};
