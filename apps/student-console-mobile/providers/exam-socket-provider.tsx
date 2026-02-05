"use client";

import { useAuth } from "@/providers/auth-provider";
import type { Socket } from "socket.io-client";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// Lazy import API_BASE_URL to avoid top-level evaluation issues
const getApiBaseUrl = () => {
  try {
    // Dynamic import to avoid issues if API_BASE_URL fails to resolve
    const apiModule = require("@/lib/api");
    return apiModule.API_BASE_URL || "http://localhost:8080";
  } catch (e) {
    console.error("[ExamSocket] Failed to get API_BASE_URL:", e);
    return "http://localhost:8080";
  }
};

type ExamSocketRefreshCallback = () => void;

interface ExamSocketContextValue {
  isConnected: boolean;
  subscribe: (callback: ExamSocketRefreshCallback) => () => void;
}

const ExamSocketContext = createContext<ExamSocketContextValue | null>(null);

export function useExamSocket() {
  const ctx = useContext(ExamSocketContext);
  if (!ctx) return null;
  return ctx;
}

/**
 * Subscribe to exam real-time updates. When exam_created or exam_updated is received,
 * the provided refetch callback will be invoked.
 * Returns an unsubscribe function.
 */
export function useExamSocketRefresh(refetch: ExamSocketRefreshCallback) {
  const ctx = useExamSocket();
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!ctx) return;
    return ctx.subscribe(() => {
      refetchRef.current?.();
    });
  }, [ctx]);
}

export function ExamSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef<Set<ExamSocketRefreshCallback>>(new Set());

  const subscribe = useCallback((callback: ExamSocketRefreshCallback) => {
    callbacksRef.current.add(callback);
    return () => {
      callbacksRef.current.delete(callback);
    };
  }, []);

  const notifySubscribers = useCallback(() => {
    callbacksRef.current.forEach((cb) => {
      try {
        cb();
      } catch (e) {
        console.error("[ExamSocket] Subscriber callback error:", e);
      }
    });
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    let mounted = true;

    const loadSocket = async () => {
      try {
        const socketModule = await import("socket.io-client");
        const API_BASE_URL = getApiBaseUrl();
        let parsed: URL;
        try {
          parsed = new URL(API_BASE_URL);
        } catch (urlError) {
          console.error("[ExamSocket] Invalid API URL:", API_BASE_URL, urlError);
          return;
        }

        const origin = `${parsed.protocol}//${parsed.host}`;
        const pathPrefix = parsed.pathname.replace(/\/$/, "");
        const socketPath = pathPrefix ? `${pathPrefix}/socket.io` : "/socket.io";

        const socket = socketModule.io(origin, {
          path: socketPath,
          withCredentials: true,
          transports: ["polling", "websocket"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          timeout: 20000,
        });

        if (!mounted) {
          socket.disconnect();
          return;
        }

        socketRef.current = socket;

        socket.on("connect", () => {
          if (!mounted) return;
          setIsConnected(true);
          socket.emit("authenticate", user.id.toString());
        });

        socket.on("disconnect", () => {
          if (mounted) setIsConnected(false);
        });

        socket.on("connect_error", (err: Error) => {
          console.error("[ExamSocket] Connection error:", err);
        });

        socket.on("exam_created", () => {
          if (mounted) notifySubscribers();
        });

        socket.on("exam_updated", () => {
          if (mounted) notifySubscribers();
        });
      } catch (err) {
        console.error("[ExamSocket] Failed to load socket:", err);
      }
    };

    loadSocket();

    return () => {
      mounted = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user?.id, notifySubscribers]);

  const value: ExamSocketContextValue = {
    isConnected,
    subscribe,
  };

  return <ExamSocketContext.Provider value={value}>{children}</ExamSocketContext.Provider>;
}
