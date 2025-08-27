import { type Category } from "@/db/schema";

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export class CategoryService {
    static async getAllCategories(): Promise<ApiResponse<Category[]>> {
        try {
            const response = await fetch('/api/categories', {
                method: 'GET',
            });
            const data = await response.json();
            return data;
        } catch (error: any) {
            console.error('Error fetching categories:', error);
            return { success: false, message: 'Failed to fetch categories', error: error.message };
        }
    }

    static async createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Category>> {
        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(category),
            });
            const data = await response.json();
            return data;
        } catch (error: any) {
            console.error('Error creating category:', error);
            return { success: false, message: 'Failed to create category', error: error.message };
        }
    }

    static async updateCategory(category: Category): Promise<ApiResponse<Category> | null> {
        try {
            const response = await fetch(`/api/categories?id=${category.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(category),
            });
            const data = await response.json();
            return data;
        } catch (error: any) {
            return null;
        }
    }

}
