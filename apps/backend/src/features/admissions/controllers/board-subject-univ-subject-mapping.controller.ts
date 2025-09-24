import { Request, Response, NextFunction, Router } from "express";
import { ApiResponse } from "@/utils/ApiResonse.js";
import { handleError } from "@/utils/handleError.js";
import * as service from "../services/board-subject-univ-subject-mapping.service.js";

const router = Router();

router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.listMappings();
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", data, "Mappings fetched"));
  } catch (error) {
    handleError(error, res, next);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const data = await service.getMappingById(id);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", data, "Mapping fetched"));
  } catch (error) {
    handleError(error, res, next);
  }
});

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await service.createMapping(req.body);
    res
      .status(201)
      .json(new ApiResponse(201, "SUCCESS", created, "Mapping created"));
  } catch (error) {
    handleError(error, res, next);
  }
});

router.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const updated = await service.updateMapping(id, req.body);
    res
      .status(200)
      .json(new ApiResponse(200, "SUCCESS", updated, "Mapping updated"));
  } catch (error) {
    handleError(error, res, next);
  }
});

router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const deleted = await service.deleteMapping(id);
      res
        .status(200)
        .json(new ApiResponse(200, "SUCCESS", deleted, "Mapping deleted"));
    } catch (error) {
      handleError(error, res, next);
    }
  },
);

export default router;
