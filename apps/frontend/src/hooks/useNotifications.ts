import { useContext } from "react";
import { NotificationContext } from "../providers/NotificationProvider";

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}; 