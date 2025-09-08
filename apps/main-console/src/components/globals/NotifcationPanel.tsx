import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, FileUp, Edit, RefreshCw, Info, Check, Trash2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function NotificationPanel() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  // When panel opens, mark all as read
  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      markAllAsRead();
    }
  };

  // Get icon based on notification type
  const getIconForType = (type: string) => {
    switch (type) {
      case "upload":
        return <FileUp className="h-4 w-4 text-green-500" />;
      case "edit":
        return <Edit className="h-4 w-4 text-blue-500" />;
      case "update":
        return <RefreshCw className="h-4 w-4 text-orange-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  // Format notification timestamp
  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
    return format(date, "MMM dd, yyyy hh:mm a");
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpen}>
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
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle>Notifications</SheetTitle>
          {notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearNotifications} className="flex gap-1 items-center text-xs">
              <Trash2 className="h-3 w-3" /> Clear All
            </Button>
          )}
        </SheetHeader>

        <div className="space-y-4 mt-4 max-h-[80vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No notifications to display</div>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={cn("transition-colors", notification.read ? "bg-background" : "bg-muted/20")}
              >
                <CardHeader className="p-3 pb-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {getIconForType(notification.type)}
                      <CardTitle className="text-sm">
                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                      </CardTitle>
                    </div>
                    {!notification.read && (
                      <Badge variant="outline" className="text-xs bg-blue-500 hover:bg-blue-600 text-white">
                        New
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatTimestamp(notification.createdAt)}</p>
                </CardContent>
                {!notification.read && (
                  <CardFooter className="p-3 pt-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto flex items-center gap-1 text-xs"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-3 w-3" /> Mark as read
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
