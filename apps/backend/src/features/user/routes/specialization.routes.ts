// import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import { createSpecialization, deleteSpecialization, getAllSpecializations, getSpecializationById, updateSpecialization } from "../controllers/specialization.controller";

const router = express.Router();
// router.use(verifyJWT);
router.post("/", createSpecialization);
router.get("/", getAllSpecializations);
router.get("/query", (req, res, next) => {
    const { id ,studentId} = req.query;
    console.log(id);
    if (id) {
        getSpecializationById(req, res, next);
    }
   else {
        getAllSpecializations(req, res, next);
    }
});
router.put("/query", updateSpecialization);
router.delete("/query", deleteSpecialization);

export default router;