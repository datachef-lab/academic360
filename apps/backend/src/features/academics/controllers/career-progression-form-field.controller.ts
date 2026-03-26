import { NextFunction, Request, Response } from "express";
import { createCareerProgressionFormFieldSchema } from "@repo/db/schemas";
import { ApiResponse, handleError } from "@/utils/index.js";
import * as careerProgressionFormFieldService from "../services/career-progression-form-field.service.js";

export async function getAllCareerProgressionFormFieldsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const formIdRaw = req.query.careerProgressionFormId;
    if (formIdRaw != null && formIdRaw !== "") {
      const formId = parseInt(String(formIdRaw), 10);
      if (Number.isNaN(formId)) {
        res
          .status(400)
          .json(
            new ApiResponse(
              400,
              "BAD_REQUEST",
              null,
              "Invalid careerProgressionFormId query parameter",
            ),
          );
        return;
      }
      const rows =
        await careerProgressionFormFieldService.findCareerProgressionFormFieldsByFormId(
          formId,
        );
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            rows,
            "Career progression form fields fetched",
          ),
        );
      return;
    }

    const rows =
      await careerProgressionFormFieldService.findAllCareerProgressionFormFields();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "All career progression form fields fetched",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getCareerProgressionFormFieldByIdHandler(
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
      await careerProgressionFormFieldService.findCareerProgressionFormFieldById(
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
            `Career progression form field ${id} not found`,
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
          "Career progression form field retrieved",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function createCareerProgressionFormFieldHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createCareerProgressionFormFieldSchema.parse(req.body);
    const created =
      await careerProgressionFormFieldService.createCareerProgressionFormField(
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
            "Invalid form, field master, or option; could not create record",
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
          "Career progression form field created",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updateCareerProgressionFormFieldHandler(
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

    const partialSchema = createCareerProgressionFormFieldSchema.partial();
    const parsed = partialSchema.parse(req.body);

    const updated =
      await careerProgressionFormFieldService.updateCareerProgressionFormField(
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
            `Career progression form field ${id} not found or invalid payload`,
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
          "Career progression form field updated",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function deleteCareerProgressionFormFieldHandler(
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
      await careerProgressionFormFieldService.deleteCareerProgressionFormField(
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
            `Career progression form field ${id} not found`,
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
          "Career progression form field deleted",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}
