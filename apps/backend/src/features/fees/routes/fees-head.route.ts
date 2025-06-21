import { Router } from "express";
import { getFeesHeadsHandler, getFeesHeadByIdHandler, createFeesHeadHandler, updateFeesHeadHandler, deleteFeesHeadHandler } from "../controllers/fees-head.controller.js";

const feesHeadRouter = Router();

feesHeadRouter.get("/", getFeesHeadsHandler);
feesHeadRouter.get("/:id", getFeesHeadByIdHandler);
feesHeadRouter.post("/", createFeesHeadHandler);
feesHeadRouter.put("/:id", updateFeesHeadHandler);
feesHeadRouter.delete("/:id", deleteFeesHeadHandler);

export default feesHeadRouter;
