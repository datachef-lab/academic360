import axiosInstance from "@/utils/api";
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

const API_BASE_URL = "/api/admissions/board-subjects";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const boardSubjectService = {
  async getAll(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    degreeId?: number,
  ): Promise<PaginatedResponse<BoardSubjectDto>> {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        pageSize: pageSize.toString(),
      };

      if (search) {
        params.search = search;
      }

      if (degreeId) {
        params.degreeId = degreeId.toString();
      }

      const response = await axiosInstance.get(API_BASE_URL, { params });
      return response.data.payload || { data: [], total: 0, page: 1, pageSize: 10 };
    } catch (error) {
      console.error("Error fetching board subjects:", error);
      throw error;
    }
  },

  async getById(id: number): Promise<BoardSubjectDto | null> {
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
      console.error("Error fetching board subject:", error);
      throw error;
    }
  },

  async getByBoardId(boardId: number): Promise<BoardSubjectDto[]> {
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}/board/${boardId}`);
      return response.data.payload || [];
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
      const response = await axiosInstance.post(API_BASE_URL, data);
      return response.data.payload!;
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
      const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, data);
      return response.data.payload!;
    } catch (error) {
      console.error("Error updating board subject:", error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      await axiosInstance.delete(`${API_BASE_URL}/${id}`);
    } catch (error) {
      console.error("Error deleting board subject:", error);
      throw error;
    }
  },
};
