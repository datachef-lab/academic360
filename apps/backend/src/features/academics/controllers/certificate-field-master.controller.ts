import { NextFunction, Request, Response } from "express";
import { createCertificateFieldMasterSchema } from "@repo/db/schemas";
import { ApiResponse, handleError } from "@/utils/index.js";
import * as certificateFieldMasterService from "../services/certificate-field-master.service.js";

export async function getAllCertificateFieldMastersHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const certificateMasterIdRaw = req.query.certificateMasterId;
    if (certificateMasterIdRaw != null && certificateMasterIdRaw !== "") {
      const certificateMasterId = parseInt(String(certificateMasterIdRaw), 10);
      if (Number.isNaN(certificateMasterId)) {
        res
          .status(400)
          .json(
            new ApiResponse(
              400,
              "BAD_REQUEST",
              null,
              "Invalid certificateMasterId query parameter",
            ),
          );
        return;
      }

      const rows =
        await certificateFieldMasterService.findCertificateFieldMastersByCertificateMasterId(
          certificateMasterId,
        );

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            rows,
            "Certificate field masters fetched",
          ),
        );
      return;
    }

    const rows =
      await certificateFieldMasterService.findAllCertificateFieldMasters();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "All certificate field masters fetched",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getCertificateFieldMasterByIdHandler(
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

    const row =
      await certificateFieldMasterService.findCertificateFieldMasterById(id);
    if (!row) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Certificate field master ${id} not found`,
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
          row,
          "Certificate field master retrieved",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function createCertificateFieldMasterHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createCertificateFieldMasterSchema.parse(req.body);
    const created =
      await certificateFieldMasterService.createCertificateFieldMaster(parsed);

    if (!created) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Unable to create certificate field master",
          ),
        );
      return;
    }

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          created,
          "Certificate field master created",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updateCertificateFieldMasterHandler(
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

    const partialSchema = createCertificateFieldMasterSchema.partial();
    const parsed = partialSchema.parse(req.body);

    const updated =
      await certificateFieldMasterService.updateCertificateFieldMaster(
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
            `Certificate field master ${id} not found or invalid payload`,
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
          updated,
          "Certificate field master updated",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function deleteCertificateFieldMasterHandler(
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

    const ok =
      await certificateFieldMasterService.deleteCertificateFieldMaster(id);
    if (!ok) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Certificate field master ${id} not found`,
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
          { id },
          "Certificate field master deleted",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}
