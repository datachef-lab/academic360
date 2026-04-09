import { NextFunction, Request, Response } from "express";
import {
  findAll,
  findById,
  findByIdOrName,
  getSettingFileService,
  save,
  SETTINGS_STORAGE_PATH,
} from "../service/settings.service.js";
import { settingsVariantEnum } from "@repo/db/schemas/enums";
import { handleError } from "@/utils/handleError.js";
import { ApiResponse } from "@/utils/index.js";
import { Settings } from "@repo/db/schemas/models/app";
import path from "path";
import fs from "fs";

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
    if (!req.params.id) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            "id required for fetching setting",
          ),
        );
      return;
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
    const body = req.body as Record<string, string | undefined>;

    const settingData: Partial<Settings> & { file?: Express.Multer.File } = {};
    if (file) settingData.file = file;
    if (body.value !== undefined && body.value !== null) {
      settingData.value = body.value;
    }
    for (const key of ["name", "type", "variant"] as const) {
      const v = body[key];
      if (v !== undefined && v !== null && v !== "") {
        (settingData as Record<string, string>)[key] = v;
      }
    }

    if (!file && Object.keys(settingData).length === 0) {
      res
        .status(400)
        .json(
          new ApiResponse(
            400,
            "BAD_REQUEST",
            "No fields to update (send value or file)",
          ),
        );
      return;
    }

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

    const filePath = path.join(SETTINGS_STORAGE_PATH, setting.value);

    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json(new ApiResponse(404, "NOT_FOUND", "File not found on server"));
    }

    return res.sendFile(filePath);
  } catch (error) {
    handleError(error, res, next);
  }
};

export async function getSettingFileController(req: Request, res: Response) {
  try {
    const { idOrName } = req.params;
    const fileStreamData = await getSettingFileService(idOrName as string);

    if (!fileStreamData) {
      res.status(404).json({ message: "Setting file not found" });
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
