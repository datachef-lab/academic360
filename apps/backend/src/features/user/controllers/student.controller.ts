import { NextFunction, Request, Response } from "express";
import { addStudent, findAllStudent, findStudentById, removeStudent, saveStudent, searchStudent } from "@/features/user/services/student.service.js";
import { StudentType } from "@/types/user/student";
import { ApiError, ApiResponse, handleError } from "@/utils/index.js";

export const createStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const newStudent = await addStudent(req.body as StudentType);

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

        const students = await findAllStudent(Number(page), Number(pageSize));

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

        const students = await searchStudent(searchText as string, Number(page), Number(pageSize));

        res.status(200).json(new ApiResponse(201, "SUCCESS", students, "Students fetched!"));
    } catch (error) {
        handleError(error, res, next);
    }
}

export const getStudentById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.query;

        const foundStudent = await findStudentById(Number(id));

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

        const updatedStudent = await saveStudent(Number(id), req.body as StudentType);

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

        const deletedStudent = await removeStudent(Number(id));

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