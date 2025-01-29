
import express from "express";
import { createAcademicIdentifier, deleteAcademicIdentifier, getAcademicIdentifier, getAllAcademicIdentifier, updateAcademicIdentifier } from "../controllers/academicIdentifier.controller.ts";

const router = express.Router();
router.post("/",createAcademicIdentifier);
router.get("/",getAllAcademicIdentifier);
router.get("/query",(req,res,next)=>{
    const {id}=req.query;
    console.log(id);
    if(id){
        getAcademicIdentifier(req,res,next);
    }else{
        getAllAcademicIdentifier(req,res,next);
    }
});
router.put("/:id",updateAcademicIdentifier);
router.delete("/:id",deleteAcademicIdentifier);

export default router;