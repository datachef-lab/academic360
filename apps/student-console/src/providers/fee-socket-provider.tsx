"use client";

import { useAuth } from "@/hooks/use-auth";
import { useStudent } from "@/providers/student-provider";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface FeeSocketContextType {
  feeMappingsVersion: number;
  cpFormVersion: number;
  academicActivityVersion: number;
  invalidateFeeMappings: () => void;
  invalidateCpForm: () => void;
  invalidateAcademicActivity: () => void;
}

const FeeSocketContext = createContext<FeeSocketContextType>({
  feeMappingsVersion: 0,
  cpFormVersion: 0,
  academicActivityVersion: 0,
  invalidateFeeMappings: () => {},
  invalidateCpForm: () => {},
  invalidateAcademicActivity: () => {},
});

export const useFeeSocket = () => useContext(FeeSocketContext);

export function FeeSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { student } = useStudent();
  const socketRef = useRef<any>(null);
  const [feeMappingsVersion, setFeeMappingsVersion] = useState(0);
  const [cpFormVersion, setCpFormVersion] = useState(0);
  const [academicActivityVersion, setAcademicActivityVersion] = useState(0);

  const invalidateFeeMappings = useCallback(() => setFeeMappingsVersion((v) => v + 1), []);

  const invalidateCpForm = useCallback(() => setCpFormVersion((v) => v + 1), []);

  const invalidateAcademicActivity = useCallback(
    () => setAcademicActivityVersion((v) => v + 1),
    [],
  );

  useEffect(() => {
    if (!student?.id || !user?.id || typeof window === "undefined") return;
    if (socketRef.current?.connected) return;

    let active = true;
    const loadSocket = async () => {
      try {
        // @ts-ignore - typed import is flaky in this app
        const socketModule = await import("socket.io-client");
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          "http://localhost:3000";
        const parsed = new URL(apiUrl);
        const origin = `${parsed.protocol}//${parsed.host}`;
        const pathPrefix = parsed.pathname.replace(/\/$/, "");
        const socketPath = pathPrefix ? `${pathPrefix}/socket.io` : "/socket.io";

        // @ts-ignore - runtime socket is valid
        const socket: any = socketModule.io(origin, {
          path: socketPath,
          withCredentials: true,
          transports: ["polling", "websocket"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          timeout: 20000,
        } as any);
        if (!active) {
          socket.disconnect();
          return;
        }
        socketRef.current = socket;

        socket.on("connect", () => {
          socket.emit("authenticate", String(user.id));
        });

        socket.on("fee_student_mapping_updated", () => {
          invalidateFeeMappings();
        });

        socket.on("academic_activity_student_console_updated", () => {
          invalidateAcademicActivity();
        });
      } catch (err) {
        console.error("[FeeSocketProvider] socket setup failed", err);
      }
    };
    loadSocket();

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [student?.id, user?.id, invalidateFeeMappings, invalidateAcademicActivity]);

  const value = useMemo(
    () => ({
      feeMappingsVersion,
      cpFormVersion,
      academicActivityVersion,
      invalidateFeeMappings,
      invalidateCpForm,
      invalidateAcademicActivity,
    }),
    [
      feeMappingsVersion,
      cpFormVersion,
      academicActivityVersion,
      invalidateFeeMappings,
      invalidateCpForm,
      invalidateAcademicActivity,
    ],
  );

  return <FeeSocketContext.Provider value={value}>{children}</FeeSocketContext.Provider>;
}
