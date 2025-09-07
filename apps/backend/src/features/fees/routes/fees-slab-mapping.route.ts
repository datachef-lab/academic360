import { Router } from "express";
import {
  getFeesSlabYearMappingsHandler,
  getFeesSlabYearMappingByIdHandler,
  createFeesSlabYearMappingHandler,
  updateFeesSlabYearMappingHandler,
  deleteFeesSlabYearMappingHandler,
  checkSlabsExistForAcademicYearHandler,
} from "../controllers/fees-slab-mapping.controller.js";

const feesSlabYearMappingRouter = Router();

// Add the check-exist route (removed the extra 's')
feesSlabYearMappingRouter.get(
  "/check-exist/:feesStructureId",
  checkSlabsExistForAcademicYearHandler,
);

feesSlabYearMappingRouter.get("/", getFeesSlabYearMappingsHandler);
feesSlabYearMappingRouter.get("/:id", getFeesSlabYearMappingByIdHandler);
feesSlabYearMappingRouter.post("/", createFeesSlabYearMappingHandler);
feesSlabYearMappingRouter.put("/:id", updateFeesSlabYearMappingHandler);
feesSlabYearMappingRouter.delete("/:id", deleteFeesSlabYearMappingHandler);

export default feesSlabYearMappingRouter;
