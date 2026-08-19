import { NextFunction, Request, Response } from "express";
import {
  findAll,
  findBranding,
  findById,
  findByIdOrName,
  getSettingFileService,
  resolvePublicApiBase,
  save,
} from "../service/settings.service.js";
import { settingsVariantEnum } from "@repo/db/schemas/enums";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/index.js";
import { Settings } from "@repo/db/schemas/models/app";

export const getBrandingHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const publicApiBase = resolvePublicApiBase(req);
    const branding = await findBranding(publicApiBase);

    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).json(new ApiResponse(200, "OK", branding));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getAllSettingsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const settings = await findAll(
      req.query.variant as (typeof settingsVariantEnum.enumValues)[number],
    );
    res.status(200).json(new ApiResponse(200, "OK", settings));
  } catch (error) {
    handleError(error, res, next);
  }
};

export const getSettingsByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.params.id) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            "id required for fetching setiing",
          ),
        );
    }
    const settings = await findById(Number(req.params.id));
    if (!settings || settings.length === 0) {
      res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", "Setting not found"));
      return;
    }
    res.status(200).json(settings);
  } catch (error) {
    handleError(error, res, next);
  }
};

export const updateSettingByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id;

    if (!id) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            "ID is required for updating setting",
          ),
        );
      return;
    }

    const file = req.file; // multer handles this
    const body = req.body;

    // Construct a Settings object from body
    const settingData: Partial<Settings> & { file?: Express.Multer.File } = {
      name: body.name,
      value: body.value,
      type: body.type,
      variant: body.variant,
      file,
    };

    const [updated] = await save(
      Number(id),
      settingData as Settings & { file?: Express.Multer.File },
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          "SUCCESS",
          updated,
          "Setting updated successfully",
        ),
      );
    return;
  } catch (error) {
    handleError(error, res, next);
  }
};

export const downloadSettingFileHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { idOrName } = req.params;

    if (!idOrName) {
      return res
        .status(400)
        .json(
          new ApiResponse(400, "BAD_REQUEST", "Setting ID or name required"),
        );
    }

    const setting = await findByIdOrName(idOrName as string);

    if (!setting) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", "Setting not found"));
    }

    if (setting.type !== "FILE" || !setting.value) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            "Setting is not a file type or value is empty",
          ),
        );
    }

    const fileStreamData = await getSettingFileService(String(setting.id));
    if (!fileStreamData) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", "File not found on server"));
    }

    // This caller never sends If-None-Match, so notModified cannot occur here;
    // the guard keeps the union types honest.
    if ("notModified" in fileStreamData) {
      return res.status(304).end();
    }
    const { stream, contentType } = fileStreamData;
    res.setHeader("Content-Type", contentType);
    return stream.pipe(res);
  } catch (error) {
    handleError(error, res, next);
  }
};

export async function getSettingFileController(req: Request, res: Response) {
  try {
    const { idOrName } = req.params;
    const ifNoneMatch = req.headers["if-none-match"];
    const fileStreamData = await getSettingFileService(
      idOrName as string,
      typeof ifNoneMatch === "string" ? ifNoneMatch : undefined,
    );

    if (!fileStreamData) {
      res.status(404).json({ message: "Setting file not found" });
      return;
    }

    // Cache-Control is identical for the 304 and 200 paths so the browser
    // keeps its cached copy after revalidating.
    const cacheControl = req.query.v
      ? "public, max-age=31536000, immutable"
      : "public, max-age=3600";
    res.setHeader("ETag", fileStreamData.etag);
    res.setHeader("Cache-Control", cacheControl);

    // Repeat request with a matching validator — skip the S3 fetch and the
    // (potentially multi-MB) body entirely.
    if ("notModified" in fileStreamData) {
      res.status(304).end();
      return;
    }

    const { stream, contentType } = fileStreamData;
    res.setHeader("Content-Type", contentType);
    stream.pipe(res);
  } catch (error) {
    console.error("Error sending file:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
