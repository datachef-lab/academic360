// import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import { createEmergencyContact, getEmergencyContactById, getEmergencyContactByStudentId, updateEmergencyContact } from "../controllers/emergencyContact.controller.js";
import { getAddressById } from "../controllers/address.controller.js";

const router = express.Router();

// router.use(verifyJWT);
router.post("/", createEmergencyContact);

router.get("/query", (req, res, next) => {
    const { id, studentId  } = req.query;
    console.log(id);
    if (id) {
        getEmergencyContactById(req,res,next);
    }else if( studentId ){
        getEmergencyContactByStudentId(req,res,next);

    } else {
        next();
    }
});

router.put("/:id", updateEmergencyContact);

export default router;