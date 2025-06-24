import { Router } from "express";
import { getFeesSlabsHandler, getFeesSlabByIdHandler, createFeesSlabHandler, updateFeesSlabHandler, deleteFeesSlabHandler } from "../controllers/fees-slab.controller.js";

const feesSlabRouter = Router();

feesSlabRouter.get("/", getFeesSlabsHandler);
feesSlabRouter.get("/:id", getFeesSlabByIdHandler);
feesSlabRouter.post("/", createFeesSlabHandler);
feesSlabRouter.put("/:id", updateFeesSlabHandler);
feesSlabRouter.delete("/:id", deleteFeesSlabHandler);

export default feesSlabRouter;
