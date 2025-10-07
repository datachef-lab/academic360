import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

interface ProgressUpdate {
  id: string;
  userId: string;
  type: "export_progress";
  message: string;
  progress: number;
  status: "started" | "in_progress" | "completed" | "error";
  fileName?: string;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
  meta?: Record<string, unknown>;
}

interface UseSocketOptions {
  userId?: string;
  onProgressUpdate?: (data: ProgressUpdate) => void;
  onNotification?: (data: any) => void;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { userId, onProgressUpdate, onNotification } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Debug: Log hook usage
  console.log("useSocket hook called", { userId, isConnected, error });

  // Memoize event handlers to prevent infinite re-renders
  const handleProgressUpdate = useCallback(
    (data: ProgressUpdate) => {
      console.log("Progress update received:", data);
      if (onProgressUpdate) {
        onProgressUpdate(data);
      }
    },
    [onProgressUpdate],
  );

  const handleNotification = useCallback(
    (data: any) => {
      console.log("Notification received:", data);
      if (onNotification) {
        onNotification(data);
      }
    },
    [onNotification],
  );

  useEffect(() => {
    // Initialize socket connection
    const socket = io(import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      setIsConnected(true);
      setError(null);

      // Authenticate with user ID if provided
      if (userId) {
        socket.emit("authenticate", userId);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError(err.message);
      setIsConnected(false);
    });

    // Progress update handler
    socket.on("progress_update", handleProgressUpdate);

    // Notification handler
    socket.on("notification", handleNotification);

    // Make socket available globally for other components
    (window as any).socket = socket;

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      (window as any).socket = null;
    };
  }, [userId, handleProgressUpdate, handleNotification]);

  // Re-authenticate when userId changes
  useEffect(() => {
    if (socketRef.current && userId && isConnected) {
      socketRef.current.emit("authenticate", userId);
    }
  }, [userId, isConnected]);

  const emit = (event: string, data?: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    error,
    emit,
    disconnect,
  };
}
