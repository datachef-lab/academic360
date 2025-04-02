import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

// Match the notification type definition from backend
export interface Notification {
  id: string;
  userId?: string;
  type: 'upload' | 'edit' | 'update' | 'info';
  message: string;
  createdAt: Date;
  read: boolean;
  meta?: Record<string, unknown>;
}

// Interface for raw notification data from socket
interface RawNotification {
  id: string;
  userId?: string;
  type: 'upload' | 'edit' | 'update' | 'info';
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
  private userId: string | null = null;
  private connectListeners: ConnectionCallback[] = [];
  private disconnectListeners: ConnectionCallback[] = [];

  // Connect to the socket server
  connect() {
    // Check if we're already connected
    if (this.socket && this.connected) return;

    const serverUrl = import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:5000';
    
    try {
      this.socket = io(serverUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      // Set up event listeners
      this.socket.on('connect', this.handleConnect);
      this.socket.on('disconnect', this.handleDisconnect);
      this.socket.on('notification', this.handleNotification);
      this.socket.on('connect_error', this.handleError);

      console.log('[SocketService] Attempting to connect to server...');
    } catch (error) {
      console.error('[SocketService] Error initializing socket:', error);
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
    this.connectListeners = this.connectListeners.filter(cb => cb !== onConnect);
    this.disconnectListeners = this.disconnectListeners.filter(cb => cb !== onDisconnect);
  }

  // Authenticate the socket with user ID
  authenticate(userId: string) {
    if (!this.socket || !this.connected) {
      console.warn('[SocketService] Cannot authenticate - socket not connected');
      return;
    }

    this.userId = userId;
    this.socket.emit('authenticate', userId);
    console.log(`[SocketService] Authenticated user: ${userId}`);
  }

  // Disconnect from the server
  disconnect() {
    if (!this.socket) return;
    
    try {
      this.socket.off('connect', this.handleConnect);
      this.socket.off('disconnect', this.handleDisconnect);
      this.socket.off('notification', this.handleNotification);
      this.socket.off('connect_error', this.handleError);
      
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.userId = null;
      
      console.log('[SocketService] Disconnected from server');
    } catch (error) {
      console.error('[SocketService] Error disconnecting socket:', error);
    }
  }

  // Add a notification listener 
  addNotificationListener(callback: NotificationCallback) {
    this.notificationListeners.push(callback);
    return () => this.removeNotificationListener(callback);
  }

  // Remove a notification listener
  removeNotificationListener(callback: NotificationCallback) {
    this.notificationListeners = this.notificationListeners.filter(cb => cb !== callback);
  }

  // Event handlers
  private handleConnect = () => {
    this.connected = true;
    console.log('[SocketService] Connected to server');
    
    // Notify all connect listeners
    this.connectListeners.forEach(listener => listener());
    
    // Show toast notification for connection
    toast("Connected to server", {
      description: "Real-time notifications are enabled",
      icon: "🔌",
    });
    
    // Re-authenticate if we had a userId
    if (this.userId) {
      this.authenticate(this.userId);
    }
  };

  private handleDisconnect = () => {
    this.connected = false;
    console.log('[SocketService] Disconnected from server');
    
    // Notify all disconnect listeners
    this.disconnectListeners.forEach(listener => listener());
    
    // Show toast notification for disconnection
    toast("Disconnected from server", {
      description: "Real-time notifications are disabled",
      icon: "⚠️",
    });
  };

  private handleNotification = (notification: RawNotification) => {
    console.log('[SocketService] Received notification:', notification);
    
    // Ensure the notification has the correct type structure 
    const typedNotification: Notification = {
      ...notification,
      createdAt: notification.createdAt ? new Date(notification.createdAt) : new Date(),
    };
    
    // Show toast notification
    toast(typedNotification.message, {
      description: new Date(typedNotification.createdAt).toLocaleTimeString(),
      icon: this.getIconForNotificationType(typedNotification.type),
      duration: 4000,
    });
    
    // Call all registered listeners
    this.notificationListeners.forEach(callback => callback(typedNotification));
  };

  private handleError = (error: SocketError | Error | unknown) => {
    console.error('[SocketService] Connection error:', error);
    
    // Show toast notification for connection error
    toast("Connection error", {
      description: "Could not connect to notification server",
      icon: "❌",
    });
  };
  
  // Helper functions for UI presentation
  private getToastTypeFromNotification(notification: Notification): 'success' | 'info' | 'warning' | 'error' {
    switch (notification.type) {
      case 'upload':
        return 'success';
      case 'edit':
        return 'info';
      case 'update':
        return 'info';
      default:
        return 'info';
    }
  }
  
  private getIconForNotificationType(type: Notification['type']) {
    switch (type) {
      case 'upload':
        return '📤';
      case 'edit':
        return '✏️';
      case 'update':
        return '🔄';
      case 'info':
      default:
        return 'ℹ️';
    }
  }
}

// Export singleton instance
export const socketService = new SocketService(); 