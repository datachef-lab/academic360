import { NextFunction, Request, Response } from "express";
// import { addStudent, findAllStudent, findStudentById, removeStudent, saveStudent, searchStudent, searchStudentsByRollNumber, findFilteredStudents } from "@/features/user/services/student.service.js";
import { StudentType } from "@/types/user/student.js";
import { ApiError, ApiResponse, handleError } from "@/utils/index.js";
import { boolean } from "drizzle-orm/mysql-core";

import * as studentService from "@/features/user/services/student.service.js";

export const createStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newStudent = await studentService.addStudent(req.body as StudentType);

        res.status(201).json(new ApiResponse(201, "SUCCESS", newStudent, "Student Created!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getAllStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { page, pageSize } = req.query;

        if (!page) {
            page = "1";
        }

        if (!pageSize) {
            pageSize = "10";
        }

        const students = await studentService.findAllStudent(Number(page), Number(pageSize));

        res.status(200).json(new ApiResponse(201, "SUCCESS", students, "Students fetched!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getSearchedStudents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { page, pageSize, searchText } = req.query;

        if (!page) {
            page = "1";
        }

        if (!pageSize) {
            pageSize = "10";
        }

        const students = await studentService.searchStudent(searchText as string, Number(page), Number(pageSize));

        res.status(200).json(new ApiResponse(201, "SUCCESS", students, "Students fetched!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getSearchedStudentsByRollNumber = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let { page, pageSize, searchText } = req.query;

        if (!page) {
            page = "1";
        }

        if (!pageSize) {
            pageSize = "10";
        }

        const students = await studentService.searchStudentsByRollNumber(searchText as string, Number(page), Number(pageSize));

        res.status(200).json(new ApiResponse(200, "SUCCESS", students, "Students fetched!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getStudentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        const foundStudent = await studentService.findById(Number(id));

        if (!foundStudent) {
            res.status(404).json(new ApiError(404, `No student exist for id: ${id}`));
        }

        res.status(200).json(new ApiResponse(201, "SUCCESS", foundStudent, "Student fetched!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const updateStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const updatedStudent = await studentService.saveStudent(Number(id), req.body as StudentType);

        if (!updateStudent) {
            res.status(404).json(new ApiError(404, `No student exist for id: ${id}`));
        }

        res.status(200).json(new ApiResponse(201, "SUCCESS", updatedStudent, "Student Updated!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const deleteStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const deletedStudent = await studentService.removeStudent(Number(id));

        if (deletedStudent == null) {
            res.status(404).json(new ApiError(204, `No student exist for id: ${id}`));
            return;
        }

        if (!deletedStudent) {
            res.status(429).json(new ApiError(204, `Unable to delete the student with id: ${id}`));
        }

        res.status(200).json(new ApiResponse(201, "SUCCESS", deletedStudent, "Student Deleted!"));

    } catch (error) {
        handleError(error, res, next);
    }
}

export const getFilteredStudents = async (req: Request, res: Response,next:NextFunction) => {
    try {
        const { page = 1, pageSize = 10, stream, year, semester, framework,export:isExport } = req.query;
        
        const result = await studentService.findFilteredStudents({
            page: Number(page),
            pageSize: Number(pageSize),
            stream: stream as string,
            year: Number(year) ,
            semester: Number(semester),
            framework: framework as "CCF" | "CBCS",
            export: isExport === "true" ? true : false
        });

        res.json({
            success: true,
            message: 'Students retrieved successfully',
            data: result
        });
    } catch (error) {
        console.error('Error in getFilteredStudents:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve students',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};