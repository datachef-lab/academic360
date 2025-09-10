import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createPaper,
  getPaperById,
  getAllPapers,
  updatePaper,
  deletePaperSafe,
  updatePaperWithComponents,
  createPapers,
  //   bulkUploadPapers,
} from "@/features/course-design/services/paper.service.js";
import { PaperDto } from "@/types/course-design/index.type.js";
import { socketService } from "@/services/socketService";
import { bulkUploadCourses } from "../services/course.service";

export const createPaperHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log(req.body.arr);
    const created = await createPapers(req.body.arr as PaperDto[]);
    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", created, "Paper created successfully!"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getPaperByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.query.id || req.params.id);
    const paper = await getPaperById(id);
    if (!paper) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Paper with ID ${id} not found`,
          ),
        );
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", paper, "Paper fetched successfully"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllPapersHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const papers = await getAllPapers();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", papers, "All papers fetched"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updatePaperHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.query.id || req.params.id);
    const updated = await updatePaper(id, req.body);
    if (!updated) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Paper not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(200, "UPDATED", updated, "Paper updated successfully"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deletePaperHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.query.id || req.params.id);
    const result = await deletePaperSafe(id);
    if (!result) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", null, "Paper not found"));
      return;
    }
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "DELETED",
          result as any,
          (result as any).message ?? "",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updatePaperWithComponentsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseInt(req.params.id);
    const result = await updatePaperWithComponents(id, req.body);
    res
      .status(200)
      .json(new ApiResponse(200, "Paper updated successfully", result));
    return;
  } catch (error) {
    handleError(error, res, next);
    return;
  }
};

// export const bulkUploadPapersHandler = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     if (!req.file) {
//       res
//         .status(400)
//         .json(new ApiResponse(400, "ERROR", null, "No file uploaded"));
//       return;
//     }

//     const uploadSessionId =
//       req.body.uploadSessionId || req.query.uploadSessionId;
//     const io = socketService.getIO();

//     // const result = await bulkUploadPapers(req.file.path, io, uploadSessionId);

//     const response = {
//       success: result.success,
//       errors: result.errors,
//       summary: {
//         total: result.summary.total,
//         successful: result.summary.successful,
//         failed: result.summary.failed,
//       },
//     };

//     res
//       .status(200)
//       .json(new ApiResponse(200, "SUCCESS", response, "Bulk upload completed"));
//   } catch (error) {
//     handleError(error, res, next);
//   }
// };
