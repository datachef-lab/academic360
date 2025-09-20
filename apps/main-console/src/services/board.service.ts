import { ApiResponse } from "@/types/api-response";
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

const API_BASE_URL = "http://localhost:8080/api/admissions/boards";

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
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (search) {
        params.append("search", search);
      }

      if (degreeId) {
        params.append("degreeId", degreeId.toString());
      }

      const response = await fetch(`${API_BASE_URL}?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse<PaginatedResponse<BoardDto>> = await response.json();
      return result.payload || { data: [], total: 0, page: 1, pageSize: 10 };
    } catch (error) {
      console.error("Error fetching boards:", error);
      throw error;
    }
  },

  async getBoardById(id: number): Promise<BoardDto | null> {
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

      const result: ApiResponse<BoardDto> = await response.json();
      return result.payload || null;
    } catch (error) {
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

      const result: ApiResponse<BoardDto> = await response.json();
      return result.payload!;
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

      const result: ApiResponse<BoardDto> = await response.json();
      return result.payload!;
    } catch (error) {
      console.error("Error updating board:", error);
      throw error;
    }
  },

  async deleteBoard(id: number): Promise<void> {
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
      console.error("Error deleting board:", error);
      throw error;
    }
  },
};
