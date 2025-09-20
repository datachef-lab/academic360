import axiosInstance from "@/utils/api";
import { City, State, Country } from "@repo/db/schemas";

export interface BoardDto {
  id: number;
  legacyBoardId: number | null;
  name: string;
  passingMarks: number | null;
  code: string | null;
  sequence: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
}

const API_BASE_URL = "/api/admissions/boards";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const boardService = {
  async getAllBoards(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    degreeId?: number,
  ): Promise<PaginatedResponse<BoardDto>> {
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
      console.error("Error fetching boards:", error);
      throw error;
    }
  },

  async getBoardById(id: number): Promise<BoardDto | null> {
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
      console.error("Error fetching board:", error);
      throw error;
    }
  },

  async createBoard(data: {
    name: string;
    code?: string | null;
    passingMarks?: number | null;
    sequence?: number | null;
    isActive?: boolean;
    degreeId?: number | null;
    addressId?: number | null;
  }): Promise<BoardDto> {
    try {
      const response = await axiosInstance.post(API_BASE_URL, data);
      return response.data.payload!;
    } catch (error) {
      console.error("Error creating board:", error);
      throw error;
    }
  },

  async updateBoard(
    id: number,
    data: {
      name?: string;
      code?: string | null;
      passingMarks?: number | null;
      sequence?: number | null;
      isActive?: boolean;
      degreeId?: number | null;
      addressId?: number | null;
    },
  ): Promise<BoardDto> {
    try {
      const response = await axiosInstance.put(`${API_BASE_URL}/${id}`, data);
      return response.data.payload!;
    } catch (error) {
      console.error("Error updating board:", error);
      throw error;
    }
  },

  async deleteBoard(id: number): Promise<void> {
    try {
      await axiosInstance.delete(`${API_BASE_URL}/${id}`);
    } catch (error) {
      console.error("Error deleting board:", error);
      throw error;
    }
  },
};
