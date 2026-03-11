import { Router } from "express";
import {
  searchCandidate,
  distributeAdmitCard,
  getAdmitCardDistributions,
  downloadAdmitCardDistributions,
} from "../controllers/admit-card.controller.js";
import { verifyJWT } from "@/middlewares/verifyJWT.js";

const admitCardRouter = Router();

// Require auth so we can reliably read req.user for distributed_by_user_id_fk
admitCardRouter.use(verifyJWT);

// Base: /api/admit-card
admitCardRouter.get("/search", searchCandidate);
admitCardRouter.post("/distribute", distributeAdmitCard);
admitCardRouter.get("/distributions", getAdmitCardDistributions);
admitCardRouter.get("/distributions/download", downloadAdmitCardDistributions);

export default admitCardRouter;
