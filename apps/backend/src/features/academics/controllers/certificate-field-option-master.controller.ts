import { NextFunction, Request, Response } from "express";
import { createCertificateFieldOptionMasterSchema } from "@repo/db/schemas";
import { ApiResponse, handleError } from "@/utils/index.js";
import * as certificateFieldOptionMasterService from "../services/certificate-field-option-master.service.js";

export async function getCertificateFieldOptionsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const raw = req.query.certificateFieldMasterId;
    if (raw == null || String(raw).trim() === "") {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "certificateFieldMasterId query parameter is required",
          ),
        );
      return;
    }
    const certificateFieldMasterId = parseInt(String(raw), 10);
    if (Number.isNaN(certificateFieldMasterId)) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid certificateFieldMasterId",
          ),
        );
      return;
    }

    const rows =
      await certificateFieldOptionMasterService.findOptionsByFieldMasterId(
        certificateFieldMasterId,
      );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Certificate field options fetched",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getCertificateFieldOptionByIdHandler(
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
      await certificateFieldOptionMasterService.findCertificateFieldOptionById(
        id,
      );
    if (!row) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Certificate field option ${id} not found`,
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
          "Certificate field option retrieved",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function createCertificateFieldOptionHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createCertificateFieldOptionMasterSchema.parse(req.body);
    const created =
      await certificateFieldOptionMasterService.createCertificateFieldOption(
        parsed,
      );

    if (!created) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Unable to create certificate field option",
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
          "Certificate field option created",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updateCertificateFieldOptionHandler(
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

    const partialSchema = createCertificateFieldOptionMasterSchema.partial();
    const parsed = partialSchema.parse(req.body);

    const updated =
      await certificateFieldOptionMasterService.updateCertificateFieldOption(
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
            `Certificate field option ${id} not found`,
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
          "Certificate field option updated",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function deleteCertificateFieldOptionHandler(
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
      await certificateFieldOptionMasterService.deleteCertificateFieldOption(
        id,
      );
    if (!ok) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Certificate field option ${id} not found`,
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
          "Certificate field option deleted",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}
