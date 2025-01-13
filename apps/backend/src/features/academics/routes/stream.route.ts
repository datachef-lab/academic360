import express from "express";
import { deleteStream, updateStream } from "../controllers/stream.controller.js";

const router = express.Router();

router.put('/:id', updateStream);

router.delete('/:id', deleteStream);

export default router;