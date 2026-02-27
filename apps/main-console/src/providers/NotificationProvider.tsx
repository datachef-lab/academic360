import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { socketService, Notification } from "../services/socketService";
import { AuthContext } from "../features/auth/providers/auth-provider";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  // Connect to socket when provider mounts
  useEffect(() => {
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Authenticate with user ID when user data is available
  useEffect(() => {
    if (user?.id) {
      socketService.authenticate(String(user?.id));
    }
  }, [user?.id]);

  const queryClient = useQueryClient();

  // Listen for notifications
  useEffect(() => {
    const removeListener = socketService.addNotificationListener((notification) => {
      setNotifications((prev) => [notification, ...prev]);

      // When a fee-related notification arrives, invalidate relevant queries
      const feeRelated = notification.meta
        ? Object.keys(notification.meta).some((k) => k.toString().startsWith("fee"))
        : notification.message.toLowerCase().includes("fee");
      if (feeRelated) {
        queryClient.invalidateQueries({
          predicate: (query) => typeof query.queryKey[0] === "string" && query.queryKey[0].startsWith("fees"),
        });
      }
    });

    return removeListener;
  }, [queryClient]);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
