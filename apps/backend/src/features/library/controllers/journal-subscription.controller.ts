import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createSubscription,
  createIssue,
  deleteIssue,
  deleteSubscription,
  findSubscriptionsPaginated,
  getSubscriptionById,
  listIssuesBySubscription,
  updateIssue,
  updateSubscription,
} from "@/features/library/services/journal-subscription.service.js";

const parseId = (v?: string | string[]): number | null => {
  const input = Array.isArray(v) ? v[0] : v;
  const n = Number(input);
  if (!input || Number.isNaN(n)) return null;
  return n;
};

const optId = (v: unknown): number | null => {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export const listSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 15);
    const result = await findSubscriptionsPaginated({
      page: Number.isNaN(page) || page < 1 ? 1 : page,
      limit: Number.isNaN(limit) || limit < 1 ? 15 : Math.min(limit, 100),
      journalId: optId(req.query.journalId) ?? undefined,
      vendorId: optId(req.query.vendorId) ?? undefined,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result, "Subscriptions fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const getSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    const row = await getSubscriptionById(id);
    if (!row) throw new ApiError(404, "Subscription not found.");
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", row, "Subscription fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const createSubscriptionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const b = req.body as Record<string, unknown>;
    const id = await createSubscription({
      journalId: optId(b.journalId) ?? 0,
      vendorId: optId(b.vendorId),
      startDate: typeof b.startDate === "string" ? b.startDate : "",
      endDate: typeof b.endDate === "string" ? b.endDate : "",
      frequency: typeof b.frequency === "string" ? b.frequency : null,
      costPerYear: Number(b.costPerYear ?? 0),
      isActive: typeof b.isActive === "boolean" ? b.isActive : undefined,
      remarks: typeof b.remarks === "string" ? b.remarks : null,
    });
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", { id }, "Subscription created."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const updateSubscriptionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    const b = req.body as Record<string, unknown>;
    await updateSubscription(id, {
      journalId: optId(b.journalId) ?? 0,
      vendorId: optId(b.vendorId),
      startDate: typeof b.startDate === "string" ? b.startDate : "",
      endDate: typeof b.endDate === "string" ? b.endDate : "",
      frequency: typeof b.frequency === "string" ? b.frequency : null,
      costPerYear: Number(b.costPerYear ?? 0),
      isActive: typeof b.isActive === "boolean" ? b.isActive : undefined,
      remarks: typeof b.remarks === "string" ? b.remarks : null,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Subscription updated."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const deleteSubscriptionController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    await deleteSubscription(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Subscription deleted."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const listIssues = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const subscriptionId = parseId(req.params.subscriptionId);
    if (!subscriptionId) throw new ApiError(400, "Invalid subscription id.");
    const rows = await listIssuesBySubscription(subscriptionId);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", rows, "Issues fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const createIssueController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const subscriptionId = parseId(req.params.subscriptionId);
    if (!subscriptionId) throw new ApiError(400, "Invalid subscription id.");
    const b = req.body as Record<string, unknown>;
    const id = await createIssue({
      subscriptionId,
      issueNumber: typeof b.issueNumber === "string" ? b.issueNumber : "",
      expectedDate: typeof b.expectedDate === "string" ? b.expectedDate : "",
      receivedDate: typeof b.receivedDate === "string" ? b.receivedDate : null,
      condition: typeof b.condition === "string" ? b.condition : null,
      remarks: typeof b.remarks === "string" ? b.remarks : null,
    });
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", { id }, "Issue created."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const updateIssueController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    await updateIssue(id, req.body as Parameters<typeof updateIssue>[1]);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Issue updated."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const deleteIssueController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    await deleteIssue(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Issue deleted."));
  } catch (e) {
    handleError(e, res, next);
  }
};
