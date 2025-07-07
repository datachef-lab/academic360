import { Request, Response } from "express";
import { z } from "zod";
import { createCourse, deleteCourse, findAllCourses, findCourseById, searchCourses, updateCourse } from "../services/course.service.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

export async function getAllCoursesHandler(req: Request, res: Response) {
    try {
        const courses = await findAllCourses();
        return res.status(200).json(new ApiResponse(200, "SUCCESS", courses, "Courses fetched successfully"));
    } catch (error) {
        console.error("Error fetching all courses:", error);
        return res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to fetch courses"));
    }
}

export async function getCourseByIdHandler(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid course ID"));
        }

        const course = await findCourseById(id);
        if (!course) {
            return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Course not found"));
        }

        return res.status(200).json(new ApiResponse(200, "SUCCESS", course, "Course fetched successfully"));
    } catch (error) {
        console.error(`Error fetching course with ID ${req.params.id}:`, error);
        return res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to fetch course"));
    }
}

export async function createCourseHandler(req: Request, res: Response) {
    try {
        
        const newCourse = await createCourse(req.body);
        return res.status(201).json(new ApiResponse(201, "CREATED", newCourse, "Course created successfully"));
    } catch (error) {
        console.error("Error creating course:", error);
        return res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to create course"));
    }
}

export async function updateCourseHandler(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid course ID"));
        }

        // const validationResult = updateCourseSchema.safeParse();
        // if (!validationResult.success) {
        //     return res.status(400).json(new ApiResponse(400, "BAD_REQUEST", validationResult.error.format(), "Invalid course data"));
        // }

        // const courseData = validationResult.data;
        const updatedCourse = await updateCourse(id, req.body);
        
        if (!updatedCourse) {
            return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Course not found"));
        }

        return res.status(200).json(new ApiResponse(200, "SUCCESS", updatedCourse, "Course updated successfully"));
    } catch (error) {
        console.error(`Error updating course with ID ${req.params.id}:`, error);
        return res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to update course"));
    }
}

export async function deleteCourseHandler(req: Request, res: Response) {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid course ID"));
        }

        const deletedCourse = await deleteCourse(id);
        
        if (!deletedCourse) {
            return res.status(404).json(new ApiResponse(404, "NOT_FOUND", null, "Course not found"));
        }

        return res.status(200).json(new ApiResponse(200, "DELETED", deletedCourse, "Course deleted successfully"));
    } catch (error) {
        console.error(`Error deleting course with ID ${req.params.id}:`, error);
        return res.status(500).json(new ApiResponse(500, "ERROR", null, "Failed to delete course"));
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