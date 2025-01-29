
    import express from "express";
import { createDegree, deleteDegree, getAllDegree, updateDegree } from "../controllers/degree.controller.ts";
  
    
    const router = express.Router();
    
    
    router.post("/", createDegree);
    router.get("/", getAllDegree);
    router.put("/", updateDegree);
    router.delete("/", deleteDegree);
    
    export default router;
    