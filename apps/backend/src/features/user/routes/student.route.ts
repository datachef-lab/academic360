<<<<<<< HEAD
// import { verifyJWT } from "@/middlewares/verifyJWT.ts";
=======
import { verifyJWT } from "@/middlewares/verifyJWT.js";
>>>>>>> 90004db6fb605e03f0ecb8df3be32b6658a1417b
import express from "express";
import { createOldStudent } from "../controllers/oldStudent.controller.js";

const router = express.Router();

// router.use(verifyJWT);

router.get("/old-data", createOldStudent);

export default router;