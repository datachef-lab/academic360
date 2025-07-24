const API_URL = "/api/course-levels";

export interface CourseLevel {
  id: string;
  name: string;
  description?: string | null;
  levelOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CourseLevelData {
  name: string;
  description?: string | null;
  levelOrder: number;
  isActive: boolean;
}

export const getAllCourseLevels = async (): Promise<CourseLevel[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch course levels");
  }
  return response.json();
};

export const getCourseLevelById = async (id: string): Promise<CourseLevel> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch course level with id ${id}`);
  }
  return response.json();
};

export const createCourseLevel = async (data: CourseLevelData): Promise<CourseLevel> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create course level");
  }
  return response.json();
};

export const updateCourseLevel = async (id: string, data: Partial<CourseLevelData>): Promise<CourseLevel> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to update course level with id ${id}`);
  }
  return response.json();
};

export const deleteCourseLevel = async (id: string): Promise<{ success: boolean }> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete course level with id ${id}`);
  }
  return response.json();
};
