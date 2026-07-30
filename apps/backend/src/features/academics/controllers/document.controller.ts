import { handleError } from "@/utils/handleError.js";
import { NextFunction, Request, Response } from "express";
import {
  createDocumentTypeModel,
  documentTypeModel,
} from "@repo/db/schemas/models/documents";
import { db } from "@/db/index.js";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { asc, eq } from "drizzle-orm";
import { ApiError } from "@/utils/ApiError.js";
import {
  getFile,
  scanExistingMarksheetFilesByRollNumber,
} from "../services/document.service.js";

function eligibilityRuleError(
  category: string | null | undefined,
  eligibilityRule: string | null | undefined,
): string | null {
  if (eligibilityRule != null && category !== "EXAM_LINKED") {
    return "eligibilityRule can only be set when category is EXAM_LINKED.";
  }
  return null;
}

//createDocumentMetadata
export const createDocumentMetadata = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = createDocumentTypeModel.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(
        new ApiError(
          400,
          "Validation failed",
          parsed.error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`,
          ),
        ),
      );
      return;
    }

    const ruleError = eligibilityRuleError(
      parsed.data.category,
      parsed.data.eligibilityRule,
    );
    if (ruleError) {
      res.status(400).json(new ApiError(400, ruleError));
      return;
    }

    const [newDocumentType] = await db
      .insert(documentTypeModel)
      .values(parsed.data)
      .returning();

    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          "SUCCESS",
          newDocumentType,
          "New Document is added to db!",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

//getAllDocumentsMetadata
export const getAllDocumentsMetadata = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const getAllDocumentsMetadata = await db
      .select()
      .from(documentTypeModel)
      .orderBy(asc(documentTypeModel.sequence), asc(documentTypeModel.name));
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          getAllDocumentsMetadata,
          "All Document fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

//getDocumentMetadataById
export const getDocumentMetadataById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.query;
    console.log(id);
    if (!id) {
      res.status(400).json(new ApiError(400, "Id is required"));
      return;
    }

    const document = await db
      .select()
      .from(documentTypeModel)
      .where(eq(documentTypeModel.id, +id))
      .then((documents) => documents[0]);

    if (!document) {
      res.status(404).json(new ApiError(404, "Document not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          document,
          "Document fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

//getDocumentMetadataByName
export const getDocumentMetadataByName = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name } = req.query;
    console.log(name);
    const document = await db
      .select()
      .from(documentTypeModel)
      .where(eq(documentTypeModel.name, name as string))
      .then((documents) => documents[0]);

    if (!document) {
      res.status(404).json(new ApiError(404, "Document not found"));
      return;
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          document,
          "Document fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

//updateDocumentMetadata
export const updateDocumentMetadata = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    const parsed = createDocumentTypeModel.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json(
        new ApiError(
          400,
          "Validation failed",
          parsed.error.issues.map(
            (issue) => `${issue.path.join(".")}: ${issue.message}`,
          ),
        ),
      );
      return;
    }

    const existingDocument = await db
      .select()
      .from(documentTypeModel)
      .where(eq(documentTypeModel.id, +id))
      .then((documents) => documents[0]);

    if (!existingDocument) {
      res.status(404).json(new ApiError(404, "Document not found"));
      return;
    }

    const effectiveCategory =
      "category" in parsed.data
        ? parsed.data.category
        : existingDocument.category;
    const effectiveEligibilityRule =
      "eligibilityRule" in parsed.data
        ? parsed.data.eligibilityRule
        : existingDocument.eligibilityRule;
    const ruleError = eligibilityRuleError(
      effectiveCategory,
      effectiveEligibilityRule,
    );
    if (ruleError) {
      res.status(400).json(new ApiError(400, ruleError));
      return;
    }

    const updatedDocument = await db
      .update(documentTypeModel)
      .set(parsed.data)
      .where(eq(documentTypeModel.id, +id))
      .returning();

    if (updatedDocument.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            updatedDocument[0],
            "Document updated successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "Document not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

//deleteDocumentMetadata
export const deleteDocumentMetadata = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    console.log(id);
    const deletedDocument = await db
      .delete(documentTypeModel)
      .where(eq(documentTypeModel.id, +id))
      .returning();

    if (deletedDocument.length > 0) {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            "SUCCESS",
            deletedDocument[0],
            "Document deleted successfully!",
          ),
        );
    } else {
      res.status(404).json(new ApiError(404, "Document not found"));
    }
  } catch (error) {
    handleError(error, res, next);
  }
};

//getDocument
export const getDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      res
        .status(400)
        .json(new ApiResponse(400, "ERROR", null, "File path is required."));
      return;
    }

    const fileBuffer = await getFile(filePath);

    if (!fileBuffer) {
      res
        .status(404)
        .json(new ApiResponse(404, "ERROR", null, "File not found."));
      return;
    }

    // Set correct content type for PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${filePath.split("/").pop()}"`,
    );

    res.send(fileBuffer);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getExistingMarksheetFilesByRollNumber = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { framework, stream, rollNumber, semester } = req.body;

    const fileItems = await scanExistingMarksheetFilesByRollNumber({
      framework,
      stream,
      rollNumber,
      semester,
    });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          fileItems,
          "Files fetched successfully.",
        ),
      );
  } catch (error) {
    handleError(error, res, next);
  }
};

//uploadDocument
export const uploadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
  } catch (error) {
    handleError(error, res, next);
  }
};
