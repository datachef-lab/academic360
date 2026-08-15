import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/features/auth/providers/auth-provider";

/**
 * Live wiring for the exam dashboard — same recipe as `useLibraryRealtime`:
 * join the `exam_dashboard` room, listen for domain events, and invalidate
 * every React Query key that starts with `exam-dashboard`.
 *
 * Two event sources cover every write path:
 *  - `exam:dashboard:updated` — fired by the exam broadcast middleware on any
 *    successful non-GET under /api/exams|/api/exam-groups|/api/admit-card
 *    (plus a manual emit for the single admit-card download, a GET that
 *    mutates tracking).
 *  - the legacy global emits (`exam_created` … `exam_group_deleted`) that the
 *    schedule/allot services already fire.
 *
 * Payloads are HINTS — the page owns its query keys and refetches from the
 * authoritative stats endpoint, so no stale data can arrive over the socket.
 * The Redis adapter delivers events across every EC2 instance.
 */
export function useExamDashboardRealtime(): { isConnected: boolean; eventCounter: number } {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { socket, isConnected, emit } = useSocket({
    userId: user?.id ? String(user.id) : undefined,
  });

  // Bumps on every incoming exam event — the page keys its tab body off this
  // to restart the live-flash animation on refreshed widgets.
  const [eventCounter, setEventCounter] = useState(0);

  useEffect(() => {
    if (!socket || !isConnected) return;

    emit("subscribe_exam_dashboard");

    const invalidate = () => {
      queryClient.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0];
          return typeof key === "string" && key.startsWith("exam-dashboard");
        },
      });
      setEventCounter((c) => c + 1);
    };

    const events = [
      "exam:dashboard:updated",
      "exam_created",
      "exam_updated",
      "exam_deleted",
      "exam_group_deleted",
    ] as const;

    for (const ev of events) socket.on(ev, invalidate);

    return () => {
      for (const ev of events) socket.off(ev, invalidate);
      emit("unsubscribe_exam_dashboard");
    };
  }, [socket, isConnected, emit, queryClient]);

  return { isConnected, eventCounter };
}
