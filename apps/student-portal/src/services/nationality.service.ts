import { type Nationality } from "@/db/schema";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class NationalityService {
  static async getAllNationalities(): Promise<ApiResponse<Nationality[]>> {
    try {
      const response = await fetch('/api/nationalities', {
        method: 'GET',
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error fetching nationalities:', error);
      return { success: false, message: 'Failed to fetch nationalities', error: error.message };
    }
  }

  static async createNationality(nationality: Omit<Nationality, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Nationality>> {
    try {
      const response = await fetch('/api/nationalities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nationality),
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error creating nationality:', error);
      return { success: false, message: 'Failed to create nationality', error: error.message };
    }
  }

  static async updateNationality(nationality: Nationality): Promise<ApiResponse<Nationality>> {
    try {
      const response = await fetch(`/api/nationalities?id=${nationality.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nationality),
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error updating nationality:', error);
      return { success: false, message: 'Failed to update nationality', error: error.message };
    }
  }

  static async deleteNationality(id: number): Promise<ApiResponse<Nationality>> {
    try {
      const response = await fetch(`/api/nationalities?id=${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      return data;
    } catch (error: any) {
      console.error('Error deleting nationality:', error);
      return { success: false, message: 'Failed to delete nationality', error: error.message };
    }
  }
} 