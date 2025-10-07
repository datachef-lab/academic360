import { Router } from "express";
import { NotificationsController } from "@/controllers/notifications.controller.js";
import { handleError } from "@/utils/handle-error.js";
import { MastersController } from "@/controllers/masters.controller.js";
import { EventsController } from "@/controllers/events.controller.js";
import { NotificationsCrudController } from "@/controllers/notifications-crud.controller.js";

export const notificationsRouter = Router();

notificationsRouter.post("/enqueue", async (req, res) => {
  try {
    await NotificationsController.enqueue(req, res);
  } catch (err) {
    handleError(err, res);
  }
});

// Masters
notificationsRouter.get("/masters", MastersController.list);
notificationsRouter.get("/masters/:id", MastersController.get);
notificationsRouter.post("/masters", MastersController.create);
notificationsRouter.patch("/masters/:id", MastersController.update);
// Master fields
notificationsRouter.get(
  "/masters/:masterId/fields",
  MastersController.listFields,
);
notificationsRouter.post("/masters/fields", MastersController.createField);
notificationsRouter.delete(
  "/masters/fields/:id",
  MastersController.deleteField,
);
// Master meta
notificationsRouter.get("/masters/:masterId/meta", MastersController.listMeta);
notificationsRouter.post("/masters/meta", MastersController.createMeta);
notificationsRouter.patch("/masters/meta/:id", MastersController.updateMeta);
notificationsRouter.delete("/masters/meta/:id", MastersController.deleteMeta);

// Events
notificationsRouter.get("/events", EventsController.list);
notificationsRouter.get("/events/:id", EventsController.get);
notificationsRouter.post("/events", EventsController.create);
notificationsRouter.patch("/events/:id", EventsController.update);

// Notifications + contents + queue (read-only for now)
notificationsRouter.get("/notifications", NotificationsCrudController.list);
notificationsRouter.get("/notifications/:id", NotificationsCrudController.get);
notificationsRouter.get(
  "/notifications/:id/contents",
  NotificationsCrudController.contents,
);
notificationsRouter.get("/queue", NotificationsCrudController.queue);
notificationsRouter.get("/queue/:id", NotificationsCrudController.queueItem);
