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

const EXAM_ENTITY_QUERY_KEYS: Record<string, string[]> = {
  exam: ["exams", "examGroups", "exam"],
  exam_group: ["exams", "examGroups", "exam"],
  exam_type: ["examTypes"],
  exam_component: ["examComponents"],
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  const queryClient = useQueryClient();

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

  // Listen for notifications and refetch exam data when exam management changes
  useEffect(() => {
    const removeListener = socketService.addNotificationListener((notification) => {
      setNotifications((prev) => [notification, ...prev]);

      // Invalidate exam-related queries so staff/admin see fresh data without refresh
      const entity = notification.meta?.entity as string | undefined;
      if (entity && EXAM_ENTITY_QUERY_KEYS[entity]) {
        EXAM_ENTITY_QUERY_KEYS[entity].forEach((queryKey) => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
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
