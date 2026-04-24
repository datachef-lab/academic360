import { NextFunction, Request, Response } from "express";
import { createCareerProgressionFormSchema } from "@repo/db/schemas";
import { ApiResponse, handleError } from "@/utils/index.js";
import * as careerProgressionFormService from "../services/career-progression-form.service.js";
import {
  findAcademicYearById,
  findCurrentAcademicYear,
} from "../services/academic-year.service.js";
import { db } from "@/db/index.js";
import { careerProgressionFormModel } from "@repo/db/schemas";
import { and, eq } from "drizzle-orm";
import { listCertificateMastersWithFields } from "../services/default-certificate-master-loader.service.js";

export async function getAllCareerProgressionFormsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentIdRaw = req.query.studentId;
    let studentId: number | undefined;
    if (studentIdRaw != null && studentIdRaw !== "") {
      studentId = parseInt(String(studentIdRaw), 10);
      if (Number.isNaN(studentId)) {
        res
          .status(400)
          .json(
            new ApiResponse(
              400,
              "BAD_REQUEST",
              null,
              "Invalid studentId query parameter",
            ),
          );
        return;
      }
    }

    let academicYearId: number | undefined;
    const ayRaw = req.query.academicYearId;
    if (ayRaw != null && String(ayRaw).trim() !== "") {
      const p = parseInt(String(ayRaw), 10);
      if (!Number.isNaN(p)) {
        academicYearId = p;
      }
    }

    const pageRaw = req.query.page;
    const pageSizeRaw = req.query.pageSize;
    const usePagination =
      pageRaw != null &&
      String(pageRaw).trim() !== "" &&
      pageSizeRaw != null &&
      String(pageSizeRaw).trim() !== "";

    if (usePagination) {
      const page = Math.max(1, parseInt(String(pageRaw), 10));
      const pageSize = Math.min(
        100,
        Math.max(1, parseInt(String(pageSizeRaw), 10)),
      );
      if (Number.isNaN(page) || Number.isNaN(pageSize)) {
        res
          .status(400)
          .json(
            new ApiResponse(
              400,
              "BAD_REQUEST",
              null,
              "Invalid page or pageSize query parameter",
            ),
          );
        return;
      }

      const result =
        await careerProgressionFormService.findCareerProgressionFormsPaginated({
          page,
          pageSize,
          studentId,
          academicYearId,
        });

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            result,
            "Career progression forms fetched (paginated)",
          ),
        );
      return;
    }

    const rows =
      await careerProgressionFormService.findAllCareerProgressionForms(
        studentId,
        academicYearId,
      );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          rows,
          "Career progression forms fetched",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getCareerProgressionFormByIdHandler(
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
      await careerProgressionFormService.findCareerProgressionFormById(id);
    if (!row) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Career progression form ${id} not found`,
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
          "Career progression form retrieved",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function createCareerProgressionFormHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = createCareerProgressionFormSchema.parse(req.body);
    const created =
      await careerProgressionFormService.createCareerProgressionForm(parsed);

    if (!created) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Invalid certificate master, academic year, or student",
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
          "Career progression form created",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function updateCareerProgressionFormHandler(
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

    const partialSchema = createCareerProgressionFormSchema.partial();
    const parsed = partialSchema.parse(req.body);

    const updated =
      await careerProgressionFormService.updateCareerProgressionForm(
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
            `Career progression form ${id} not found or invalid payload`,
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
          "Career progression form updated",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function deleteCareerProgressionFormHandler(
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
      await careerProgressionFormService.deleteCareerProgressionForm(id);
    if (!ok) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            `Career progression form ${id} not found`,
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
          "Career progression form deleted",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function getCareerProgressionTemplateForStudentCurrentYearHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentId = parseInt(req.params.studentId as string, 10);
    if (Number.isNaN(studentId)) {
      res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid studentId"));
      return;
    }

    const ayParam = req.query.academicYearId;
    let ay: Awaited<ReturnType<typeof findAcademicYearById>> = null;
    if (ayParam != null && String(ayParam).trim() !== "") {
      const parsed = parseInt(String(ayParam), 10);
      if (!Number.isNaN(parsed)) {
        ay = await findAcademicYearById(parsed);
      }
    }
    if (!ay) {
      ay = await findCurrentAcademicYear();
    }
    if (!ay) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "No current academic year"),
        );
      return;
    }

    const academicYearId = Number(ay.id);
    if (Number.isNaN(academicYearId)) {
      res
        .status(500)
        .json(
          new ApiResponse(
            500,
            "ERROR",
            null,
            "Invalid current academic year id",
          ),
        );
      return;
    }

    const existing = await db
      .select({ id: careerProgressionFormModel.id })
      .from(careerProgressionFormModel)
      .where(
        and(
          eq(careerProgressionFormModel.studentId, studentId),
          eq(careerProgressionFormModel.academicYearId, academicYearId),
        ),
      )
      .limit(1);

    const certificateMasters = await listCertificateMastersWithFields();

    res.status(200).json(
      new ApiResponse(
        200,
        "SUCCESS",
        {
          academicYear: ay,
          hasExistingForms: existing.length > 0,
          certificateMasters,
        },
        "Career progression template fetched",
      ),
    );
  } catch (error) {
    handleError(error, res, next);
  }
}

export async function submitCareerProgressionForStudentCurrentYearHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const studentId = parseInt(req.params.studentId as string, 10);
    if (Number.isNaN(studentId)) {
      res
        .status(400)
        .json(new ApiResponse(400, "BAD_REQUEST", null, "Invalid studentId"));
      return;
    }

    const bodyAy = req.body?.academicYearId;
    let targetAcademicYearId: number | undefined;
    if (bodyAy != null && String(bodyAy).trim() !== "") {
      const parsed = parseInt(String(bodyAy), 10);
      if (!Number.isNaN(parsed)) {
        const y = await findAcademicYearById(parsed);
        if (y?.id != null) targetAcademicYearId = Number(y.id);
      }
    }
    if (targetAcademicYearId == null) {
      const ay = await findCurrentAcademicYear();
      if (!ay?.id) {
        res
          .status(404)
          .json(
            new ApiResponse(404, "NOT_FOUND", null, "No current academic year"),
          );
        return;
      }
      targetAcademicYearId = Number(ay.id);
    }

    const certificates = Array.isArray(req.body?.certificates)
      ? req.body.certificates
      : [];

    const submitted =
      await careerProgressionFormService.submitCareerProgressionFormForCurrentYear(
        {
          studentId,
          academicYearId: targetAcademicYearId,
          certificates,
        },
      );

    if (!submitted) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            null,
            "Failed to submit career progression form",
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
          submitted,
          "Career progression form submitted successfully",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
}
