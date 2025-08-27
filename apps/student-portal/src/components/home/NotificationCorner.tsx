import { Bell } from "lucide-react";
import React, { useState } from "react";
import NotificationSheet from "./NotificationSheet";

export type NotificationType =
  | "assignment"
  | "quiz"
  | "class"
  | "exam"
  | "feedback";

export type NotificationColor =
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "indigo"
  | "violet"
  | "red";

export interface Notification {
  id: number;
  title: string;
  course: string;
  time: string;
  type: NotificationType;
  color: NotificationColor;
  isRead?: boolean;
  isImportant?: boolean;
}

export default function NotificationCorner() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  return (
    <>
      {/* Notification Button */}
      <button
        onClick={() => setOpen(true)}
        className="mt-4 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors inline-flex items-center gap-2"
        aria-label="View notifications"
      >
        <Bell className="w-5 h-5 text-white" />
        <span className="text-white text-sm">Notifications</span>
        {notifications.filter((n) => !n.isRead).length > 0 && (
          <span className="bg-red-500 text-white text-xs min-w-5 h-5 rounded-full flex items-center justify-center px-1">
            {notifications.filter((n) => !n.isRead).length}
          </span>
        )}
      </button>

      {/* Notification Sheet */}
      <NotificationSheet
        open={open}
        setOpen={setOpen}
        notifications={notifications}
        setNotifications={setNotifications}
      />
    </>
  );
}
