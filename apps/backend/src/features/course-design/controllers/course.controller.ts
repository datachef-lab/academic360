import { Request, Response } from "express";
import { z } from "zod";
import { createCourse, deleteCourse, findAllCourses, findCourseById, searchCourses, updateCourse, bulkUploadCourses } from "@/features/course-design/services/course.service.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { socketService } from "@/services/socketService.js";

export async function bulkUploadCoursesHandler(req: Request, res: Response): Promise<void> {
    try {
        if (!req.file) {
            res.status(400).json(new ApiResponse(400, "ERROR", null, "No file uploaded"));
            return;
        }
        const uploadSessionId = req.body.uploadSessionId || req.query.uploadSessionId;
        const io = socketService.getIO();
        const result = await bulkUploadCourses(req.file.path, io, uploadSessionId);
        const response = {
            success: result.success,
            errors: result.errors,
            summary: {
                total: result.success.length + result.errors.length,
                successful: result.success.length,
                failed: result.errors.length
            }
        };
        res.status(200).json(new ApiResponse(200, "SUCCESS", response, "Bulk upload completed"));
    } catch (error: unknown) {
        res.status(500).json(new ApiResponse(500, "ERROR", null, error instanceof Error ? error.message : "Unknown error"));
    }
}

export async function getAllCoursesHandler(req: Request, res: Response): Promise<void> {
    try {
        const courses = await findAllCourses();
        
        res.status(200).json(new ApiResponse(200, "SUCCESS", courses, "Courses fetched successfully"));
        return;
    } catch (error) {
        console.error("Error fetching all courses:", error);
        res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to fetch courses"));
        return;
    }
}

export async function getCourseByIdHandler(req: Request, res: Response): Promise<void> {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid course ID"));
            return;
        }

        const course = await findCourseById(id);
        if (!course) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Course not found"));
            return;
        }

        res.status(200).json(new ApiResponse(200, "SUCCESS", course, "Course fetched successfully"));
        return;
    } catch (error) {
        console.error(`Error fetching course with ID ${req.params.id}:`, error);
        res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to fetch course"));
        return;
    }
}

export async function createCourseHandler(req: Request, res: Response): Promise<void> {
    try {

        const newCourse = await createCourse(req.body);
        res.status(201).json(new ApiResponse(201, "CREATED", newCourse, "Course created successfully"));
        return;
    } catch (error) {
        console.error("Error creating course:", error);
        res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to create course"));
        return;
    }
}

export async function updateCourseHandler(req: Request, res: Response): Promise<void> {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid course ID"));
            return;
        }

        // const validationResult = updateCourseSchema.safeParse();
        // if (!validationResult.success) {
        //     return res.status(400).json(new ApiResponse(400, "BAD_REQUEST", validationResult.error.format(), "Invalid course data"));
        // }

        // const courseData = validationResult.data;
        const updatedCourse = await updateCourse(id, req.body);

        if (!updatedCourse) {
                    res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Course not found"));
            return;
        }

        res.status(200).json(new ApiResponse(200, "SUCCESS", updatedCourse, "Course updated successfully"));
        return;
    } catch (error) {
        console.error(`Error updating course with ID ${req.params.id}:`, error);
        res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to update course"));
        return;
    }
}

export async function deleteCourseHandler(req: Request, res: Response): Promise<void> {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid course ID"));
            return;
        }

        const deletedCourse = await deleteCourse(id);

        if (!deletedCourse) {
            res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Course not found"));
            return;
        }

        res.status(200).json(new ApiResponse(200, "DELETED", deletedCourse, "Course deleted successfully"));
        return;
    } catch (error) {
        console.error(`Error deleting course with ID ${req.params.id}:`, error);
        res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to delete course"));
        return;
    }
}

export async function searchCoursesHandler(req: Request, res: Response) {
    try {
        const query = req.query.q as string;
        if (!query || query.trim() === "") {
            return res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Search query is required"));
        }

        const courses = await searchCourses(query);
        return res.status(200).json(new ApiResponse(200, "SUCCESS", courses, "Courses fetched successfully"));
    } catch (error) {
        console.error(`Error searching courses with query ${req.query.q}:`, error);
        return res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to search courses"));
    }
}
