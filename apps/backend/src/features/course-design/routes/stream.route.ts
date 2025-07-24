import express from "express";
import { createStreamHandler, deleteStreamHandler, getAllStreamsHandler, getStreamByIdHandler, updateStreamHandler } from "../controllers/stream.controller.js";
// import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();
// router.use(verifyJWT);
router.post("/", createStreamHandler);
router.get("/", getAllStreamsHandler);
router.get("/query", (req, res, next) => {
    const { id } = req.query;
    if (id) {
        getStreamByIdHandler(req, res, next);
    } else {
        getAllStreamsHandler(req, res, next);
    }
});
// router.put("/query", updateStreamHandler);
// router.delete("/query", deleteStreamHandler);

export default router; 