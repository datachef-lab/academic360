import { useContext } from "react";
import { NotificationContext } from "../providers/NotificationProvider";

// Define the return type explicitly
type NotificationContextType = {
  notifications: Array<{
    id: string;
    userId?: string;
    userName?: string;
    type: "upload" | "edit" | "update" | "info";
    message: string;
    createdAt: Date;
    read: boolean;
    meta?: Record<string, unknown>;
  }>;
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
};
