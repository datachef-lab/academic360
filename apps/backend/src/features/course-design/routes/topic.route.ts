import express from "express";
import { createTopicHandler, deleteTopicHandler, getAllTopicsHandler, getTopicByIdHandler, updateTopicHandler } from "../../course-design/controllers/topic.controller.js";
// import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();
// router.use(verifyJWT);
router.post("/", createTopicHandler);
router.get("/", getAllTopicsHandler);
router.get("/query", (req, res, next) => {
    const { id } = req.query;
    if (id) {
        getTopicByIdHandler(req, res, next);
    } else {
        getAllTopicsHandler(req, res, next);
    }
});
// router.put("/query", updateTopicHandler);
// router.delete("/query", deleteTopicHandler);

export default router; 