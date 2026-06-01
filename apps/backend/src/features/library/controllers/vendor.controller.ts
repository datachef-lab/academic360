/* eslint-disable @typescript-eslint/no-explicit-any */
import { handleError } from "@/utils";
import { ApiError } from "@/utils/ApiError.js";
import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import {
  CreateVendor,
  findVendorById,
  findVendorByName,
  findVendorsPaginated,
  updateVendor,
  deleteVendor,
} from "../services/vendor.service";
import { socketService } from "@/services/socketService.js";

const vendorActorName = (req: Request): string => {
  const u = req.user as { name?: string | null } | undefined;
  const n = typeof u?.name === "string" ? u.name.trim() : "";
  return n || "Someone";
};

const parseId = (value?: string | string[]) => {
  const input = Array.isArray(value) ? value[0] : value;
  const parsed = Number(input);
  if (!input || Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
};

export const createVendorController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const {
      legacyVendorId,
      name,
      code,
      email,
      phone,
      website,
      personOfContact,
      personOfContactEmail,
      personOfContactPhone,
      pan,
    } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json(new ApiError(400, "Name is required"));
      return;
    }
    const normalisedName = name.trim();
    const existing = await findVendorByName(normalisedName);
    if (existing) {
      res.status(409).json(new ApiError(409, "Vendor already exists"));
      return;
    }

    if (!email || !pan || !phone) {
      res
        .status(400)
        .json(new ApiError(400, "Email, PAN and phone are required"));
      return;
    }

    const created = await CreateVendor({
      legacyVendorId:
        legacyVendorId === undefined || legacyVendorId === null
          ? null
          : Number(legacyVendorId),
      name: normalisedName,
      code: code || null,
      email,
      phone,
      website: website || null,
      personOfContact: personOfContact || null,
      personOfContactEmail: personOfContactEmail || null,
      personOfContactPhone: personOfContactPhone || null,
      pan,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const vendorId = created.id;
    if (vendorId == null) {
      throw new ApiError(500, "Failed to create vendor");
    }

    socketService.sendLibraryVendorUpdate({
      action: "CREATED",
      actorName: vendorActorName(req),
      vendorId,
      vendorName: normalisedName,
      meta: { vendorId },
    });

    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", created, "Vendor created successfully"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllVendorsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = req.query.page ? Number(req.query.page) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const search =
      typeof req.query.search === "string" ? req.query.search : undefined;

    const payload = await findVendorsPaginated({
      page: page,
      limit: limit,
      search,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          payload,
          "Vendors fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getVendorByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const vendor = await findVendorById(id);
    if (!vendor) {
      res.status(404).json(new ApiError(404, "Vendor not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", vendor, "Vendor fetched successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateVendorController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findVendorById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Vendor not found"));
      return;
    }

    const {
      legacyVendorId,
      name,
      code,
      email,
      phone,
      website,
      personOfContact,
      personOfContactEmail,
      personOfContactPhone,
      pan,
    } = req.body;
    const updateData: any = { updatedAt: new Date() };

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json(new ApiError(400, "Name cannot be empty"));
        return;
      }

      const normalisedName = name.trim();
      const duplicate = await findVendorByName(normalisedName, id);
      if (duplicate) {
        res.status(409).json(new ApiError(409, "Vendor already exists"));
        return;
      }

      updateData.name = normalisedName;
    }

    if (legacyVendorId !== undefined) {
      updateData.legacyVendorId =
        legacyVendorId === null ? null : Number(legacyVendorId);
    }

    if (code !== undefined) {
      updateData.code = code || null;
    }

    if (email !== undefined) {
      updateData.email = email || null;
    }

    if (phone !== undefined) {
      updateData.phone = phone || null;
    }

    if (website !== undefined) {
      updateData.website = website || null;
    }

    if (personOfContact !== undefined) {
      updateData.personOfContact = personOfContact || null;
    }

    if (personOfContactEmail !== undefined) {
      updateData.personOfContactEmail = personOfContactEmail || null;
    }

    if (personOfContactPhone !== undefined) {
      updateData.personOfContactPhone = personOfContactPhone || null;
    }

    if (pan !== undefined) {
      updateData.pan = pan || null;
    }

    const updated = await updateVendor(id, updateData);
    const vendorName =
      typeof updateData.name === "string" ? updateData.name : existing.name;
    socketService.sendLibraryVendorUpdate({
      action: "UPDATED",
      actorName: vendorActorName(req),
      vendorId: id,
      vendorName,
      meta: { vendorId: id },
    });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Vendor updated successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteVendorController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      res.status(400).json(new ApiError(400, "Valid ID is required"));
      return;
    }

    const existing = await findVendorById(id);
    if (!existing) {
      res.status(404).json(new ApiError(404, "Vendor not found"));
      return;
    }

    const vendorName = existing.name;
    await deleteVendor(id);
    socketService.sendLibraryVendorUpdate({
      action: "DELETED",
      actorName: vendorActorName(req),
      vendorId: id,
      vendorName,
      meta: { vendorId: id },
    });
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", null, "Vendor deleted successfully."),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};
