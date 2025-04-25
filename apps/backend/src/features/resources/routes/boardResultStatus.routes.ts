import express from "express";
import { createBoardResultStatus, getBoardResultStatusById, updateBoardResultStatus } from "../controllers/boardResultStatus.controller";

const router = express.Router();

router.post("/", createBoardResultStatus);


router.get("/query", getBoardResultStatusById);

router.put("/:id", updateBoardResultStatus);



export default router;
