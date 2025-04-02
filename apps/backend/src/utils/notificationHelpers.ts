import { socketService } from "../services/socketService.js";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid";

// Send notification for file uploads
export const sendFileUploadNotification = (
  req: Request,
  filename: string,
  userId?: string
) => {
  const notification = {
    id: uuidv4(),
    userId,
    type: "upload" as const,
    message: `File "${filename}" has been uploaded`,
    createdAt: new Date(),
    read: false,
    meta: { 
      filename,
      uploadedBy: req.user?.id || "unknown"
    }
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
  userId?: string
) => {
  const notification = {
    id: uuidv4(),
    userId,
    type: "edit" as const,
    message: `${itemType} "${itemName}" has been edited`,
    createdAt: new Date(),
    read: false,
    meta: { 
      itemName,
      itemType,
      editedBy: req.user?.id || "unknown"
    }
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
  userId?: string
) => {
  const notification = {
    id: uuidv4(),
    userId,
    type: "update" as const,
    message: `${itemType} "${itemName}" has been updated`,
    createdAt: new Date(),
    read: false,
    meta: { 
      itemName,
      itemType,
      updatedBy: req.user?.id || "unknown"
    }
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
  userId?: string
) => {
  const notification = {
    id: uuidv4(),
    userId,
    type: "info" as const,
    message,
    createdAt: new Date(),
    read: false
  };

  // Broadcast to all or send to specific user
  if (userId) {
    socketService.sendNotificationToUser(userId, notification);
  } else {
    socketService.sendNotificationToAll(notification);
  }

  return notification;
}; 