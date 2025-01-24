import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";

// Sample notification data
const notifications = [
  {
    id: 1,
    title: "New Admission Request",
    description: "A new admission request has been submitted.",
    status: "new", // new, urgent, resolved
    timestamp: "5 minutes ago",
    readTime: null, // Not read yet
  },
  {
    id: 2,
    title: "Library Book Due",
    description: "Reminder: 'The Great Gatsby' is due tomorrow.",
    status: "urgent",
    timestamp: "2 hours ago",
    readTime: null, // Not read yet
  },
  {
    id: 3,
    title: "System Maintenance",
    description: "Scheduled maintenance on Jan 25, 2025.",
    status: "resolved",
    timestamp: "1 day ago",
    readTime: "12 hours ago", // Already read
  },
];

export default function NotificationPanel() {
  // Calculate unread notifications
  const unreadCount = notifications.filter((notification) => !notification.readTime).length;

  return (
    <Sheet>
      <SheetTrigger>
        <Button size="icon" variant="ghost" className="relative border">
          <Bell />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[350px] sm:w-[400px] right-0">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 ${
                notification.status === "new"
                  ? "border-blue-500"
                  : notification.status === "urgent"
                    ? "border-red-500"
                    : "border-gray-300"
              }`}
            >
              <CardHeader className="flex justify-between items-center">
                <CardTitle className="text-sm font-semibold">{notification.title}</CardTitle>

                <Badge
                  variant={
                    notification.status === "new"
                      ? "default"
                      : notification.status === "urgent"
                        ? "destructive"
                        : "secondary"
                  }
                  className="capitalize inline"
                >
                  {notification.status}
                </Badge>
              </CardHeader>
              <CardContent className="px-4">
                <p className="text-sm ">{notification.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between border-t items-center px-4 py-2">
                <span className="text-xs ">Received: {notification.timestamp}</span>
                <span className="text-xs ">{notification.readTime ? `Read: ${notification.readTime}` : "Unread"}</span>
              </CardFooter>
            </Card>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
