import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import {
  Bell,
  ClipboardList,
  FileText,
  GraduationCap,
  Star,
  Users,
  X,
} from "lucide-react";
import { Notification } from "./NotificationCorner";

type NotificationFilter = "all" | "unread" | "important";

// Map Tailwind color classes for notifications
const colorMap = {
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-700",
  },
  emerald: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
  },
  amber: {
    bg: "bg-amber-100",
    text: "text-amber-700",
  },
  rose: {
    bg: "bg-rose-100",
    text: "text-rose-700",
  },
  indigo: {
    bg: "bg-indigo-100",
    text: "text-indigo-700",
  },
  violet: {
    bg: "bg-violet-100",
    text: "text-violet-700",
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-700",
  },
};

type NotificationSheetProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
};

export default function NotificationSheet({
  open,
  setOpen,
  notifications,
  setNotifications,
}: NotificationSheetProps) {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>("all");

  const dismissNotification = (id: number) => {
    setNotifications(
      notifications.filter((notification) => notification.id !== id)
    );
  };

  // Mark a notification as read
  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  // Toggle important status of a notification
  const toggleImportant = (id: number) => {
    setNotifications(
      notifications.map((notification) =>
        notification.id === id
          ? { ...notification, isImportant: !notification.isImportant }
          : notification
      )
    );
  };

  // Filter notifications based on active filter
  const getFilteredNotifications = () => {
    switch (activeFilter) {
      case "unread":
        return notifications.filter((notification) => !notification.isRead);
      case "important":
        return notifications.filter((notification) => notification.isImportant);
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="sm:max-w-md overflow-y-auto bg-white p-0">
        <div className="sticky top-0 bg-white z-10 px-6 py-5 border-b">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center text-xl text-gray-900">
              <Bell className="h-5 w-5 mr-2 text-purple-600" />
              All Notifications
            </SheetTitle>
            <SheetDescription className="text-gray-500">
              View all your activity and notifications
            </SheetDescription>
          </SheetHeader>

          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                activeFilter === "all"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
              <span className="bg-gray-200 text-gray-700 text-xs min-w-5 h-5 rounded-full flex items-center justify-center px-1">
                {notifications.length}
              </span>
            </button>
            <button
              onClick={() => setActiveFilter("unread")}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                activeFilter === "unread"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Unread
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <span
                  className={`${
                    activeFilter === "unread"
                      ? "bg-purple-200 text-purple-700"
                      : "bg-gray-200 text-gray-700"
                  } text-xs min-w-5 h-5 rounded-full flex items-center justify-center px-1`}
                >
                  {notifications.filter((n) => !n.isRead).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveFilter("important")}
              className={`px-3 py-1.5 text-xs rounded-full font-medium transition-colors flex items-center gap-1.5 ${
                activeFilter === "important"
                  ? "bg-purple-100 text-purple-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Important
              {notifications.filter((n) => n.isImportant).length > 0 && (
                <span
                  className={`${
                    activeFilter === "important"
                      ? "bg-purple-200 text-purple-700"
                      : "bg-gray-200 text-gray-700"
                  } text-xs min-w-5 h-5 rounded-full flex items-center justify-center px-1`}
                >
                  {notifications.filter((n) => n.isImportant).length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => {
              const colorClasses = colorMap[notification.color] || {
                bg: "bg-gray-100",
                text: "text-gray-700",
              };

              return (
                <div
                  key={notification.id}
                  className={`p-4 rounded-xl bg-white border hover:border-purple-200 shadow-sm hover:shadow transition-all duration-200 relative group cursor-pointer ${
                    !notification.isRead ? "border-l-4 border-l-purple-500" : ""
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses.bg}`}
                    >
                      {notification.type === "assignment" && (
                        <FileText className={`w-5 h-5 ${colorClasses.text}`} />
                      )}
                      {notification.type === "quiz" && (
                        <ClipboardList
                          className={`w-5 h-5 ${colorClasses.text}`}
                        />
                      )}
                      {notification.type === "class" && (
                        <Users className={`w-5 h-5 ${colorClasses.text}`} />
                      )}
                      {notification.type === "exam" && (
                        <GraduationCap
                          className={`w-5 h-5 ${colorClasses.text}`}
                        />
                      )}
                      {notification.type === "feedback" && (
                        <Star className={`w-5 h-5 ${colorClasses.text}`} />
                      )}
                    </div>

                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4
                            className={`text-sm font-medium ${
                              !notification.isRead
                                ? "text-gray-900 font-semibold"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.title}
                          </h4>
                          <p
                            className={`text-sm ${
                              !notification.isRead
                                ? "text-gray-600"
                                : "text-gray-500"
                            } mt-1`}
                          >
                            {notification.course}
                          </p>
                        </div>

                        <div className="flex items-start gap-2">
                          <span
                            className={`text-xs whitespace-nowrap ${colorClasses.bg} ${colorClasses.text} px-2 py-0.5 rounded-full`}
                          >
                            {notification.time}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleImportant(notification.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-100"
                              aria-label={
                                notification.isImportant
                                  ? "Remove from important"
                                  : "Mark as important"
                              }
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  notification.isImportant
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-400"
                                }`}
                              />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-100"
                              aria-label="Dismiss notification"
                            >
                              <X className="h-4 w-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-lg">
              <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-800 font-medium text-lg mb-2">
                All caught up!
              </p>
              <p className="text-gray-500 text-sm max-w-xs px-4">
                You don&apos;t have any notifications at the moment. We&apos;ll
                notify you when something new arrives.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
