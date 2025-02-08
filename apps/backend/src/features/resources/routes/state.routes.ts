import express from "express";
import { verifyJWT } from "@/middlewares/verifyJWT.js";
import { createState, deleteStateRecord, getAllState, updateStateRecord } from "../controllers/state.controller.js";


const router = express.Router();
router.use(verifyJWT);

router.post("/", createState);
router.get("/", getAllState);
router.put("/", updateStateRecord);
router.delete("/", deleteStateRecord);

export default router;
