import { verifyJWT } from "@/middlewares/verifyJWT.ts";
import express from "express";

const router = express.Router();

router.use(verifyJWT);

export default router;