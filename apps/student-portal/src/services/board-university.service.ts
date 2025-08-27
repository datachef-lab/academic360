import { type BoardUniversity } from "@/db/schema";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class BoardUniversityService {
  static async getAllBoardUniversities(): Promise<ApiResponse<BoardUniversity[]>> {
    try {
      const response = await fetch('/api/board-universities', {
        method: 'GET',
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error fetching board universities:', error);
      return { success: false, message: 'Failed to fetch board universities', error: error.message };
    }
  }

  static async createBoardUniversity(boardUniversity: Omit<BoardUniversity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<BoardUniversity>> {
    try {
      const response = await fetch('/api/board-universities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(boardUniversity),
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error creating board university:', error);
      return { success: false, message: 'Failed to create board university', error: error.message };
    }
  }

  static async updateBoardUniversity(boardUniversity: BoardUniversity): Promise<ApiResponse<BoardUniversity>> {
    try {
      const response = await fetch(`/api/board-universities?id=${boardUniversity.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(boardUniversity),
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error updating board university:', error);
      return { success: false, message: 'Failed to update board university', error: error.message };
    }
  }

  static async deleteBoardUniversity(id: number): Promise<ApiResponse<BoardUniversity>> {
    try {
      const response = await fetch(`/api/board-universities?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error deleting board university:', error);
      return { success: false, message: 'Failed to delete board university', error: error.message };
    }
  }
} 