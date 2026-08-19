import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { OnlineStudentDto } from "@/services/student";

export interface ActiveUser {
  id: number;
  name: string;
  image: string | null;
  type: "ADMIN" | "STAFF";
  tabActive?: boolean;
}

interface UseActiveUsersOptions {
  userId?: string;
  /** Fired with a student's full row data the moment they come online. */
  onStudentOnline?: (student: OnlineStudentDto) => void;
  /** Fired with a student's userId the moment they go fully offline. */
  onStudentOffline?: (userId: number) => void;
}

interface UseActiveUsersResult {
  activeUsers: ActiveUser[];
  studentsOnlineCount: number;
  isConnected: boolean;
  error: string | null;
}

export function useActiveUsers(options: UseActiveUsersOptions = {}): UseActiveUsersResult {
  const { userId, onStudentOnline, onStudentOffline } = options;
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [studentsOnlineCount, setStudentsOnlineCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Kept in refs (not effect deps) so passing new callback identities never
  // tears down/reconnects the socket.
  const onStudentOnlineRef = useRef(onStudentOnline);
  const onStudentOfflineRef = useRef(onStudentOffline);
  useEffect(() => {
    onStudentOnlineRef.current = onStudentOnline;
    onStudentOfflineRef.current = onStudentOffline;
  }, [onStudentOnline, onStudentOffline]);

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
      // websocket-only: prod runs multiple instances without sticky sessions —
      // the Redis adapter bridges rooms but NOT Engine.IO sessions, so a
      // long-polling handshake split across instances 400s ("Session ID
      // unknown") and churns presence. ALB passes websockets fine.
      transports: ["websocket"],
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

      // Send initial tab visibility state
      socket.emit("tab_visibility", { isActive: !document.hidden });
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

    socket.on("students_online_count", (count: number) => {
      setStudentsOnlineCount(Number(count) || 0);
    });

    // Push a student's full row data in the moment they come online / go
    // offline, so consumers (the online-students modal) can update their
    // list directly instead of refetching.
    socket.on("student_online_detail", (student: OnlineStudentDto) => {
      onStudentOnlineRef.current?.(student);
    });

    socket.on("student_offline_detail", (payload: { userId: number }) => {
      if (payload && typeof payload.userId === "number") {
        onStudentOfflineRef.current?.(payload.userId);
      }
    });

    // Tab visibility tracking (blur inactive tabs)
    const handleVisibilityChange = () => {
      try {
        socket.emit("tab_visibility", { isActive: !document.hidden });
      } catch {
        // ignore
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
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
    studentsOnlineCount,
    isConnected,
    error,
  };
}
