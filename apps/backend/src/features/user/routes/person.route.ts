import { verifyJWT } from "@/middlewares/verifyJWT.js";
import express from "express";
import { getPersonById } from "../controllers/person.controller";

const router = express.Router();

router.use(verifyJWT);

router.get("/:id", getPersonById);
export default router;