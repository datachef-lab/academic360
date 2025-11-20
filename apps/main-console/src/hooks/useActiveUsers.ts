import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

export interface ActiveUser {
  id: number;
  name: string;
  image: string | null;
  type: "ADMIN" | "STAFF";
}

interface UseActiveUsersOptions {
  userId?: string;
}

interface UseActiveUsersResult {
  activeUsers: ActiveUser[];
  isConnected: boolean;
  error: string | null;
}

export function useActiveUsers(options: UseActiveUsersOptions = {}): UseActiveUsersResult {
  const { userId } = options;
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const backendEnv = import.meta.env.VITE_APP_BACKEND_URL || "http://localhost:3000";
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
      console.log("[ActiveUsers] Socket connected:", socket.id);
      setIsConnected(true);
      setError(null);

      // Authenticate with user ID if provided
      if (userId) {
        socket.emit("authenticate", userId);
      }

      // Request active users list
      socket.emit("get_active_users");
    });

    socket.on("disconnect", () => {
      console.log("[ActiveUsers] Socket disconnected");
      setIsConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("[ActiveUsers] Socket connection error:", err);
      setError(err.message);
      setIsConnected(false);
    });

    // Listen for active users updates
    socket.on("active_users_update", (users: ActiveUser[]) => {
      console.log("[ActiveUsers] Active users update received:", users);
      setActiveUsers(users);
    });

    // Listen for initial active users list
    socket.on("active_users_list", (users: ActiveUser[]) => {
      console.log("[ActiveUsers] Active users list received:", users);
      setActiveUsers(users);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  // Re-authenticate when userId changes
  useEffect(() => {
    if (socketRef.current && userId && isConnected) {
      socketRef.current.emit("authenticate", userId);
      socketRef.current.emit("get_active_users");
    }
  }, [userId, isConnected]);

  return {
    activeUsers,
    isConnected,
    error,
  };
}
