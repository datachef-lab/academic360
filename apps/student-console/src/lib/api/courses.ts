import { Course } from "@/db/schema";

import { NextResponse } from "next/server";

const API_BASE = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/courses`;

export async function fetchCourses() {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error('Failed to fetch courses');
  }
  return response.json();
}

export async function createCourse(course: Course) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(course),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create course');
  }

  return response.json();
}

export async function updateCourse(id: number, course: Partial<Course>) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/courses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(course),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update course');
  }

  return response.json();
} 