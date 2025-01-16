import express from "express";
import { getStreams, createStream, deleteStream, updateStream } from "@/features/academics/controllers/stream.controller.js";

const router = express.Router();

router.get("/", getStreams);

router.post("/", createStream);

router.put('/:id', updateStream);

router.delete('/:id', deleteStream);


export default router;

