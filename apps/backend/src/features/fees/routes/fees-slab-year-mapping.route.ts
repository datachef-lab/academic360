import { Router } from "express";
import { getFeesSlabYearMappingsHandler, getFeesSlabYearMappingByIdHandler, createFeesSlabYearMappingHandler, updateFeesSlabYearMappingHandler, deleteFeesSlabYearMappingHandler } from "../controllers/fees-slab-year-mapping.controller.js";

const feesSlabYearMappingRouter = Router();

feesSlabYearMappingRouter.get("/", getFeesSlabYearMappingsHandler);
feesSlabYearMappingRouter.get("/:id", getFeesSlabYearMappingByIdHandler);
feesSlabYearMappingRouter.post("/", createFeesSlabYearMappingHandler);
feesSlabYearMappingRouter.put("/:id", updateFeesSlabYearMappingHandler);
feesSlabYearMappingRouter.delete("/:id", deleteFeesSlabYearMappingHandler);

export default feesSlabYearMappingRouter;
