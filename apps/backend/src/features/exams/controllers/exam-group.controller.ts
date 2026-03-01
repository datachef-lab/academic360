import { ApiError, ApiResponse, handleError } from "@/utils";
import { NextFunction, Request, Response } from "express";
import * as examGroupService from "../services/exam-group.service";

export const getAllExamGroupsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { page = "1", pageSize = "10" } = req.query;

    const pageNum = Number(page);
    const pageSizeNum = Number(pageSize);

    if (isNaN(pageNum) || isNaN(pageSizeNum)) {
      res.status(400).json(new ApiError(400, "Invalid page or pageSize"));
      return;
    }

    const result = await examGroupService.findAll(pageNum, pageSizeNum);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Exams groups fetched successfully",
        ),
      );
  } catch (error) {
    console.error("[GET-ALL-EXAMS-GROUPS] Error:", error);
    handleError(error, res, next);
  }
};

export const getExamGroupPaperStatsByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const examGroupPaperStats =
      await examGroupService.findExamGroupPaperStatsById(Number(id));

    if (!examGroupPaperStats) {
      res
        .status(404)
        .json(new ApiError(404, "Exam group paper stats not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          examGroupPaperStats,
          "Exam group paper stats fetched successfully",
        ),
      );
  } catch (error) {
    console.error("[GET-EXAM-GROUP-PAPER-STATS] Error:", error);
    handleError(error, res, next);
  }
};

export const getExamGroupByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const examGroup = await examGroupService.findById(Number(id));

    if (!examGroup) {
      res.status(404).json(new ApiError(404, "Exam group not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          examGroup,
          "Exam group fetched successfully",
        ),
      );
  } catch (error) {
    console.error("[GET-EXAM-BY-ID] Error:", error);
    handleError(error, res, next);
  }
};

export const getExamGroupByStudentIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { studentId } = req.params;

    const examGroups = await examGroupService.findByStudentId(
      Number(studentId),
    );

    if (!examGroups || examGroups.content.length === 0) {
      res
        .status(404)
        .json(new ApiError(404, "Exam groups not found for student"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          examGroups,
          "Exam groups fetched successfully",
        ),
      );
  } catch (error) {
    console.error("[GET-EXAM-GROUPS-BY-STUDENT-ID] Error:", error);
    handleError(error, res, next);
  }
};

export const getExamCandidatesByStudentIdAndExamGroupIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { studentId, examGroupId } = req.query;
    console.log("[GET-EXAM-CANDIDATES] Received query params:", req.query);

    const examGroups =
      await examGroupService.findExamCandidatesByStudentIdAndExamGroupId(
        Number(studentId),
        Number(examGroupId),
      );

    if (!examGroups || examGroups.length === 0) {
      res
        .status(404)
        .json(new ApiError(404, "Exam groups not found for student"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          examGroups,
          "Exam groups fetched successfully",
        ),
      );
  } catch (error) {
    console.error("[GET-EXAM-GROUPS-BY-STUDENT-ID] Error:", error);
    handleError(error, res, next);
  }
};

export const deleteExamGroupByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;

    const userId = (req as any)?.user?.id as number | undefined;
    const result = await examGroupService.deleteExamGroupByIdIfUpcoming(
      Number(id),
      userId,
    );

    if (!result) {
      res
        .status(404)
        .json(
          new ApiError(
            404,
            "Exam group not found or not upcoming for deletion",
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          result,
          "Exam group deleted successfully",
        ),
      );
  } catch (error) {
    console.error("[GET-EXAM-BY-ID] Error:", error);
    handleError(error, res, next);
  }
};
