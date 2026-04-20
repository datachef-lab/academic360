import { NextFunction, Request, Response } from "express";
import { createCertificateMasterSchema } from "@repo/db/schemas";
import { ApiResponse, handleError } from "@/utils/index.js";
import * as certificateMasterService from "../services/certificate-master.service.js";

export async function getAllCertificateMastersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const rows = await certificateMasterService.findAllCertificateMasters();
    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", rows, "Certificate masters fetched"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getCertificateMasterByIdHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
      return;
    }

    const row = await certificateMasterService.findCertificateMasterById(id);
    if (!row) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Certificate master ${id} not found`,
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", row, "Certificate master retrieved"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function createCertificateMasterHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createCertificateMasterSchema.parse(req.body);
    const created =
      await certificateMasterService.createCertificateMaster(parsed);

    if (!created) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Unable to create certificate master",
          ),
        );
      return;
    }

    res
      .status(201)
      .json(
        new ApiResponse(201, "SUCCESS", created, "Certificate master created"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updateCertificateMasterHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
      return;
    }

    const partialSchema = createCertificateMasterSchema.partial();
    const parsed = partialSchema.parse(req.body);

    const updated = await certificateMasterService.updateCertificateMaster(
      id,
      parsed,
    );
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Certificate master ${id} not found or invalid payload`,
          ),
        );
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", updated, "Certificate master updated"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function deleteCertificateMasterHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (Number.isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid id"));
      return;
    }

    try {
      const ok = await certificateMasterService.deleteCertificateMaster(id);
      if (!ok) {
        res
          .status(404)
          .json(
            new ApiResponse(
              404,
              "NOT_FOUND",
              null,
              `Certificate master ${id} not found`,
            ),
          );
        return;
      }
    } catch (e: unknown) {
      const code =
        typeof e === "object" && e !== null && "code" in e
          ? String((e as { code?: string }).code)
          : "";
      if (code === "23503") {
        res
          .status(409)
          .json(
            new ApiResponse(
              409,
              "CONFLICT",
              null,
              "Cannot delete: certificate master is still referenced by career progression or other records.",
            ),
          );
        return;
      }
      handleError(e as Error, res, next);
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, "SUCCESS", { id }, "Certificate master deleted"),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}
