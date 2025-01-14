import express from "express";
import { getStreams, createStream } from "@/features/academics/controllers/stream.controller.js";

const router = express.Router();

router.get("/",getStreams);
router.post("/",createStream);


export default router;



