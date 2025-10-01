import { Router } from "express";
import { NotificationsController } from "@/controllers/notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.post("/enqueue", NotificationsController.enqueue);
