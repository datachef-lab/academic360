import { CourseType } from "@/pages/courses-subjects-design/course-types/columns";

const API_URL = "/api/course-types";

export const getAllCourseTypes = async (): Promise<CourseType[]> => {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("Failed to fetch course types");
  }
  return response.json();
};

export const getCourseTypeById = async (id: string): Promise<CourseType> => {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch course type with id ${id}`);
  }
  return response.json();
};

export const createCourseType = async (data: Omit<CourseType, 'id' | 'createdAt' | 'updatedAt'>): Promise<CourseType> => {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error("Failed to create course type");
  }
  return response.json();
};

export const updateCourseType = async (id: string, data: Partial<CourseType>): Promise<CourseType> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to update course type with id ${id}`);
  }
  return response.json();
};

export const deleteCourseType = async (id: string): Promise<void> => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete course type with id ${id}`);
  }
};
