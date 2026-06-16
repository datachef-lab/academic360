import { NextFunction, Request, Response } from "express";
import { ApiError } from "@/utils/ApiError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import {
  createZone,
  deleteZone,
  findZonesPaginated,
  getZoneById,
  listGateEvents,
  recordGateEvent,
  updateZone,
} from "@/features/library/services/library-zone.service.js";

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
const optInt = (v: unknown): number | null => optId(v);

export const listZones = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 15);
    const result = await findZonesPaginated({
      page: Number.isNaN(page) || page < 1 ? 1 : page,
      limit: Number.isNaN(limit) || limit < 1 ? 15 : Math.min(limit, 100),
      search:
        typeof req.query.search === "string" ? req.query.search : undefined,
      branchId: optId(req.query.branchId) ?? undefined,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result, "Zones fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const getZone = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    const row = await getZoneById(id);
    if (!row) throw new ApiError(404, "Zone not found.");
    res.status(200).json(new ApiResponse(200, "SUCCESS", row, "Zone fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

const bodyToUpsert = (b: Record<string, unknown>) => ({
  branchId: optId(b.branchId),
  name: typeof b.name === "string" ? b.name : "",
  code: typeof b.code === "string" ? b.code : null,
  description: typeof b.description === "string" ? b.description : null,
  capacity: optInt(b.capacity),
  isActive: typeof b.isActive === "boolean" ? b.isActive : undefined,
});

export const createZoneController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) throw new ApiError(400, "Name is required.");
    const id = await createZone(input);
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", { id }, "Zone created."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const updateZoneController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    const input = bodyToUpsert(req.body as Record<string, unknown>);
    if (!input.name.trim()) throw new ApiError(400, "Name is required.");
    await updateZone(id, input);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Zone updated."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const deleteZoneController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = parseId(req.params.id);
    if (!id) throw new ApiError(400, "Invalid id.");
    await deleteZone(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", null, "Zone deleted."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const listGateEventsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 50);
    const result = await listGateEvents({
      page: Number.isNaN(page) || page < 1 ? 1 : page,
      limit: Number.isNaN(limit) || limit < 1 ? 50 : Math.min(limit, 200),
      branchId: optId(req.query.branchId) ?? undefined,
      eventType:
        typeof req.query.eventType === "string"
          ? req.query.eventType
          : undefined,
    });
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", result, "Gate events fetched."));
  } catch (e) {
    handleError(e, res, next);
  }
};

export const recordGateEventController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const b = req.body as Record<string, unknown>;
    const id = await recordGateEvent({
      branchId: optId(b.branchId),
      gateIdentifier:
        typeof b.gateIdentifier === "string" ? b.gateIdentifier : null,
      eventType: typeof b.eventType === "string" ? b.eventType : "",
      rfidNumber: typeof b.rfidNumber === "string" ? b.rfidNumber : null,
      copyDetailsId: optId(b.copyDetailsId),
      userId: optId(b.userId),
      capturedImageUrl:
        typeof b.capturedImageUrl === "string" ? b.capturedImageUrl : null,
      remarks: typeof b.remarks === "string" ? b.remarks : null,
    });
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", { id }, "Gate event recorded."));
  } catch (e) {
    handleError(e, res, next);
  }
};
