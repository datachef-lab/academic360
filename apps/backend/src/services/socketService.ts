import { Server, Socket } from "socket.io";
import { getRealtimeTrackerRoomName } from "@/features/realtime-tracker/realtime-tracker.socket.js";
import {
  canonicalRealtimeTrackerFilters,
  parseRealtimeTrackerFilters,
} from "@/utils/realtime-tracker-filters.js";
import type { DefaultEventsMap } from "socket.io";
import * as userService from "@/features/user/services/user.service";

import { createLogger } from "@/config/logger.js";
const log = createLogger("socket");
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

export interface LibraryEntryExitUpdate {
  id: string;
  type: "library_entry_exit_update";
  action: "CHECKED_IN" | "CHECKED_OUT";
  userId: number;
  userName: string;
  message: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export interface LibraryJournalUpdate {
  id: string;
  type: "library_journal_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  journalId: number;
  journalTitle: string;
  message: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export interface LibraryCopyDetailsUpdate {
  id: string;
  type: "library_copy_details_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  copyDetailsId: number;
  bookTitle: string;
  message: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export interface LibraryBookUpdate {
  id: string;
  type: "library_book_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  bookId: number;
  bookTitle: string;
  message: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export interface LibraryBookCirculationUpdate {
  id: string;
  type: "library_book_circulation_update";
  action: "UPSERTED";
  actorUserId: number | null;
  actorName: string;
  userId: number;
  message: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export interface LibraryRackUpdate {
  id: string;
  type: "library_rack_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  rackId: number;
  rackName: string;
  message: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export interface LibraryShelfUpdate {
  id: string;
  type: "library_shelf_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  shelfId: number;
  shelfName: string;
  message: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export interface LibraryStatusUpdate {
  id: string;
  type: "library_status_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  statusId: number;
  statusName: string;
  message: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export interface LibraryArticleUpdate {
  id: string;
  type: "library_article_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  articleId: number;
  articleName: string;
  message: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export interface LibraryDocumentTypeUpdate {
  id: string;
  type: "library_document_type_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  documentTypeId: number;
  documentTypeName: string;
  message: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export interface LibraryJournalTypeUpdate {
  id: string;
  type: "library_journal_type_update";
  action: "CREATED" | "UPDATED" | "DELETED";
  actorName: string;
  journalTypeId: number;
  journalTypeName: string;
  message: string;
  updatedAt: string;
  meta?: Record<string, unknown>;
}

export interface FeesDashboardUpdate {
  id: string;
  type: "fees_dashboard_update";
  updatedAt: string;
  reason: string;
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
  private userConnectedAt: Map<string, Date> = new Map(); // userId -> first socket connect time
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
      log.info("Initialized");
    } catch (error) {
      log.error("Error initializing", { error });
    }
  }

  // Set up connection listeners
  private setupListeners() {
    if (!this.io) {
      log.error("Cannot setup listeners: io is null");
      return;
    }

    this.io.on("connection", (socket: Socket) => {
      log.debug(`Client connected: ${socket.id}`);
      // Default: assume tab is active until we hear otherwise
      this.socketTabActive.set(socket.id, true);

      // Generic per-resource collaboration rooms (e.g. "resource:states").
      socket.on("subscribe_resource", (resource: string) => {
        if (typeof resource === "string" && resource)
          socket.join(`resource:${resource}`);
      });
      socket.on("unsubscribe_resource", (resource: string) => {
        if (typeof resource === "string" && resource)
          socket.leave(`resource:${resource}`);
      });

      // Handle user authentication and mapping
      socket.on("authenticate", async (userId: string) => {
        try {
          await this.registerUser(userId, socket.id);
          socket.join(`user:${userId}`); // Join a room specific to this user
          log.info(`User ${userId} authenticated with socket ${socket.id}`);
          // Emit active users update after registration
          this.broadcastActiveUsers();
        } catch (error) {
          log.error(`Error authenticating user ${userId}`, { error });
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
            log.debug(`Socket ${socket.id} joined MIS room: ${roomName}`);
          } catch (error) {
            log.error("Error subscribing to MIS dashboard", { error });
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
            log.debug(`Socket ${socket.id} left MIS room: ${roomName}`);
          } catch (error) {
            log.error("Error unsubscribing from MIS dashboard", { error });
          }
        },
      );

      socket.on("subscribe_fees_dashboard", () => {
        try {
          socket.join("fees_dashboard");
          log.debug(`Socket ${socket.id} joined room: fees_dashboard`);
        } catch (error) {
          log.error("Error subscribing to fees dashboard room", { error });
        }
      });

      socket.on("unsubscribe_fees_dashboard", () => {
        try {
          socket.leave("fees_dashboard");
          log.debug(`Socket ${socket.id} left room: fees_dashboard`);
        } catch (error) {
          log.error("Error unsubscribing from fees dashboard room", { error });
        }
      });

      socket.on(
        "subscribe_realtime_tracker",
        async (payload: {
          tab?: "affiliation" | "fee_mis";
          filters?: Record<string, unknown>;
        }) => {
          try {
            const tab = payload?.tab === "fee_mis" ? "fee_mis" : "affiliation";
            const { parseRealtimeTrackerFilters } =
              await import("@/utils/realtime-tracker-filters.js");
            const { getRealtimeTrackerRoomName, pushRealtimeTrackerSnapshot } =
              await import("@/features/realtime-tracker/realtime-tracker.socket.js");
            const filters = canonicalRealtimeTrackerFilters(
              parseRealtimeTrackerFilters(payload?.filters ?? {}),
            );
            const roomName = getRealtimeTrackerRoomName(tab, filters);
            socket.join(roomName);
            log.debug(`Socket ${socket.id} joined ${roomName}`);
            await pushRealtimeTrackerSnapshot(tab, filters, "subscribe");
          } catch (error) {
            log.error("Error subscribing to realtime tracker", { error });
          }
        },
      );

      socket.on(
        "unsubscribe_realtime_tracker",
        async (payload: {
          tab?: "affiliation" | "fee_mis";
          filters?: Record<string, unknown>;
        }) => {
          try {
            const tab = payload?.tab === "fee_mis" ? "fee_mis" : "affiliation";
            const { parseRealtimeTrackerFilters } =
              await import("@/utils/realtime-tracker-filters.js");
            const { getRealtimeTrackerRoomName } =
              await import("@/features/realtime-tracker/realtime-tracker.socket.js");
            const filters = canonicalRealtimeTrackerFilters(
              parseRealtimeTrackerFilters(payload?.filters ?? {}),
            );
            const roomName = getRealtimeTrackerRoomName(tab, filters);
            socket.leave(roomName);
            log.debug(`Socket ${socket.id} left ${roomName}`);
          } catch (error) {
            log.error("Error unsubscribing from realtime tracker", { error });
          }
        },
      );

      socket.on("subscribe_library_entry_exit", () => {
        try {
          socket.join("library_entry_exit_page");
          log.debug(`Socket ${socket.id} joined room: library_entry_exit_page`);
        } catch (error) {
          log.error("Error subscribing to library entry/exit room", { error });
        }
      });

      socket.on("unsubscribe_library_entry_exit", () => {
        try {
          socket.leave("library_entry_exit_page");
          log.debug(`Socket ${socket.id} left room: library_entry_exit_page`);
        } catch (error) {
          log.error("Error unsubscribing from library entry/exit room", {
            error,
          });
        }
      });

      socket.on("subscribe_library_journal", () => {
        try {
          socket.join("library_journal_page");
          log.debug(`Socket ${socket.id} joined room: library_journal_page`);
        } catch (error) {
          log.error("Error subscribing to library journal room", { error });
        }
      });

      socket.on("unsubscribe_library_journal", () => {
        try {
          socket.leave("library_journal_page");
          log.debug(`Socket ${socket.id} left room: library_journal_page`);
        } catch (error) {
          log.error("Error unsubscribing from library journal room", { error });
        }
      });

      socket.on("subscribe_library_copy_details", () => {
        try {
          socket.join("library_copy_details_page");
          log.debug(
            `Socket ${socket.id} joined room: library_copy_details_page`,
          );
        } catch (error) {
          log.error("Error subscribing to library copy details room", {
            error,
          });
        }
      });

      socket.on("unsubscribe_library_copy_details", () => {
        try {
          socket.leave("library_copy_details_page");
          log.debug(`Socket ${socket.id} left room: library_copy_details_page`);
        } catch (error) {
          log.error("Error unsubscribing from library copy details room", {
            error,
          });
        }
      });

      socket.on("subscribe_library_copy_bulk_upload", (jobId: string) => {
        if (!jobId || typeof jobId !== "string") return;
        try {
          socket.join(`library_copy_bulk_upload_${jobId}`);
        } catch (error) {
          log.error("Error subscribing to copy bulk upload room", { error });
        }
      });

      socket.on("unsubscribe_library_copy_bulk_upload", (jobId: string) => {
        if (!jobId || typeof jobId !== "string") return;
        try {
          socket.leave(`library_copy_bulk_upload_${jobId}`);
        } catch (error) {
          log.error("Error unsubscribing from copy bulk upload room", {
            error,
          });
        }
      });

      socket.on("subscribe_library_books", () => {
        try {
          socket.join("library_books_page");
          log.debug(`Socket ${socket.id} joined room: library_books_page`);
        } catch (error) {
          log.error("Error subscribing to library books room", { error });
        }
      });

      socket.on("unsubscribe_library_books", () => {
        try {
          socket.leave("library_books_page");
          log.debug(`Socket ${socket.id} left room: library_books_page`);
        } catch (error) {
          log.error("Error unsubscribing from library books room", { error });
        }
      });

      socket.on("subscribe_library_book_circulation", () => {
        try {
          socket.join("library_book_circulation_page");
          log.debug(
            `Socket ${socket.id} joined room: library_book_circulation_page`,
          );
        } catch (error) {
          log.error("Error subscribing to library book circulation room", {
            error,
          });
        }
      });

      socket.on("unsubscribe_library_book_circulation", () => {
        try {
          socket.leave("library_book_circulation_page");
          log.debug(
            `Socket ${socket.id} left room: library_book_circulation_page`,
          );
        } catch (error) {
          log.error("Error unsubscribing from library book circulation room", {
            error,
          });
        }
      });

      socket.on("subscribe_library_racks", () => {
        try {
          socket.join("library_racks_page");
          log.debug(`Socket ${socket.id} joined room: library_racks_page`);
        } catch (error) {
          log.error("Error subscribing to library racks room", { error });
        }
      });

      socket.on("unsubscribe_library_racks", () => {
        try {
          socket.leave("library_racks_page");
          log.debug(`Socket ${socket.id} left room: library_racks_page`);
        } catch (error) {
          log.error("Error unsubscribing from library racks room", { error });
        }
      });

      socket.on("subscribe_library_shelves", () => {
        try {
          socket.join("library_shelves_page");
          log.debug(`Socket ${socket.id} joined room: library_shelves_page`);
        } catch (error) {
          log.error("Error subscribing to library shelves room", { error });
        }
      });

      socket.on("unsubscribe_library_shelves", () => {
        try {
          socket.leave("library_shelves_page");
          log.debug(`Socket ${socket.id} left room: library_shelves_page`);
        } catch (error) {
          log.error("Error unsubscribing from library shelves room", {
            error,
          });
        }
      });

      socket.on("subscribe_library_status", () => {
        try {
          socket.join("library_status_page");
          log.debug(`Socket ${socket.id} joined room: library_status_page`);
        } catch (error) {
          log.error("Error subscribing to library status room", { error });
        }
      });

      socket.on("unsubscribe_library_status", () => {
        try {
          socket.leave("library_status_page");
          log.debug(`Socket ${socket.id} left room: library_status_page`);
        } catch (error) {
          log.error("Error unsubscribing from library status room", {
            error,
          });
        }
      });

      socket.on("subscribe_library_articles", () => {
        try {
          socket.join("library_articles_page");
          log.debug(`Socket ${socket.id} joined room: library_articles_page`);
        } catch (error) {
          log.error("Error subscribing to library articles room", { error });
        }
      });

      socket.on("unsubscribe_library_articles", () => {
        try {
          socket.leave("library_articles_page");
          log.debug(`Socket ${socket.id} left room: library_articles_page`);
        } catch (error) {
          log.error("Error unsubscribing from library articles room", {
            error,
          });
        }
      });

      socket.on("subscribe_library_document_types", () => {
        try {
          socket.join("library_document_types_page");
          log.debug(
            `Socket ${socket.id} joined room: library_document_types_page`,
          );
        } catch (error) {
          log.error("Error subscribing to library document types room", {
            error,
          });
        }
      });

      socket.on("unsubscribe_library_document_types", () => {
        try {
          socket.leave("library_document_types_page");
          log.debug(
            `Socket ${socket.id} left room: library_document_types_page`,
          );
        } catch (error) {
          log.error("Error unsubscribing from library document types room", {
            error,
          });
        }
      });

      socket.on("subscribe_library_journal_types", () => {
        try {
          socket.join("library_journal_types_page");
          log.debug(
            `Socket ${socket.id} joined room: library_journal_types_page`,
          );
        } catch (error) {
          log.error("Error subscribing to library journal types room", {
            error,
          });
        }
      });

      socket.on("unsubscribe_library_journal_types", () => {
        try {
          socket.leave("library_journal_types_page");
          log.debug(
            `Socket ${socket.id} left room: library_journal_types_page`,
          );
        } catch (error) {
          log.error("Error unsubscribing from library journal types room", {
            error,
          });
        }
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        try {
          this.removeSocket(socket.id);
          log.debug(`Client disconnected: ${socket.id}`);
          // Emit active users update after removal
          this.broadcastActiveUsers();
        } catch (error) {
          log.error(`Error handling disconnect for ${socket.id}`, { error });
        }
      });
    });
  }

  // Register a user with their socket ID and fetch user info
  private async registerUser(userId: string, socketId: string) {
    this.socketToUserId.set(socketId, userId);

    const existingSockets = this.activeConnections.get(userId);
    if (!existingSockets || existingSockets.size === 0) {
      this.userConnectedAt.set(userId, new Date());
    }

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
        log.error(`Error fetching user info for ${userId}`, { error });
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
          this.userConnectedAt.delete(userId);
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

  public getOnlineStudentLoginTime(userId: number): string | null {
    const connectedAt = this.userConnectedAt.get(String(userId));
    return connectedAt ? connectedAt.toISOString() : null;
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
      log.debug(`Active users broadcast: ${activeUsers.length} users`);
    } catch (error) {
      log.error("Error broadcasting active users", { error });
    }
  }

  // Send notification to all connected clients
  sendNotificationToAll(notification: Notification) {
    if (!this.io) {
      log.error("Cannot send notification: io is null");
      return;
    }

    try {
      this.io.emit("notification", notification);
      log.debug(`Broadcast notification: ${notification.message}`);
    } catch (error) {
      log.error("Error sending notification to all", { error });
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
      log.error("Error sending notification to multiple users", { error });
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
      log.error("Cannot send progress update: io is null");
      return;
    }

    try {
      this.io.to(`user:${userId}`).emit("progress_update", progressUpdate);
      log.debug(
        `Progress → user ${userId}: ${progressUpdate.message} (${progressUpdate.progress}%)`,
      );
    } catch (error) {
      log.error(`Error sending progress update to user ${userId}`, { error });
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
      log.error("Cannot send MIS table update: io is null");
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
      log.debug(`MIS update → room ${roomName} (${data.length} records)`);
    } catch (error) {
      log.error("Error sending MIS table update", { error });
    }
  }

  private realtimeTrackerRoom(
    tab: "affiliation" | "fee_mis",
    filters: Record<string, unknown>,
  ): string {
    const parsed = canonicalRealtimeTrackerFilters(
      parseRealtimeTrackerFilters(filters),
    );
    return getRealtimeTrackerRoomName(tab, parsed);
  }

  sendAffiliationRegistrationUpdate(
    filters: Record<string, unknown>,
    payload: Record<string, unknown>,
    reason?: string,
  ) {
    if (!this.io) return;
    try {
      const roomName = this.realtimeTrackerRoom("affiliation", filters);
      const message = { ...payload, reason, filters };
      this.io.to(roomName).emit("affiliation_registration_update", message);
    } catch (error) {
      log.error("Error sending affiliation registration update", { error });
    }
  }

  sendFeeMisUpdate(
    filters: Record<string, unknown>,
    payload: Record<string, unknown>,
    reason?: string,
  ) {
    if (!this.io) return;
    try {
      const roomName = this.realtimeTrackerRoom("fee_mis", filters);
      const message = { ...payload, reason, filters };
      this.io.to(roomName).emit("fee_mis_update", message);
    } catch (error) {
      log.error("Error sending fee MIS update", { error });
    }
  }

  /** Tell all clients to refetch Fee MIS (fee activity uses many filter rooms). */
  emitFeeMisRefresh(reason: string) {
    if (!this.io) return;
    this.io.emit("fee_mis_refresh", {
      reason,
      updatedAt: new Date().toISOString(),
    });
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
      log.error("Cannot send MIS table update to all: io is null");
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
      log.debug(`MIS update → all clients (${data.length} records)`);
    } catch (error) {
      log.error("Error sending MIS table update to all", { error });
    }
  }

  sendLibraryEntryExitUpdate(payload: {
    action: "CHECKED_IN" | "CHECKED_OUT";
    userId: number;
    userName: string;
    meta?: Record<string, unknown>;
  }) {
    if (!this.io) {
      log.error("Cannot send library entry/exit update: io is null");
      return;
    }

    try {
      const update: LibraryEntryExitUpdate = {
        id: `library_entry_exit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type: "library_entry_exit_update",
        action: payload.action,
        userId: payload.userId,
        userName: payload.userName,
        message:
          payload.action === "CHECKED_IN"
            ? `${payload.userName} entered the library`
            : `${payload.userName} exited the library`,
        updatedAt: new Date().toISOString(),
        meta: payload.meta,
      };

      this.io
        .to("library_entry_exit_page")
        .emit("library_entry_exit_update", update);
      log.debug(
        `Library entry/exit update broadcasted to page room: ${update.message}`,
      );
    } catch (error) {
      log.error("Error sending library entry/exit update", { error });
    }
  }

  sendLibraryJournalUpdate(payload: {
    action: "CREATED" | "UPDATED" | "DELETED";
    actorName: string;
    journalId: number;
    journalTitle: string;
    meta?: Record<string, unknown>;
  }) {
    if (!this.io) {
      log.error("Cannot send library journal update: io is null");
      return;
    }

    try {
      const verb =
        payload.action === "CREATED"
          ? "added"
          : payload.action === "UPDATED"
            ? "updated"
            : "deleted";
      const title = payload.journalTitle.trim() || "Untitled";
      const actor = payload.actorName.trim() || "Someone";
      const message = `${actor} ${verb} journal "${title}"`;

      const update: LibraryJournalUpdate = {
        id: `library_journal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type: "library_journal_update",
        action: payload.action,
        actorName: actor,
        journalId: payload.journalId,
        journalTitle: title,
        message,
        updatedAt: new Date().toISOString(),
        meta: payload.meta,
      };

      this.io.to("library_journal_page").emit("library_journal_update", update);
      log.debug(`Library journal update broadcasted to page room: ${message}`);
    } catch (error) {
      log.error("Error sending library journal update", { error });
    }
  }

  sendLibraryCopyDetailsUpdate(payload: {
    action: "CREATED" | "UPDATED" | "DELETED";
    actorName: string;
    copyDetailsId: number;
    bookTitle: string;
    meta?: Record<string, unknown>;
  }) {
    if (!this.io) {
      log.error("Cannot send library copy details update: io is null");
      return;
    }

    try {
      const verb =
        payload.action === "CREATED"
          ? "added"
          : payload.action === "DELETED"
            ? "deleted"
            : "updated";
      const title = payload.bookTitle.trim() || "Untitled book";
      const actor = payload.actorName.trim() || "Someone";
      const message = `${actor} ${verb} a copy for "${title}"`;

      const update: LibraryCopyDetailsUpdate = {
        id: `library_copy_details_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type: "library_copy_details_update",
        action: payload.action,
        actorName: actor,
        copyDetailsId: payload.copyDetailsId,
        bookTitle: title,
        message,
        updatedAt: new Date().toISOString(),
        meta: payload.meta,
      };

      this.io
        .to("library_copy_details_page")
        .emit("library_copy_details_update", update);
      log.debug(
        `Library copy details update broadcasted to page room: ${message}`,
      );
    } catch (error) {
      log.error("Error sending library copy details update", { error });
    }
  }

  sendLibraryCopyBulkUploadProgress(payload: {
    jobId: string;
    bookId: number;
    status: "STARTED" | "ROW" | "COMPLETED";
    processed: number;
    succeeded: number;
    failed: number;
    total: number;
    lastError?: { row: number; message: string } | null;
    errors?: Array<{ row: number; message: string }>;
  }) {
    if (!this.io) {
      log.error("Cannot send copy bulk upload progress: io is null");
      return;
    }
    try {
      const room = `library_copy_bulk_upload_${payload.jobId}`;
      this.io.to(room).emit("library_copy_bulk_upload_progress", {
        ...payload,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      log.error("Error sending copy bulk upload progress", { error });
    }
  }

  sendLibraryBookUpdate(payload: {
    action: "CREATED" | "UPDATED" | "DELETED";
    actorName: string;
    bookId: number;
    bookTitle: string;
    meta?: Record<string, unknown>;
  }) {
    if (!this.io) {
      log.error("Cannot send library book update: io is null");
      return;
    }

    try {
      const verb =
        payload.action === "CREATED"
          ? "added"
          : payload.action === "UPDATED"
            ? "updated"
            : "deleted";
      const title = payload.bookTitle.trim() || "Untitled book";
      const actor = payload.actorName.trim() || "Someone";
      const message = `${actor} ${verb} book "${title}"`;

      const update: LibraryBookUpdate = {
        id: `library_book_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type: "library_book_update",
        action: payload.action,
        actorName: actor,
        bookId: payload.bookId,
        bookTitle: title,
        message,
        updatedAt: new Date().toISOString(),
        meta: payload.meta,
      };

      this.io.to("library_books_page").emit("library_book_update", update);
      log.debug(`Library book update broadcasted to page room: ${message}`);
    } catch (error) {
      log.error("Error sending library book update", { error });
    }
  }

  broadcastAcademicActivityUpdate(payload?: {
    activityName?: string;
    masterId?: number;
    action?: "created" | "updated" | "deleted";
  }) {
    if (!this.io) {
      log.error("Cannot send academic activity update: io is null");
      return;
    }

    try {
      this.io.emit("academic_activity_student_console_updated", {
        activityName: payload?.activityName,
        masterId: payload?.masterId,
        action: payload?.action,
        timestamp: new Date().toISOString(),
      });
      log.debug(
        `Academic activity update broadcasted: ${payload?.action || "unknown"} (master: ${payload?.masterId || "N/A"})`,
      );
    } catch (error) {
      log.error("Error broadcasting academic activity update", { error });
    }
  }

  sendLibraryBookCirculationUpdate(payload: {
    action: "UPSERTED";
    actorUserId: number | null;
    actorName: string;
    userId: number;
    meta?: Record<string, unknown>;
  }) {
    if (!this.io) {
      log.error("Cannot send library book circulation update: io is null");
      return;
    }

    try {
      const actor = payload.actorName.trim() || "Someone";
      const message = `${actor} updated book circulation entries`;
      const update: LibraryBookCirculationUpdate = {
        id: `library_book_circulation_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type: "library_book_circulation_update",
        action: payload.action,
        actorUserId: payload.actorUserId,
        actorName: actor,
        userId: payload.userId,
        message,
        updatedAt: new Date().toISOString(),
        meta: payload.meta,
      };

      this.io
        .to("library_book_circulation_page")
        .emit("library_book_circulation_update", update);
      log.debug(
        `Library book circulation update broadcasted to page room: ${message}`,
      );
    } catch (error) {
      log.error("Error sending library book circulation update", { error });
    }
  }

  sendLibraryRackUpdate(payload: {
    action: "CREATED" | "UPDATED" | "DELETED";
    actorName: string;
    rackId: number;
    rackName: string;
    meta?: Record<string, unknown>;
  }) {
    if (!this.io) {
      log.error("Cannot send library rack update: io is null");
      return;
    }

    try {
      const verb =
        payload.action === "CREATED"
          ? "added"
          : payload.action === "UPDATED"
            ? "updated"
            : "deleted";
      const name = payload.rackName.trim() || "Untitled rack";
      const actor = payload.actorName.trim() || "Someone";
      const message = `${actor} ${verb} rack "${name}"`;

      const update: LibraryRackUpdate = {
        id: `library_rack_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type: "library_rack_update",
        action: payload.action,
        actorName: actor,
        rackId: payload.rackId,
        rackName: name,
        message,
        updatedAt: new Date().toISOString(),
        meta: payload.meta,
      };

      this.io.to("library_racks_page").emit("library_rack_update", update);
      log.debug(`Library rack update broadcasted to page room: ${message}`);
    } catch (error) {
      log.error("Error sending library rack update", { error });
    }
  }

  sendLibraryShelfUpdate(payload: {
    action: "CREATED" | "UPDATED" | "DELETED";
    actorName: string;
    shelfId: number;
    shelfName: string;
    meta?: Record<string, unknown>;
  }) {
    if (!this.io) {
      log.error("Cannot send library shelf update: io is null");
      return;
    }

    try {
      const verb =
        payload.action === "CREATED"
          ? "added"
          : payload.action === "UPDATED"
            ? "updated"
            : "deleted";
      const name = payload.shelfName.trim() || "Untitled shelf";
      const actor = payload.actorName.trim() || "Someone";
      const message = `${actor} ${verb} shelf "${name}"`;

      const update: LibraryShelfUpdate = {
        id: `library_shelf_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type: "library_shelf_update",
        action: payload.action,
        actorName: actor,
        shelfId: payload.shelfId,
        shelfName: name,
        message,
        updatedAt: new Date().toISOString(),
        meta: payload.meta,
      };

      this.io.to("library_shelves_page").emit("library_shelf_update", update);
      log.debug(`Library shelf update broadcasted to page room: ${message}`);
    } catch (error) {
      log.error("Error sending library shelf update", { error });
    }
  }

  sendLibraryStatusUpdate(payload: {
    action: "CREATED" | "UPDATED" | "DELETED";
    actorName: string;
    statusId: number;
    statusName: string;
    meta?: Record<string, unknown>;
  }) {
    if (!this.io) {
      log.error("Cannot send library status update: io is null");
      return;
    }

    try {
      const verb =
        payload.action === "CREATED"
          ? "added"
          : payload.action === "UPDATED"
            ? "updated"
            : "deleted";
      const name = payload.statusName.trim() || "Untitled status";
      const actor = payload.actorName.trim() || "Someone";
      const message = `${actor} ${verb} status "${name}"`;

      const update: LibraryStatusUpdate = {
        id: `library_status_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type: "library_status_update",
        action: payload.action,
        actorName: actor,
        statusId: payload.statusId,
        statusName: name,
        message,
        updatedAt: new Date().toISOString(),
        meta: payload.meta,
      };

      this.io.to("library_status_page").emit("library_status_update", update);
      log.debug(`Library status update broadcasted to page room: ${message}`);
    } catch (error) {
      log.error("Error sending library status update", { error });
    }
  }

  sendLibraryArticleUpdate(payload: {
    action: "CREATED" | "UPDATED" | "DELETED";
    actorName: string;
    articleId: number;
    articleName: string;
    meta?: Record<string, unknown>;
  }) {
    if (!this.io) {
      log.error("Cannot send library article update: io is null");
      return;
    }

    try {
      const verb =
        payload.action === "CREATED"
          ? "added"
          : payload.action === "UPDATED"
            ? "updated"
            : "deleted";
      const name = payload.articleName.trim() || "Untitled article";
      const actor = payload.actorName.trim() || "Someone";
      const message = `${actor} ${verb} article "${name}"`;

      const update: LibraryArticleUpdate = {
        id: `library_article_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type: "library_article_update",
        action: payload.action,
        actorName: actor,
        articleId: payload.articleId,
        articleName: name,
        message,
        updatedAt: new Date().toISOString(),
        meta: payload.meta,
      };

      this.io
        .to("library_articles_page")
        .emit("library_article_update", update);
      log.debug(`Library article update broadcasted to page room: ${message}`);
    } catch (error) {
      log.error("Error sending library article update", { error });
    }
  }

  sendLibraryDocumentTypeUpdate(payload: {
    action: "CREATED" | "UPDATED" | "DELETED";
    actorName: string;
    documentTypeId: number;
    documentTypeName: string;
    meta?: Record<string, unknown>;
  }) {
    if (!this.io) {
      log.error("Cannot send library document type update: io is null");
      return;
    }

    try {
      const verb =
        payload.action === "CREATED"
          ? "added"
          : payload.action === "UPDATED"
            ? "updated"
            : "deleted";
      const name = payload.documentTypeName.trim() || "Untitled document type";
      const actor = payload.actorName.trim() || "Someone";
      const message = `${actor} ${verb} document type "${name}"`;

      const update: LibraryDocumentTypeUpdate = {
        id: `library_document_type_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type: "library_document_type_update",
        action: payload.action,
        actorName: actor,
        documentTypeId: payload.documentTypeId,
        documentTypeName: name,
        message,
        updatedAt: new Date().toISOString(),
        meta: payload.meta,
      };

      this.io
        .to("library_document_types_page")
        .emit("library_document_type_update", update);
      log.debug(
        `Library document type update broadcasted to page room: ${message}`,
      );
    } catch (error) {
      log.error("Error sending library document type update", { error });
    }
  }

  sendLibraryJournalTypeUpdate(payload: {
    action: "CREATED" | "UPDATED" | "DELETED";
    actorName: string;
    journalTypeId: number;
    journalTypeName: string;
    meta?: Record<string, unknown>;
  }) {
    if (!this.io) {
      log.error("Cannot send library journal type update: io is null");
      return;
    }

    try {
      const verb =
        payload.action === "CREATED"
          ? "added"
          : payload.action === "UPDATED"
            ? "updated"
            : "deleted";
      const name = payload.journalTypeName.trim() || "Untitled journal type";
      const actor = payload.actorName.trim() || "Someone";
      const message = `${actor} ${verb} journal type "${name}"`;

      const update: LibraryJournalTypeUpdate = {
        id: `library_journal_type_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type: "library_journal_type_update",
        action: payload.action,
        actorName: actor,
        journalTypeId: payload.journalTypeId,
        journalTypeName: name,
        message,
        updatedAt: new Date().toISOString(),
        meta: payload.meta,
      };

      this.io
        .to("library_journal_types_page")
        .emit("library_journal_type_update", update);
      log.debug(
        `Library journal type update broadcasted to page room: ${message}`,
      );
    } catch (error) {
      log.error("Error sending library journal type update", { error });
    }
  }

  sendFeesDashboardUpdate(payload: { updatedAt: string; reason: string }) {
    if (!this.io) {
      log.error("Cannot send fees dashboard update: io is null");
      return;
    }

    try {
      const update: FeesDashboardUpdate = {
        id: `fees_dashboard_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type: "fees_dashboard_update",
        updatedAt: payload.updatedAt,
        reason: payload.reason,
      };

      this.io.to("fees_dashboard").emit("fees_dashboard_updated", update);
      log.debug(`Fees dashboard update → fees_dashboard (${payload.reason})`);
    } catch (error) {
      log.error("Error sending fees dashboard update", { error });
    }
  }

  /**
   * Broadcast a generic data-change to everyone viewing `resource` (its room),
   * so other online users on that page can refresh. Used by `resourceRealtime`.
   */
  emitResourceChanged(
    resource: string,
    meta: { action: string; path?: string },
  ) {
    if (!this.io) return;
    try {
      this.io.to(`resource:${resource}`).emit("resource_changed", {
        resource,
        action: meta.action,
        path: meta.path,
        at: Date.now(),
      });
    } catch (error) {
      log.error("Error emitting resource_changed", { error });
    }
  }
}

// Export as singleton
export const socketService = new SocketService();
