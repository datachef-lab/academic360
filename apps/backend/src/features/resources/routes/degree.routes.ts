
    import express from "express";
import { createDegree, deleteDegree, getAllDegree, updateDegree } from "@/features/resources/controllers/degree.controller.js";
  
    
    const router = express.Router();
    
    
    router.post("/", createDegree);
    router.get("/", getAllDegree);
    router.put("/", updateDegree);
    router.delete("/", deleteDegree);
    
    export default router;
    