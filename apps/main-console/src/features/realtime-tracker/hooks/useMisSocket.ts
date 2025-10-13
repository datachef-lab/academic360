import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { MisTableUpdate, MisTableData, MisFilters } from "../types/mis-types";

interface UseMisSocketOptions {
  userId?: string;
  filters?: MisFilters;
  onUpdate?: (data: MisTableData) => void;
  onError?: (error: string) => void;
}

interface UseMisSocketResult {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  data: MisTableData | null;
  lastUpdate: string | null;
  connect: () => void;
  disconnect: () => void;
  updateFilters: (filters: MisFilters) => void;
}

export function useMisSocket(options: UseMisSocketOptions = {}): UseMisSocketResult {
  const { userId, filters = {}, onUpdate, onError } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MisTableData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const currentFiltersRef = useRef<MisFilters>(filters);

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setIsLoading(true);
    setError(null);

    try {
      const backendEnv = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000";
      const parsed = new URL(backendEnv);
      const origin = `${parsed.protocol}//${parsed.host}`;
      const pathPrefix = parsed.pathname.replace(/\/$/, "");
      const socketPath = pathPrefix ? `${pathPrefix}/socket.io` : "/socket.io";

      const socket = io(origin, {
        path: socketPath,
        withCredentials: true,
        transports: ["websocket", "polling"],
      });

      socketRef.current = socket;

      // Connection event handlers
      socket.on("connect", () => {
        console.log("[MisSocket] Connected:", socket.id);
        setIsConnected(true);
        setIsLoading(false);
        setError(null);

        // Authenticate with user ID if provided
        if (userId) {
          socket.emit("authenticate", userId);
        }

        // Subscribe to MIS dashboard with current filters
        socket.emit("subscribe_mis_dashboard", currentFiltersRef.current);
      });

      socket.on("disconnect", () => {
        console.log("[MisSocket] Disconnected");
        setIsConnected(false);
        setIsLoading(false);
      });

      socket.on("connect_error", (err) => {
        console.error("[MisSocket] Connection error:", err);
        setError(err.message);
        setIsConnected(false);
        setIsLoading(false);
        onError?.(err.message);
      });

      // MIS table update handler
      socket.on("mis_table_update", (update: MisTableUpdate) => {
        console.log("[MisSocket] Received MIS update:", update);

        const misData: MisTableData = {
          updatedAt: update.updatedAt,
          sessionId: update.sessionId,
          classId: update.classId,
          data: update.data,
        };

        setData(misData);
        setLastUpdate(update.updatedAt);
        onUpdate?.(misData);
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to connect";
      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);
    }
  }, [userId, onUpdate, onError]);

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsLoading(false);
  }, []);

  // Update filters and resubscribe
  const updateFilters = useCallback((newFilters: MisFilters) => {
    currentFiltersRef.current = newFilters;

    if (socketRef.current?.connected) {
      // Unsubscribe from current room
      socketRef.current.emit("unsubscribe_mis_dashboard", currentFiltersRef.current);

      // Subscribe to new room
      socketRef.current.emit("subscribe_mis_dashboard", newFilters);
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    // Only connect if we have a userId (user is authenticated) and not already connected
    if (userId && !socketRef.current?.connected) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [userId]); // Remove connect and disconnect from dependencies

  // Update filters when they change
  useEffect(() => {
    if (JSON.stringify(currentFiltersRef.current) !== JSON.stringify(filters)) {
      updateFilters(filters);
    }
  }, [filters]); // Remove updateFilters from dependencies

  return {
    isConnected,
    isLoading,
    error,
    data,
    lastUpdate,
    connect,
    disconnect,
    updateFilters,
  };
}
