import express from "express";
import { verifyJWT } from "@/middlewares/index.js";
import {
  createIssueController,
  createSubscriptionController,
  deleteIssueController,
  deleteSubscriptionController,
  getSubscription,
  listIssues,
  listMissingIssuesController,
  listSubscriptions,
  runIssuePredictorController,
  updateIssueController,
  updateSubscriptionController,
} from "@/features/library/controllers/journal-subscription.controller.js";

const router = express.Router();
router.use(verifyJWT);
router.get("/missing-issues", listMissingIssuesController);
router.post("/run-predictor", runIssuePredictorController);
router.get("/", listSubscriptions);
router.get("/:id", getSubscription);
router.post("/", createSubscriptionController);
router.put("/:id", updateSubscriptionController);
router.delete("/:id", deleteSubscriptionController);
router.get("/:subscriptionId/issues", listIssues);
router.post("/:subscriptionId/issues", createIssueController);
router.put("/issues/:id", updateIssueController);
router.delete("/issues/:id", deleteIssueController);
export default router;
