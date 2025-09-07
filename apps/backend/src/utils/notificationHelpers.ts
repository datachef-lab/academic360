import { socketService } from "../services/socketService.js";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid";
import { User } from "@repo/db/schemas/models/user";

// Send notification for file uploads
export const sendFileUploadNotification = (
  req: Request,
  filename: string,
  userId?: string,
) => {
  const user = req.user as User;
  const notification = {
    id: uuidv4(),
    userId,
    userName: user?.name || "Unknown User",
    type: "upload" as const,
    message: `uploaded a new file "${filename}"`,
    createdAt: new Date(),
    read: false,
    meta: {
      filename,
      uploadedBy: user?.id || "unknown",
      timestamp: new Date().toISOString(),
    },
  };

  // Broadcast to all or send to specific user
  if (userId) {
    socketService.sendNotificationToUser(userId, notification);
  } else {
    socketService.sendNotificationToAll(notification);
  }

  return notification;
};

// Send notification for data edits
export const sendEditNotification = (
  req: Request,
  itemName: string,
  itemType: string,
  userId?: string,
) => {
  const user = req.user as User;
  const notification = {
    id: uuidv4(),
    userId,
    userName: user?.name || "Unknown User",
    type: "edit" as const,
    message: `edited ${itemType.toLowerCase()} "${itemName}"`,
    createdAt: new Date(),
    read: false,
    meta: {
      itemName,
      itemType,
      editedBy: user?.id || "unknown",
      timestamp: new Date().toISOString(),
    },
  };

  // Broadcast to all or send to specific user
  if (userId) {
    socketService.sendNotificationToUser(userId, notification);
  } else {
    socketService.sendNotificationToAll(notification);
  }

  return notification;
};

// Send notification for updates
export const sendUpdateNotification = (
  req: Request,
  itemName: string,
  itemType: string,
  userId?: string,
) => {
  const user = req.user as User;
  const notification = {
    id: uuidv4(),
    userId,
    userName: user?.name || "Unknown User",
    type: "update" as const,
    message: `updated ${itemType.toLowerCase()} "${itemName}"`,
    createdAt: new Date(),
    read: false,
    meta: {
      itemName,
      itemType,
      updatedBy: user?.id || "unknown",
      timestamp: new Date().toISOString(),
    },
  };

  // Broadcast to all or send to specific user
  if (userId) {
    socketService.sendNotificationToUser(userId, notification);
  } else {
    socketService.sendNotificationToAll(notification);
  }

  return notification;
};

// Send notification for system info
export const sendInfoNotification = (
  message: string,
  userId?: string,
  userName?: string,
) => {
  const notification = {
    id: uuidv4(),
    userId,
    userName: userName || "System",
    type: "info" as const,
    message,
    createdAt: new Date(),
    read: false,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  // Broadcast to all or send to specific user
  if (userId) {
    socketService.sendNotificationToUser(userId, notification);
  } else {
    socketService.sendNotificationToAll(notification);
  }

  return notification;
};
