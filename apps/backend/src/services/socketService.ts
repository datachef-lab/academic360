import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import * as userService from "@/features/user/services/user.service";

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

// Active user info interface
interface ActiveUserInfo {
  id: number;
  name: string;
  image: string | null;
  type: "ADMIN" | "STAFF" | "STUDENT";
  tabActive: boolean;
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
  private userInfoCache: Map<string, ActiveUserInfo> = new Map(); // userId -> user info
  private socketToUserId: Map<string, string> = new Map(); // socketId -> userId
  private socketTabActive: Map<string, boolean> = new Map(); // socketId -> isTabActive (page visible)

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
      // Default: assume tab is active until we hear otherwise
      this.socketTabActive.set(socket.id, true);

      // Handle user authentication and mapping
      socket.on("authenticate", async (userId: string) => {
        try {
          await this.registerUser(userId, socket.id);
          socket.join(`user:${userId}`); // Join a room specific to this user
          console.log(
            `[SocketService] User ${userId} authenticated with socket ${socket.id}`,
          );
          // Emit active users update after registration
          this.broadcastActiveUsers();
        } catch (error) {
          console.error(
            `[SocketService] Error authenticating user ${userId}:`,
            error,
          );
        }
      });

      // Track tab visibility (active tab vs background tab)
      socket.on("tab_visibility", (payload: { isActive: boolean }) => {
        try {
          this.socketTabActive.set(socket.id, !!payload?.isActive);

          const userId = this.socketToUserId.get(socket.id);
          if (userId) {
            this.recomputeUserTabActive(userId);
          }

          this.broadcastActiveUsers();
        } catch (error) {
          console.error(
            `[SocketService] Error handling tab_visibility for ${socket.id}:`,
            error,
          );
        }
      });

      // Handle get active users request
      socket.on("get_active_users", () => {
        try {
          const activeUsers = this.getActiveAdminStaffUsers();
          socket.emit("active_users_list", activeUsers);
          socket.emit("students_online_count", this.getOnlineStudentsCount());
        } catch (error) {
          console.error("[SocketService] Error getting active users:", error);
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
          // Emit active users update after removal
          this.broadcastActiveUsers();
        } catch (error) {
          console.error(
            `[SocketService] Error handling disconnect for ${socket.id}:`,
            error,
          );
        }
      });
    });
  }

  // Register a user with their socket ID and fetch user info
  private async registerUser(userId: string, socketId: string) {
    this.socketToUserId.set(socketId, userId);

    if (!this.activeConnections.has(userId)) {
      this.activeConnections.set(userId, new Set());
    }
    this.activeConnections.get(userId)?.add(socketId);

    // Fetch and cache user info if not already cached or if it's a new connection
    if (!this.userInfoCache.has(userId)) {
      try {
        const userIdNum = Number(userId);
        if (!isNaN(userIdNum)) {
          const user = await userService.findById(userIdNum);
          if (
            user &&
            (user.type === "ADMIN" ||
              user.type === "STAFF" ||
              user.type === "STUDENT") &&
            user.isActive !== false
          ) {
            this.userInfoCache.set(userId, {
              id: userIdNum,
              name: user.name || "Unknown",
              image: user.image || null,
              type: user.type as "ADMIN" | "STAFF" | "STUDENT",
              tabActive: true,
            });
          }
        }
      } catch (error) {
        console.error(
          `[SocketService] Error fetching user info for ${userId}:`,
          error,
        );
      }
    }

    // After adding a socket, recompute user's tabActive based on all sockets
    this.recomputeUserTabActive(userId);
  }

  private recomputeUserTabActive(userId: string) {
    const sockets = this.activeConnections.get(userId);
    if (!sockets || sockets.size === 0) return;

    // If any socket for this user has an active tab, treat user as tabActive
    let anyActive = false;
    sockets.forEach((sid) => {
      if (this.socketTabActive.get(sid)) {
        anyActive = true;
      }
    });

    const cached = this.userInfoCache.get(userId);
    if (cached) {
      cached.tabActive = anyActive;
      this.userInfoCache.set(userId, cached);
    }
  }

  // Remove a socket when the connection is closed
  private removeSocket(socketId: string) {
    const userIdForSocket = this.socketToUserId.get(socketId);
    this.socketToUserId.delete(socketId);
    this.socketTabActive.delete(socketId);

    this.activeConnections.forEach((sockets, userId) => {
      if (sockets.has(socketId)) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          this.activeConnections.delete(userId);
          // Remove from cache when user has no active connections
          this.userInfoCache.delete(userId);
        } else {
          // Update tabActive based on remaining sockets
          this.recomputeUserTabActive(userId);
        }
      }
    });

    // Also recompute for socket-mapped userId in case it wasn't found via loop
    if (userIdForSocket) {
      this.recomputeUserTabActive(userIdForSocket);
    }
  }

  // Get active ADMIN/STAFF users
  private getActiveAdminStaffUsers(): ActiveUserInfo[] {
    const activeUsers: ActiveUserInfo[] = [];
    this.activeConnections.forEach((sockets, userId) => {
      // Only include users with active connections
      if (sockets.size > 0) {
        const userInfo = this.userInfoCache.get(userId);
        if (
          userInfo &&
          (userInfo.type === "ADMIN" || userInfo.type === "STAFF")
        ) {
          activeUsers.push(userInfo);
        }
      }
    });
    return activeUsers;
  }

  private getOnlineStudentsCount(): number {
    let count = 0;
    this.activeConnections.forEach((sockets, userId) => {
      if (sockets.size === 0) return;
      const userInfo = this.userInfoCache.get(userId);
      if (userInfo?.type === "STUDENT") {
        count += 1;
      }
    });
    return count;
  }

  // Expose list of online student userIds (for REST API consumers)
  public getOnlineStudentUserIds(): number[] {
    const ids: number[] = [];
    this.activeConnections.forEach((sockets, userId) => {
      if (sockets.size === 0) return;
      const userInfo = this.userInfoCache.get(userId);
      if (userInfo?.type === "STUDENT") {
        const num = Number(userId);
        if (!Number.isNaN(num)) {
          ids.push(num);
        }
      }
    });
    return ids;
  }

  // Broadcast active users list to all connected clients
  private broadcastActiveUsers() {
    if (!this.io) {
      return;
    }

    try {
      const activeUsers = this.getActiveAdminStaffUsers();
      this.io.emit("active_users_update", activeUsers);
      this.io.emit("students_online_count", this.getOnlineStudentsCount());
      console.log(
        `[SocketService] Broadcasted active users update: ${activeUsers.length} users`,
      );
    } catch (error) {
      console.error("[SocketService] Error broadcasting active users:", error);
    }
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

  // Send a notification only to currently active staff and admin users
  // This iterates the cached active users and emits directly to their rooms.
  sendNotificationToAdminStaff(notification: Notification) {
    if (!this.io) {
      console.error(
        "[SocketService] Cannot send admin/staff notification: io is null",
      );
      return;
    }

    try {
      const activeUsers = this.getActiveAdminStaffUsers();
      activeUsers.forEach((u) => {
        this.io!.to(`user:${u.id}`).emit("notification", notification);
      });
      console.log(
        `[SocketService] Sent notification to admin/staff: ${notification.message}`,
      );
    } catch (error) {
      console.error(
        "[SocketService] Error sending notification to admin/staff:",
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
