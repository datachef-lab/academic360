import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { ApiError } from "@/utils/ApiError.js";
import { handleError } from "@/utils/handleError.js";
import {
  createUserGroupDomain,
  deleteUserGroupDomain,
  getAllUserGroupDomains,
  getUserGroupDomainById,
  getUserGroupDomainByGroupAndDomain,
  getUserGroupDomainsByGroupId,
  isValidDomain,
} from "@/features/administration/services/user-group-domain.service.js";

export const createUserGroupDomainHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { userGroupId, domain } = req.body;

    if (typeof userGroupId !== "number" || Number.isNaN(userGroupId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid userGroupId (number) is required"));
      return;
    }

    if (!domain || typeof domain !== "string" || !domain.trim()) {
      res.status(400).json(new ApiError(400, "Domain is required"));
      return;
    }

    const normalizedDomain = domain.trim().toUpperCase();
    if (!isValidDomain(normalizedDomain)) {
      res
        .status(400)
        .json(
          new ApiError(
            400,
            `Invalid domain. Must be one of: MAIN_CONSOLE, STUDENT_CONSOLE, STUDENT_CONSOLE_MOBILE, EXAM_ATTENDANCE_APP, ID_CARD_GENERATOR, EVENT_GATEKEEPER`,
          ),
        );
      return;
    }

    const existing = await getUserGroupDomainByGroupAndDomain(
      userGroupId,
      normalizedDomain,
    );
    if (existing) {
      res
        .status(409)
        .json(
          new ApiError(
            409,
            "This domain is already assigned to this user group",
          ),
        );
      return;
    }

    const createPayload = {
      userGroupId,
      domain: normalizedDomain,
    };
    const created = await createUserGroupDomain(createPayload);

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "User group domain created successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserGroupDomainsHandler = async (
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
      const domains = await getUserGroupDomainsByGroupId(userGroupId);
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            domains,
            "User group domains fetched successfully",
          ),
        );
    } else {
      const domains = await getAllUserGroupDomains();
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            domains,
            "User group domains fetched successfully",
          ),
        );
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getUserGroupDomainByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const domainId = Number(id);

    if (!id || Number.isNaN(domainId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user group domain ID is required"));
      return;
    }

    const domain = await getUserGroupDomainById(domainId);
    if (!domain) {
      res.status(404).json(new ApiError(404, "User group domain not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          domain,
          "User group domain fetched successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteUserGroupDomainHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { id } = req.params;
    const domainId = Number(id);

    if (!id || Number.isNaN(domainId)) {
      res
        .status(400)
        .json(new ApiError(400, "Valid user group domain ID is required"));
      return;
    }

    const existing = await getUserGroupDomainById(domainId);
    if (!existing) {
      res.status(404).json(new ApiError(404, "User group domain not found"));
      return;
    }

    await deleteUserGroupDomain(domainId);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          null,
          "User group domain deleted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
