import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { ProgressUpdate } from "@/types/progress";

interface UseSocketOptions {
  userId?: string;
  onProgressUpdate?: (data: ProgressUpdate) => void;
  onNotification?: (data: unknown) => void;
}

interface UseSocketResult {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  emit: (event: string, data?: unknown) => void;
  disconnect: () => void;
}

export function useSocket(options: UseSocketOptions = {}): UseSocketResult {
  const { userId, onProgressUpdate, onNotification } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

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
    (data: unknown) => {
      console.log("Notification received:", data);
      if (onNotification) {
        onNotification(data);
      }
    },
    [onNotification],
  );

  useEffect(() => {
    // Only create socket if it doesn't exist
    if (socketRef.current?.connected) {
      console.log("Socket already connected, skipping re-initialization");
      return;
    }

    // Initialize socket connection
    const backendEnv = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000";
    // Support backends mounted under a path prefix like `/backend`
    const parsed = new URL(backendEnv);
    const origin = `${parsed.protocol}//${parsed.host}`;
    const pathPrefix = parsed.pathname.replace(/\/$/, "");
    const socketPath = pathPrefix ? `${pathPrefix}/socket.io` : "/socket.io";

    const socket = io(origin, {
      path: socketPath,
      withCredentials: false,
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

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      (window as unknown as { socket: Socket | null }).socket = null;
    };
  }, [userId]); // Only depend on userId, not callbacks

  // Set up event listeners separately - this allows callbacks to change without recreating socket
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Remove old listeners before adding new ones
    socket.off("progress_update", handleProgressUpdate);
    socket.off("download_progress", handleProgressUpdate);
    socket.off("notification", handleNotification);

    // Add new listeners
    socket.on("progress_update", handleProgressUpdate);
    socket.on("download_progress", handleProgressUpdate);
    socket.on("notification", handleNotification);

    return () => {
      socket.off("progress_update", handleProgressUpdate);
      socket.off("download_progress", handleProgressUpdate);
      socket.off("notification", handleNotification);
    };
  }, [handleProgressUpdate, handleNotification]);

  // Re-authenticate when userId changes
  useEffect(() => {
    if (socketRef.current && userId && isConnected) {
      socketRef.current.emit("authenticate", userId);
    }
  }, [userId, isConnected]);

  const emit = (event: string, data?: unknown) => {
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
