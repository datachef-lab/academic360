import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import {
  createUserGroupMember,
  deleteUserGroupMember,
  getAllUserGroupMembers,
  getUserGroupMemberById,
  getUserGroupMemberByGroupAndMember,
  getUserGroupMembersByGroupId,
  isValidMember,
} from "@/features/administration/services/user-group-member.service.js";

export const createUserGroupMemberHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userGroupId, member } = req.body;

    if (typeof userGroupId !== "number" || Number.isNaN(userGroupId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid userGroupId (number) is required"));
      return;
    }

    if (!member || typeof member !== "string" || !member.trim()) {
      res.status(400).json(new ApiError(400, "Member (user type) is required"));
      return;
    }

    const normalizedMember = member.trim().toUpperCase();
    if (!isValidMember(normalizedMember)) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            "Invalid member. Must be one of: ADMIN, STUDENT, FACULTY, STAFF, PARENTS",
          ),
        );
      return;
    }

    const existing = await getUserGroupMemberByGroupAndMember(
      userGroupId,
      normalizedMember,
    );
    if (existing) {
      res
        .status(409)
        .json(
          new ApiError(409, "This member type is already in this user group"),
        );
      return;
    }

    const createPayload = {
      userGroupId,
      member: normalizedMember,
    };
    const created = await createUserGroupMember(createPayload);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "User group member created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserGroupMembersHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userGroupIdParam = req.query.userGroupId as string | undefined;

    if (userGroupIdParam !== undefined) {
      const userGroupId = Number(userGroupIdParam);
      if (Number.isNaN(userGroupId)) {
        res
          .status(400)
          .json(new ApiError(400, "userGroupId must be a valid number"));
        return;
      }
      const members = await getUserGroupMembersByGroupId(userGroupId);
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            members,
            "User group members fetched successfully",
          ),
        );
    } else {
      const members = await getAllUserGroupMembers();
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            members,
            "User group members fetched successfully",
          ),
        );
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserGroupMemberByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const memberId = Number(id);

    if (!id || Number.isNaN(memberId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user group member ID is required"));
      return;
    }

    const member = await getUserGroupMemberById(memberId);
    if (!member) {
      res.status(404).json(new ApiError(404, "User group member not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          member,
          "User group member fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteUserGroupMemberHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const memberId = Number(id);

    if (!id || Number.isNaN(memberId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user group member ID is required"));
      return;
    }

    const existing = await getUserGroupMemberById(memberId);
    if (!existing) {
      res.status(404).json(new ApiError(404, "User group member not found"));
      return;
    }

    await deleteUserGroupMember(memberId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "User group member deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
