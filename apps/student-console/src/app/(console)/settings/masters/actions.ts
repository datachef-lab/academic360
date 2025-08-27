"use server";

import { Course } from "@/db/schema";
import { createCourse as createCourseService, findAllDbCourses, updateCourse as updateCourseService } from "@/lib/services/course.service";

import { revalidatePath } from "next/cache";
import * as XLSX from 'xlsx';

export async function handleCourseSubmit(formData: FormData) {
  const courseData = {
    name: formData.get('name') as string,
    shortName: formData.get('shortName') as string,
    codePrefix: formData.get('codePrefix') as string,
    universityCode: formData.get('universityCode') as string,
    amount: formData.get('amount') ? Number(formData.get('amount')) : 0,
  };

  try {
    const courseId = formData.get('id');
    if (courseId) {
      await updateCourseService(Number(courseId), courseData as any);
    } else {
      await createCourseService(courseData as any);
    }
    revalidatePath('/settings/masters');
    return { success: true };
  } catch (error) {
    console.error('Error submitting course:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit course' 
    };
  }
}

export async function uploadCoursesFromFile(formData: FormData) {
  const file = formData.get('file') as File;
  if (!file) {
    return { success: false, error: 'No file provided' };
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const coursesData = XLSX.utils.sheet_to_json(worksheet) as Course[];

    for (const course of coursesData) {
      if (course.amount !== undefined) {
        course.amount = Number(course.amount);
      }
      await createCourseService(course as any);
    }

    revalidatePath('/settings/masters');
    return { success: true };
  } catch (error) {
    console.error('Error uploading courses:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload courses' 
    };
  }
}

export async function downloadCourses() {
  console.log("Server Action: downloadCourses started");
  try {
    console.log("Server Action: Calling findAllCourse...");
    const coursesData = await findAllDbCourses(1, 10000); 
    console.log("Server Action: findAllCourse returned data.", { count: coursesData.courses.length });

    console.log("Server Action: Returning success with data.");
    return { success: true, data: coursesData };

  } catch (error: any) { 
    console.error('Server Action: Error in downloadCourses:', error);
    if (error.cause) {
      console.error('Server Action: Error Cause:', error.cause);
    }
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to download courses' 
    };
  }
}

export async function fetchPaginatedCourses(page: number, limit: number) {
  console.log("Server Action: fetchPaginatedCourses started", { page, limit });
  try {
    const result = await findAllDbCourses(page, limit);
    console.log("Server Action: findAllDbCourses returned data.", { count: result.courses.length, totalCount: result.totalCount });
    return { success: true, data: result.courses, totalCount: result.totalCount };
  } catch (error: any) {
    console.error('Server Action: Error in fetchPaginatedCourses:', error);
    return { 
      success: false, 
      data: [], // Return empty array on error
      totalCount: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch paginated courses' 
    };
  }
} 