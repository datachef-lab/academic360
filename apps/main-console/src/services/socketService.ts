import React from "react";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";

// Match the notification type definition from backend
export interface Notification {
  id: string;
  userId?: string;
  userName?: string;
  type: "upload" | "edit" | "update" | "info";
  message: string;
  createdAt: Date;
  read: boolean;
  meta?: Record<string, unknown>;
}

// Interface for raw notification data from socket
interface RawNotification {
  id: string;
  userId?: string;
  userName?: string;
  type: "upload" | "edit" | "update" | "info";
  message: string;
  createdAt: string | Date;
  read: boolean;
  meta?: Record<string, unknown>;
}

// Socket error interface
interface SocketError {
  message: string;
  code?: string;
  details?: unknown;
}

// Callback function type for notification listeners
type NotificationCallback = (notification: Notification) => void;
type ConnectionCallback = () => void;

class SocketService {
  private socket: Socket | null = null;
  private notificationListeners: NotificationCallback[] = [];
  private connected = false;
  private userName: string | null = null;
  private connectListeners: ConnectionCallback[] = [];
  private disconnectListeners: ConnectionCallback[] = [];
  private pendingAuth: { userName: string } | null = null;

  // Connect to the socket server
  connect() {
    if (this.socket && this.connected) return;

    const backendUrl = import.meta.env.VITE_APP_BACKEND_URL!; // e.g. https://academic360.app/besc/api
    const urlObj = new URL(backendUrl);

    // Host without path
    const serverOrigin = `${urlObj.protocol}//${urlObj.host}`;
    // Path for Socket.IO
    const socketPath = `${urlObj.pathname.replace(/\/$/, "")}/socket.io/`;

    try {
      this.socket = io(serverOrigin, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        path: socketPath,
      });

      this.socket.on("connect", this.handleConnect);
      this.socket.on("disconnect", this.handleDisconnect);
      this.socket.on("notification", this.handleNotification);
      this.socket.on("connect_error", this.handleError);

      console.log(`[SocketService] Connecting to ${serverOrigin} with path ${socketPath}`);
    } catch (error) {
      console.error("[SocketService] Error initializing socket:", error);
    }
  }

  // Check if socket is currently connected
  isConnected(): boolean {
    return this.connected;
  }

  // Register for connection status changes
  onConnectionChange(onConnect: ConnectionCallback, onDisconnect: ConnectionCallback) {
    this.connectListeners.push(onConnect);
    this.disconnectListeners.push(onDisconnect);
  }

  // Unregister connection status listeners
  offConnectionChange(onConnect: ConnectionCallback, onDisconnect: ConnectionCallback) {
    this.connectListeners = this.connectListeners.filter((cb) => cb !== onConnect);
    this.disconnectListeners = this.disconnectListeners.filter((cb) => cb !== onDisconnect);
  }

  // Authenticate the socket with user name
  authenticate(userName: string) {
    // Store the auth info
    this.userName = userName;
    this.pendingAuth = { userName };

    // If we're already connected, send the auth immediately
    if (this.socket && this.connected) {
      this.sendAuthentication();
    }
  }

  // Internal method to send authentication
  private sendAuthentication() {
    if (!this.socket || !this.connected || !this.pendingAuth) {
      return;
    }

    const { userName } = this.pendingAuth;
    this.socket.emit("authenticate", { userName });
    console.log(`[SocketService] Authenticated user: ${userName}`);
    this.pendingAuth = null;
  }

  // Disconnect from the server
  disconnect() {
    if (!this.socket) return;

    try {
      this.socket.off("connect", this.handleConnect);
      this.socket.off("disconnect", this.handleDisconnect);
      this.socket.off("notification", this.handleNotification);
      this.socket.off("connect_error", this.handleError);

      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.userName = null;

      console.log("[SocketService] Disconnected from server");
    } catch (error) {
      console.error("[SocketService] Error disconnecting socket:", error);
    }
  }

  // Add a notification listener
  addNotificationListener(callback: NotificationCallback) {
    this.notificationListeners.push(callback);
    return () => this.removeNotificationListener(callback);
  }

  // Remove a notification listener
  removeNotificationListener(callback: NotificationCallback) {
    this.notificationListeners = this.notificationListeners.filter((cb) => cb !== callback);
  }

  // Event handlers
  private handleConnect = () => {
    this.connected = true;
    console.log("[SocketService] Connected to server");

    // Notify all connect listeners
    this.connectListeners.forEach((listener) => listener());

    // Send pending authentication if any
    this.sendAuthentication();
  };

  private handleDisconnect = () => {
    this.connected = false;
    console.log("[SocketService] Disconnected from server");

    // Notify all disconnect listeners
    this.disconnectListeners.forEach((listener) => listener());
  };

  private handleNotification = (notification: RawNotification) => {
    console.log("[SocketService] Received notification:", notification);

    // Ensure the notification has the correct type structure
    const typedNotification: Notification = {
      ...notification,
      createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(),
    };

    // Create a formatted message with the user's name in bold if available
    const formattedMessage = notification.userName
      ? `<strong>${notification.userName}</strong> ${notification.message}`
      : notification.message;

    // Get the appropriate icon and color based on notification type
    const { icon } = this.getNotificationStyle(typedNotification.type);

    // Format the timestamp
    const timeString = new Date(typedNotification.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Show toast notification with enhanced styling
    toast(React.createElement("div", { dangerouslySetInnerHTML: { __html: formattedMessage } }), {
      description: timeString,
      icon,
      duration: 4000,
      richColors: true,
      className: "notification-toast",
    });

    // Call all registered listeners
    this.notificationListeners.forEach((callback) => callback(typedNotification));
  };

  // Helper function to get notification style based on type
  private getNotificationStyle(type: Notification["type"]): { icon: string; color: string } {
    switch (type) {
      case "upload":
        return {
          icon: "📤",
          color: "linear-gradient(to right, #3b82f6, #2563eb)",
        };
      case "edit":
        return {
          icon: "✏️",
          color: "linear-gradient(to right, #10b981, #059669)",
        };
      case "update":
        return {
          icon: "🔄",
          color: "linear-gradient(to right, #8b5cf6, #7c3aed)",
        };
      case "info":
      default:
        return {
          icon: "ℹ️",
          color: "linear-gradient(to right, #6b7280, #4b5563)",
        };
    }
  }

  private handleError = (error: SocketError | Error | unknown) => {
    console.error("[SocketService] Connection error:", error);

    // Show toast notification for connection error
    toast("Connection error", {
      description: "Could not connect to notification server",
      icon: "❌",
    });
  };

  // Get the current user's name
  getUserName(): string | null {
    return this.userName;
  }
}

// Export singleton instance
export const socketService = new SocketService();
