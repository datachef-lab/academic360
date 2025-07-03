import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';


export interface Notification {
  id: string;
  userId?: string; // Target user ID (if specific to a user)
  userName?: string; // Name of the user who performed the action
  type: 'upload' | 'edit' | 'update' | 'info';
  message: string;
  createdAt: Date;
  read: boolean;
  meta?: Record<string, unknown>; // Additional metadata
}

// Socket service class
class SocketService {
  private io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | null = null;
  private activeConnections: Map<string, Set<string>> = new Map(); // userId -> set of socket IDs

  // Initialize with Socket.IO server instance
  initialize(ioServer: Server) {
    try {
      this.io = ioServer;
      this.setupListeners();
      console.log('[SocketService] Initialized');
    } catch (error) {
      console.error('[SocketService] Error initializing:', error);
    }
  }

  // Set up connection listeners
  private setupListeners() {
    if (!this.io) {
      console.error('[SocketService] Cannot setup listeners: io is null');
      return;
    }

    this.io.on('connection', (socket: Socket) => {
      console.log(`[SocketService] Client connected: ${socket.id}`);

      // Handle user authentication and mapping
      socket.on('authenticate', (userId: string) => {
        try {
          this.registerUser(userId, socket.id);
          socket.join(`user:${userId}`); // Join a room specific to this user
          console.log(`[SocketService] User ${userId} authenticated with socket ${socket.id}`);
        } catch (error) {
          console.error(`[SocketService] Error authenticating user ${userId}:`, error);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        try {
          this.removeSocket(socket.id);
          console.log(`[SocketService] Client disconnected: ${socket.id}`);
        } catch (error) {
          console.error(`[SocketService] Error handling disconnect for ${socket.id}:`, error);
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
      console.error('[SocketService] Cannot send notification: io is null');
      return;
    }
    
    try {
      this.io.emit('notification', notification);
      console.log(`[SocketService] Broadcast notification: ${notification.message}`);
    } catch (error) {
      console.error('[SocketService] Error sending notification to all:', error);
    }
  }

  // Send notification to a specific user
  sendNotificationToUser(userId: string, notification: Notification) {
    if (!this.io) {
      console.error('[SocketService] Cannot send notification: io is null');
      return;
    }
    
    try {
      this.io.to(`user:${userId}`).emit('notification', notification);
      console.log(`[SocketService] Sent notification to user ${userId}: ${notification.message}`);
    } catch (error) {
      console.error(`[SocketService] Error sending notification to user ${userId}:`, error);
    }
  }

  // Send notification to multiple users
  sendNotificationToUsers(userIds: string[], notification: Notification) {
    try {
      userIds.forEach(userId => {
        this.sendNotificationToUser(userId, notification);
      });
    } catch (error) {
      console.error('[SocketService] Error sending notification to multiple users:', error);
    }
  }

  // Create a notification for file upload
  createUploadNotification(filename: string, userId?: string): Notification {
    return {
      id: Date.now().toString(),
      userId,
      type: 'upload',
      message: `File "${filename}" has been uploaded`,
      createdAt: new Date(),
      read: false,
      meta: { filename }
    };
  }

  // Create a notification for edit action
  createEditNotification(itemName: string, userId?: string): Notification {
    return {
      id: Date.now().toString(),
      userId,
      type: 'edit',
      message: `"${itemName}" has been edited`,
      createdAt: new Date(),
      read: false,
      meta: { itemName }
    };
  }

  // Create a notification for update action
  createUpdateNotification(itemName: string, userId?: string): Notification {
    return {
      id: Date.now().toString(),
      userId,
      type: 'update',
      message: `"${itemName}" has been updated`,
      createdAt: new Date(),
      read: false,
      meta: { itemName }
    };
  }
}

// Export as singleton
export const socketService = new SocketService(); 