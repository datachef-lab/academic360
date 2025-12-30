import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as feeStructureService from "../services/fee-structure.service.js";
import {
  FeeStructure,
  createFeeStructureSchema,
} from "@repo/db/schemas/models/fees";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/ApiResonse.js";

function toDate(val: unknown): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val === "string" || typeof val === "number") return new Date(val);
  return null;
}

function convertDates(obj: Partial<FeeStructure> | Record<string, unknown>) {
  const dateFields = [
    "startDate",
    "endDate",
    "closingDate",
    "onlineStartDate",
    "onlineEndDate",
    "createdAt",
    "updatedAt",
  ] as const;
  const objRecord = obj as Record<string, unknown>;
  for (const f of dateFields) {
    const value = objRecord[f];
    if (value) {
      objRecord[f] = toDate(value);
    }
  }
}

export const createFeeStructure = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parse = createFeeStructureSchema.safeParse(
      req.body as z.input<typeof createFeeStructureSchema>,
    );
    if (!parse.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parse.error.flatten()),
          ),
        );
      return;
    }
    const body = parse.data as Omit<FeeStructure, "id">;
    convertDates(body);
    const created = await feeStructureService.createFeeStructure(
      body as Omit<FeeStructure, "id" | "createdAt" | "updatedAt">,
    );
    if (!created) {
      res
        .status(400)
        .json(
          new ApiResponse(400, "ERROR", null, "Failed to create fee structure"),
        );
      return;
    }
    res
      .status(201)
      .json(new ApiResponse(201, "CREATED", created, "Fee structure created"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllFeeStructures = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const all = await feeStructureService.getAllFeeStructures();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", all, "Fetched fee structures"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getFeeStructureById = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const found = await feeStructureService.getFeeStructureById(id);
    if (!found) {
      res
        .status(404)
        .json(
          new ApiResponse(404, "NOT_FOUND", null, "Fee structure not found"),
        );
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", found, "Fetched fee structure"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateFeeStructure = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const partialSchema = createFeeStructureSchema.partial();
    const parse = partialSchema.safeParse(
      req.body as z.input<typeof partialSchema>,
    );
    if (!parse.success) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "VALIDATION_ERROR",
            null,
            JSON.stringify(parse.error.flatten()),
          ),
        );
      return;
    }
    const body = parse.data as Partial<FeeStructure>;
    convertDates(body);
    const updated = await feeStructureService.updateFeeStructure(id, body);
    if (!updated) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Fee structure not found or update failed",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "UPDATED", updated, "Fee structure updated"));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const deleteFeeStructure = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res
        .status(400)
        .json(new ApiResponse(400, "INVALID_ID", null, "Invalid ID format"));
      return;
    }
    const deleted = await feeStructureService.deleteFeeStructure(id);
    if (!deleted) {
      res
        .status(404)
        .json(
          new ApiResponse(
            404,
            "NOT_FOUND",
            null,
            "Fee structure not found or delete failed",
          ),
        );
      return;
    }
    res
      .status(200)
      .json(new ApiResponse(200, "DELETED", deleted, "Fee structure deleted"));
  } catch (error) {
    handleError(error, res, next);
  }
};
// import { Request, Response } from "express";
// import {
//   getFeesStructures,
//   getFeesStructureById,
//   createFeesStructure,
//   updateFeesStructure,
//   deleteFeesStructure,
//   getAcademicYearsFromFeesStructures,
//   getCoursesFromFeesStructures,
//   getFeesStructuresByAcademicYearIdAndCourseId,
//   checkFeesStructureExists,
// } from "../services/fee-structure.service.js";
// import { handleError } from "@/utils/index.js";

// function toDate(val: any): Date | null {
//   if (!val) return null;
//   if (val instanceof Date) return val;
//   if (typeof val === "string" || typeof val === "number") return new Date(val);
//   return val;
// }

// function convertAllDates(obj: Record<string, any>, dateFields: string[]): void {
//   for (const field of dateFields) {
//     if (obj[field]) obj[field] = toDate(obj[field]);
//   }
// }

// export const getFeesStructuresHandler = async (req: Request, res: Response) => {
//   try {
//     console.log("here");
//     const feesStructures = await getFeesStructures();
//     if (feesStructures === null) {
//       handleError(new Error("Error fetching fees structures"), res);
//       return;
//     }
//     res.status(200).json(feesStructures);
//   } catch (error) {
//     handleError(error, res);
//   }
// };

// export const getFeesStructureByIdHandler = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const id = parseInt(req.params.id);
//     const feesStructure = await getFeesStructureById(id);
//     if (feesStructure === null) {
//       handleError(new Error("Error fetching fees structure"), res);
//       return;
//     }
//     if (!feesStructure) {
//       res.status(404).json({ message: "Fees structure not found" });
//       return;
//     }
//     res.status(200).json(feesStructure);
//   } catch (error) {
//     handleError(error, res);
//   }
// };

// export const createFeesStructureHandler = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const body = req.body;
//     const dateFields = [
//       "startDate",
//       "endDate",
//       "closingDate",
//       "onlineStartDate",
//       "onlineEndDate",
//       "instalmentStartDate",
//       "instalmentEndDate",
//       "createdAt",
//       "updatedAt",
//     ];
//     convertAllDates(body, dateFields);
//     if (Array.isArray(body.components)) {
//       for (const comp of body.components) {
//         convertAllDates(comp, ["createdAt", "updatedAt"]);
//       }
//     }
//     const newFeesStructure = await createFeesStructure(body);
//     if (newFeesStructure === null) {
//       handleError(new Error("Error creating fees structure"), res);
//       return;
//     }
//     res.status(201).json(newFeesStructure);
//   } catch (error) {
//     handleError(error, res);
//   }
// };

// export const updateFeesStructureHandler = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const id = parseInt(req.params.id);
//     const body = req.body;
//     const dateFields = [
//       "startDate",
//       "endDate",
//       "closingDate",
//       "onlineStartDate",
//       "onlineEndDate",
//       "instalmentStartDate",
//       "instalmentEndDate",
//       "createdAt",
//       "updatedAt",
//     ];
//     convertAllDates(body, dateFields);
//     if (Array.isArray(body.components)) {
//       for (const comp of body.components) {
//         convertAllDates(comp, ["createdAt", "updatedAt"]);
//       }
//     }
//     const updatedFeesStructure = await updateFeesStructure(id, body);
//     if (updatedFeesStructure === null) {
//       handleError(new Error("Error updating fees structure"), res);
//       return;
//     }
//     if (!updatedFeesStructure) {
//       res.status(404).json({ message: "Fees structure not found" });
//       return;
//     }
//     res.status(200).json(updatedFeesStructure);
//   } catch (error) {
//     handleError(error, res);
//   }
// };

// export const deleteFeesStructureHandler = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const id = parseInt(req.params.id);
//     const deletedFeesStructure = await deleteFeesStructure(id);
//     if (deletedFeesStructure === null) {
//       handleError(new Error("Error deleting fees structure"), res);
//       return;
//     }
//     if (!deletedFeesStructure) {
//       res.status(404).json({ message: "Fees structure not found" });
//       return;
//     }
//     res.status(200).json(deletedFeesStructure);
//   } catch (error) {
//     handleError(error, res);
//   }
// };

// export const getAcademicYearsFromFeesStructuresHandler = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const academicYears = await getAcademicYearsFromFeesStructures();
//     res.status(200).json(academicYears);
//   } catch (error) {
//     handleError(error, res);
//   }
// };

// export const getCoursesFromFeesStructuresHandler = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const academicYearId = parseInt(req.params.academicYearId);
//     const courses = await getCoursesFromFeesStructures(academicYearId);
//     res.status(200).json(courses);
//   } catch (error) {
//     handleError(error, res);
//   }
// };

// export const getFeesStructuresByAcademicYearIdAndCourseIdHandler = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const academicYearId = parseInt(req.params.academicYearId);
//     const courseId = parseInt(req.params.courseId);
//     const feesStructures = await getFeesStructuresByAcademicYearIdAndCourseId(
//       academicYearId,
//       courseId,
//     );
//     res.status(200).json(feesStructures);
//   } catch (error) {
//     handleError(error, res);
//   }
// };

// // export const getFeesDesignAbstractLevelHandler = async (req: Request, res: Response) => {
// //     try {
// //         const academicYearId = req.query.academicYearId ? parseInt(req.query.academicYearId as string) : undefined;
// //         const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
// //         const abstractLevel = await getFeesDesignAbstractLevel(academicYearId, courseId);
// //         res.status(200).json(abstractLevel);
// //     } catch (error) {
// //         handleError(error, res);
// //     }
// // };

// export const checkFeesStructureExistsHandler = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const { academicYearId, courseId, semester, shiftId, feesReceiptTypeId } =
//       req.body;
//     if (
//       academicYearId == null ||
//       courseId == null ||
//       semester == null ||
//       shiftId == null ||
//       feesReceiptTypeId == null
//     ) {
//       res.status(400).json({ error: "Missing required fields" });
//       return;
//     }
//     const exists = await checkFeesStructureExists(
//       Number(academicYearId),
//       Number(courseId),
//       Number(semester),
//       Number(shiftId),
//       Number(feesReceiptTypeId),
//     );
//     res.status(200).json({ exists });
//   } catch (error) {
//     handleError(error, res);
//   }
// };
