import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";

const router = express.Router();

router.use(verifyJWT);


export default router;