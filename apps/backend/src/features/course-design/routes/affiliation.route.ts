import express from "express";
import { createAffiliationHandler, deleteAffiliationHandler, getAllAffiliationsHandler, getAffiliationByIdHandler, updateAffiliationHandler } from "../../course-design/controllers/affiliation.controller.js";
// import { verifyJWT } from "@/middlewares/verifyJWT.js";

const router = express.Router();
// router.use(verifyJWT);
router.post("/", createAffiliationHandler);
router.get("/", getAllAffiliationsHandler);
router.get("/query", (req, res, next) => {
    const { id } = req.query;
    if (id) {
        getAffiliationByIdHandler(req, res, next);
    } else {
        getAllAffiliationsHandler(req, res, next);
    }
});
// router.put("/query", updateAffiliationHandler);
// router.delete("/query", deleteAffiliationHandler);

export default router; 