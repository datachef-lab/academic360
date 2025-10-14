import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

// Define notification types
export interface Notification {
  id: string;
  userId?: string; // Target user ID (if specific to a user)
  userName?: string; // Name of the user who performed the action
  type: "upload" | "edit" | "update" | "info" | "progress";
  message: string;
  createdAt: Date;
  read: boolean;
  meta?: Record<string, unknown>; // Additional metadata
}

// Define progress tracking interface
export interface ProgressUpdate {
  id: string;
  userId: string;
  type: "export_progress";
  message: string;
  progress: number; // 0-100
  status: "started" | "in_progress" | "completed" | "error";
  fileName?: string;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  meta?: Record<string, unknown>;
}

// Define MIS table update interface
export interface MisTableUpdate {
  id: string;
  type: "mis_table_update";
  sessionId?: number;
  classId?: number;
  data: {
    programCourseName: string;
    admitted: number;
    subjectSelectionDone: number;
    sortOrder: number;
  }[];
  updatedAt: string;
  meta?: Record<string, unknown>;
}

// Socket service class
class SocketService {
  private io: Server<
    DefaultEventsMap,
    DefaultEventsMap,
    DefaultEventsMap,
    any
  > | null = null;
  private activeConnections: Map<string, Set<string>> = new Map(); // userId -> set of socket IDs

  // Add this method
  public getIO() {
    return this.io;
  }

  // Initialize with Socket.IO server instance
  initialize(ioServer: Server) {
    try {
      this.io = ioServer;
      this.setupListeners();
      console.log("[SocketService] Initialized");
    } catch (error) {
      console.error("[SocketService] Error initializing:", error);
    }
  }

  // Set up connection listeners
  private setupListeners() {
    if (!this.io) {
      console.error("[SocketService] Cannot setup listeners: io is null");
      return;
    }

    this.io.on("connection", (socket: Socket) => {
      console.log(`[SocketService] Client connected: ${socket.id}`);

      // Handle user authentication and mapping
      socket.on("authenticate", (userId: string) => {
        try {
          this.registerUser(userId, socket.id);
          socket.join(`user:${userId}`); // Join a room specific to this user
          console.log(
            `[SocketService] User ${userId} authenticated with socket ${socket.id}`,
          );
        } catch (error) {
          console.error(
            `[SocketService] Error authenticating user ${userId}:`,
            error,
          );
        }
      });

      // Handle MIS dashboard subscription
      socket.on(
        "subscribe_mis_dashboard",
        (filters: { sessionId?: number; classId?: number }) => {
          try {
            const roomName = this.getMisRoomName(filters);
            socket.join(roomName);
            console.log(
              `[SocketService] Socket ${socket.id} joined MIS room: ${roomName}`,
            );
          } catch (error) {
            console.error(
              `[SocketService] Error subscribing to MIS dashboard:`,
              error,
            );
          }
        },
      );

      // Handle MIS dashboard unsubscription
      socket.on(
        "unsubscribe_mis_dashboard",
        (filters: { sessionId?: number; classId?: number }) => {
          try {
            const roomName = this.getMisRoomName(filters);
            socket.leave(roomName);
            console.log(
              `[SocketService] Socket ${socket.id} left MIS room: ${roomName}`,
            );
          } catch (error) {
            console.error(
              `[SocketService] Error unsubscribing from MIS dashboard:`,
              error,
            );
          }
        },
      );

      // Handle disconnection
      socket.on("disconnect", () => {
        try {
          this.removeSocket(socket.id);
          console.log(`[SocketService] Client disconnected: ${socket.id}`);
        } catch (error) {
          console.error(
            `[SocketService] Error handling disconnect for ${socket.id}:`,
            error,
          );
        }
      });
    });
  }

  // Register a user with their socket ID
  private registerUser(userId: string, socketId: string) {
    if (!this.activeConnections.has(userId)) {
      this.activeConnections.set(userId, new Set());
    }
    this.activeConnections.get(userId)?.add(socketId);
  }

  // Remove a socket when the connection is closed
  private removeSocket(socketId: string) {
    this.activeConnections.forEach((sockets, userId) => {
      if (sockets.has(socketId)) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          this.activeConnections.delete(userId);
        }
      }
    });
  }

  // Send notification to all connected clients
  sendNotificationToAll(notification: Notification) {
    if (!this.io) {
      console.error("[SocketService] Cannot send notification: io is null");
      return;
    }

    try {
      this.io.emit("notification", notification);
      console.log(
        `[SocketService] Broadcast notification: ${notification.message}`,
      );
    } catch (error) {
      console.error(
        "[SocketService] Error sending notification to all:",
        error,
      );
    }
  }

  // Send notification to a specific user
  sendNotificationToUser(userId: string, notification: Notification) {
    if (!this.io) {
      console.error("[SocketService] Cannot send notification: io is null");
      return;
    }

    try {
      this.io.to(`user:${userId}`).emit("notification", notification);
      console.log(
        `[SocketService] Sent notification to user ${userId}: ${notification.message}`,
      );
    } catch (error) {
      console.error(
        `[SocketService] Error sending notification to user ${userId}:`,
        error,
      );
    }
  }

  // Send notification to multiple users
  sendNotificationToUsers(userIds: string[], notification: Notification) {
    try {
      userIds.forEach((userId) => {
        this.sendNotificationToUser(userId, notification);
      });
    } catch (error) {
      console.error(
        "[SocketService] Error sending notification to multiple users:",
        error,
      );
    }
  }

  // Create a notification for file upload
  createUploadNotification(filename: string, userId?: string): Notification {
    return {
      id: Date.now().toString(),
      userId,
      type: "upload",
      message: `File "${filename}" has been uploaded`,
      createdAt: new Date(),
      read: false,
      meta: { filename },
    };
  }

  // Create a notification for edit action
  createEditNotification(itemName: string, userId?: string): Notification {
    return {
      id: Date.now().toString(),
      userId,
      type: "edit",
      message: `"${itemName}" has been edited`,
      createdAt: new Date(),
      read: false,
      meta: { itemName },
    };
  }

  // Create a notification for update action
  createUpdateNotification(itemName: string, userId?: string): Notification {
    return {
      id: Date.now().toString(),
      userId,
      type: "update",
      message: `"${itemName}" has been updated`,
      createdAt: new Date(),
      read: false,
      meta: { itemName },
    };
  }

  // Send progress update to a specific user
  sendProgressUpdate(userId: string, progressUpdate: ProgressUpdate) {
    if (!this.io) {
      console.error("[SocketService] Cannot send progress update: io is null");
      return;
    }

    try {
      this.io.to(`user:${userId}`).emit("progress_update", progressUpdate);
      console.log(
        `[SocketService] Sent progress update to user ${userId}: ${progressUpdate.message} (${progressUpdate.progress}%)`,
      );
    } catch (error) {
      console.error(
        `[SocketService] Error sending progress update to user ${userId}:`,
        error,
      );
    }
  }

  // Create a progress update for export operations
  createExportProgressUpdate(
    userId: string,
    message: string,
    progress: number,
    status: "started" | "in_progress" | "completed" | "error",
    fileName?: string,
    downloadUrl?: string,
    error?: string,
    meta?: Record<string, unknown>,
  ): ProgressUpdate {
    return {
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: "export_progress",
      message,
      progress,
      status,
      fileName,
      downloadUrl,
      error,
      createdAt: new Date(),
      meta,
    };
  }

  // Generate MIS room name based on filters
  private getMisRoomName(filters: {
    sessionId?: number;
    classId?: number;
  }): string {
    const sessionPart = filters.sessionId
      ? `session_${filters.sessionId}`
      : "all_sessions";
    const classPart = filters.classId
      ? `class_${filters.classId}`
      : "all_classes";
    return `mis_dashboard:${sessionPart}:${classPart}`;
  }

  // Send MIS table update to specific room
  sendMisTableUpdate(
    filters: { sessionId?: number; classId?: number },
    data: {
      programCourseName: string;
      admitted: number;
      subjectSelectionDone: number;
      sortOrder: number;
    }[],
    meta?: Record<string, unknown>,
  ) {
    if (!this.io) {
      console.error("[SocketService] Cannot send MIS table update: io is null");
      return;
    }

    try {
      const roomName = this.getMisRoomName(filters);
      const update: MisTableUpdate = {
        id: `mis_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: "mis_table_update",
        sessionId: filters.sessionId,
        classId: filters.classId,
        data,
        updatedAt: new Date().toISOString(),
        meta,
      };

      this.io.to(roomName).emit("mis_table_update", update);
      console.log(
        `[SocketService] Sent MIS table update to room ${roomName} with ${data.length} records`,
      );
    } catch (error) {
      console.error("[SocketService] Error sending MIS table update:", error);
    }
  }

  // Send MIS table update to all MIS dashboard rooms
  sendMisTableUpdateToAll(
    data: {
      programCourseName: string;
      admitted: number;
      subjectSelectionDone: number;
      sortOrder: number;
    }[],
    meta?: Record<string, unknown>,
  ) {
    if (!this.io) {
      console.error(
        "[SocketService] Cannot send MIS table update to all: io is null",
      );
      return;
    }

    try {
      const update: MisTableUpdate = {
        id: `mis_update_all_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: "mis_table_update",
        data,
        updatedAt: new Date().toISOString(),
        meta,
      };

      // Send to all MIS dashboard rooms
      this.io.emit("mis_table_update", update);
      console.log(
        `[SocketService] Sent MIS table update to all MIS dashboard clients with ${data.length} records`,
      );
    } catch (error) {
      console.error(
        "[SocketService] Error sending MIS table update to all:",
        error,
      );
    }
  }
}

// Export as singleton
export const socketService = new SocketService();
