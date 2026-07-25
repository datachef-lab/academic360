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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  // Latest userId, so the (once-created) connect handler always authenticates
  // with the current id. userId starts "" before auth resolves; without this
  // the connect-time emit would capture the empty string and the client would
  // never join its user:<id> room, so progress events never arrive.
  const userIdRef = useRef<string | undefined>(userId);
  userIdRef.current = userId;

  const handleProgressUpdate = useCallback(
    (data: ProgressUpdate) => {
      if (onProgressUpdate) {
        onProgressUpdate(data);
      }
    },
    [onProgressUpdate],
  );

  const handleNotification = useCallback(
    (data: unknown) => {
      if (onNotification) {
        onNotification(data);
      }
    },
    [onNotification],
  );

  useEffect(() => {
    if (socketRef.current) {
      return;
    }

    const backendEnv = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000";
    const parsed = new URL(backendEnv);
    const origin = `${parsed.protocol}//${parsed.host}`;
    const pathPrefix = parsed.pathname.replace(/\/$/, "");
    const socketPath = pathPrefix ? `${pathPrefix}/socket.io` : "/socket.io";

    const nextSocket = io(origin, {
      path: socketPath,
      withCredentials: false,
      transports: ["websocket", "polling"],
    });

    socketRef.current = nextSocket;
    setSocket(nextSocket);

    nextSocket.on("connect", () => {
      setIsConnected(true);
      setError(null);
      const currentUserId = userIdRef.current;
      if (currentUserId) {
        nextSocket.emit("authenticate", String(currentUserId));
      }
    });

    nextSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    nextSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setError(err.message);
      setIsConnected(false);
    });

    return () => {
      nextSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      (window as unknown as { socket: Socket | null }).socket = null;
    };
  }, [userId]);

  useEffect(() => {
    const activeSocket = socketRef.current;
    if (!activeSocket) return;

    activeSocket.off("progress_update", handleProgressUpdate);
    activeSocket.off("download_progress", handleProgressUpdate);
    activeSocket.off("notification", handleNotification);

    activeSocket.on("progress_update", handleProgressUpdate);
    activeSocket.on("download_progress", handleProgressUpdate);
    activeSocket.on("notification", handleNotification);

    return () => {
      activeSocket.off("progress_update", handleProgressUpdate);
      activeSocket.off("download_progress", handleProgressUpdate);
      activeSocket.off("notification", handleNotification);
    };
  }, [socket, handleProgressUpdate, handleNotification]);

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
  }, []);

  return {
    socket,
    isConnected,
    error,
    emit,
    disconnect,
  };
}
