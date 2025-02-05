import { verifyJWT } from "@/middlewares/verifyJWT.ts";
import express from "express";
import { createAcademicHistory, deleteAcademicHistory, getAcademicHistory, getAllAcademicHistory, updateAcademicHistory } from "../controllers/academicHistory.controller.ts";

const router = express.Router();
router.use(verifyJWT);
router.post("/",createAcademicHistory);
router.get("/",getAllAcademicHistory);
router.get("/query",(req,res,next)=>{
    const {id}=req.query;
    console.log(id);
    if(id){
        getAcademicHistory(req,res,next);
    }else{
        getAllAcademicHistory(req,res,next);
    }
});
router.put("/:id",updateAcademicHistory);
router.delete("/:id",deleteAcademicHistory);

export default router;