import { Router } from "express";
import { getFeesStructuresHandler, getFeesStructureByIdHandler, createFeesStructureHandler, updateFeesStructureHandler, deleteFeesStructureHandler } from "../controllers/fees-structure.controller.js";

const feesStructureRouter = Router();

feesStructureRouter.get("/", getFeesStructuresHandler);
feesStructureRouter.get("/:id", getFeesStructureByIdHandler);
feesStructureRouter.post("/", createFeesStructureHandler);
feesStructureRouter.put("/:id", updateFeesStructureHandler);
feesStructureRouter.delete("/:id", deleteFeesStructureHandler);

export default feesStructureRouter;
