import { type Religion } from "@/db/schema";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class ReligionService {
  static async getAllReligions(): Promise<ApiResponse<Religion[]>> {
    try {
      const response = await fetch('/api/religions', {
        method: 'GET',
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error fetching religions:', error);
      return { success: false, message: 'Failed to fetch religions', error: error.message };
    }
  }

  static async createReligion(religion: Omit<Religion, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Religion>> {
    try {
      const response = await fetch('/api/religions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(religion),
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error creating religion:', error);
      return { success: false, message: 'Failed to create religion', error: error.message };
    }
  }

  static async updateReligion(religion: Religion): Promise<ApiResponse<Religion>> {
    try {
      const response = await fetch(`/api/religions?id=${religion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(religion),
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error updating religion:', error);
      return { success: false, message: 'Failed to update religion', error: error.message };
    }
  }

  static async deleteReligion(id: number): Promise<ApiResponse<Religion>> {
    try {
      const response = await fetch(`/api/religions?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error deleting religion:', error);
      return { success: false, message: 'Failed to delete religion', error: error.message };
    }
  }
} 