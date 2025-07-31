import express from "express";
import { createPaperHandler, deletePaperHandler, getAllPapersHandler, getPaperByIdHandler, updatePaperHandler, updatePaperWithComponentsHandler } from "../../course-design/controllers/paper.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();
router.use(verifyJWT);
router.post("/", createPaperHandler);
router.get("/", getAllPapersHandler);
router.get("/query", (req, res, next) => {
    const { id } = req.query;
    if (id) {
        getPaperByIdHandler(req, res, next);
    } else {
        getAllPapersHandler(req, res, next);
    }
});
router.put("/query", updatePaperHandler);
router.put("/:id/with-components", updatePaperWithComponentsHandler);
router.delete("/query", deletePaperHandler);

export default router; 