import { Request, Response, NextFunction } from "express";
import { db } from "@/db/index.js";
import { sectionModel } from "../models/section.model.js";

export const getAllSectionsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sections = await db.select().from(sectionModel);
    res.status(200).json({ payload: sections });
  } catch (error) {
    next(error);
  }
};
