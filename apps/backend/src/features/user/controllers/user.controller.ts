import { db } from "@/db/index.js";
import { NextFunction, Request, Response } from "express";
import { userModel } from "@repo/db/schemas/models/user";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { eq } from "drizzle-orm";
import { handleError } from "@/utils/handleError.js";
// import { findAllUsers, findUserByEmail, findUserById, saveUser, searchUser, toggleUser } from "../services/user.service.js";
import { userTypeEnum } from "@repo/db/schemas/enums";
import * as userService from "@/features/user/services/user.service.js";
import {
  getUserStats,
  requestPasswordReset,
  resetPassword,
  validateResetToken,
} from "@/features/user/services/user.service.js";
import { generateExport } from "@/features/user/services/student.service.js";
function asyncHandler(fn: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };
}
// import { asyncHandler } from "@/utils/helper.js";
// import * as userService from "../services/user.service.js";

export const getProfileInfo = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    if (!userId || Number.isNaN(userId)) {
      res.status(400).json({ message: "Invalid user id" });
      return;
    }

    const profile = await userService.findProfileInfo(userId);
    if (!profile) {
      res.status(404).json({ message: "Profile not found" });
      return;
    }

    res.status(200).json(profile);
  },
);

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, isAdmin, pageSize, type } = req.query;
    const pageParsed = Math.max(Number(page) || 1, 1);
    const pageSizeParsed = Math.max(Math.min(Number(pageSize) || 10, 100), 1);
    const isAdminCheck = String(isAdmin).toLowerCase() === "true";

    const users = await userService.findAllUsers(
      Number(pageParsed),
      Number(pageSizeParsed),
      isAdminCheck,
      type as (typeof userTypeEnum.enumValues)[number],
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          users,
          "All users fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getSearchedUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { page, pageSize, searchText } = req.query;

    const users = await userService.searchUser(
      searchText as string,
      Number(page),
      Number(pageSize),
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          users,
          "All users fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.query;
  if (!id) {
    next();
  }

  try {
    const user = await userService.findById(Number(id));

    if (user) {
      res
        .status(200)
        .json(
          new ApiResponse(200, "SUCCESS", user, "User fetched successfully!"),
        );
    } else {
      res.status(404).json(new ApiError(404, "User not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserByEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { email } = req.query;
  if (!email) {
    next();
  }

  try {
    const user = await userService.findByEmail(email as string);

    if (user) {
      res
        .status(200)
        .json(
          new ApiResponse(200, "SUCCESS", user, "User fetched successfully!"),
        );
    } else {
      res.status(404).json(new ApiError(404, "User not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;
  const updatedData = req.body;

  try {
    const updatedUser = await userService.saveUser(+id, updatedData);

    if (updatedUser) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            updatedUser,
            "User updated successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "User not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

export const toggleDisableUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { id } = req.params;

  try {
    // Fetch the current user status
    const user = await userService.toggleUser(+id);

    if (user) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            user,
            `User ${!user.isActive ? "disabled" : "enabled"} successfully!`,
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "User not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

export const exportStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log("Starting student export...");
    const exportResult = await generateExport();

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${exportResult.fileName}"`,
    );
    res.setHeader("Content-Length", exportResult.buffer.length);

    console.log(
      `Export completed. Total records: ${exportResult.totalRecords}`,
    );

    // Send the Excel buffer as response
    res.status(200).send(exportResult.buffer);
  } catch (error) {
    console.error("Export error:", error);
    handleError(error, res, next);
  }
};

export const getUserStatsHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const stats = await getUserStats();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          stats,
          "User statistics fetched successfully!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

// Password Reset Controllers

export const requestPasswordResetController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json(new ApiError(400, "Email is required"));
      return;
    }

    const result = await requestPasswordReset(email);

    if (result.success) {
      res
        .status(200)
        .json(new ApiResponse(200, "SUCCESS", null, result.message));
    } else {
      res.status(400).json(new ApiError(400, result.message));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

export const resetPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res
        .status(400)
        .json(new ApiError(400, "Token and new password are required"));
      return;
    }

    const result = await resetPassword(token, newPassword);

    if (result.success) {
      res
        .status(200)
        .json(new ApiResponse(200, "SUCCESS", null, result.message));
    } else {
      res.status(400).json(new ApiError(400, result.message));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

export const validateResetTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token } = req.params;

    if (!token) {
      res.status(400).json(new ApiError(400, "Token is required"));
      return;
    }

    const result = await validateResetToken(token);

    if (result.success) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            { email: result.email },
            result.message,
          ),
        );
    } else {
      res.status(400).json(new ApiError(400, result.message));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};
