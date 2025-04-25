
    import express from "express";
import { createDegree, deleteDegree, getAllDegree, updateDegree } from "@/features/resources/controllers/degree.controller.js";
  
    
    const router = express.Router();
    
    
    router.post("/", createDegree);
    router.get("/", getAllDegree);
    router.put("/:id", updateDegree);
    router.delete("/:id", deleteDegree);
    
    export default router;
    