import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/features/auth/providers/auth-provider";

/**
 * One-liner for the ID-card dashboard: joins the shared `idcard` room, listens
 * for domain events, and invalidates every React Query key starting with an
 * id-card prefix so the page refetches from the authoritative endpoint.
 *
 * Payloads are HINTS — nothing on-screen comes off the wire, so a stale or wrong
 * number can never travel over the socket. The Redis adapter delivers events
 * across every EC2 instance, so a card issued on one node refreshes every
 * dashboard on every node.
 */
export function useIdCardRealtime(opts?: { invalidatePrefixes?: string[] }): {
  isConnected: boolean;
  eventCounter: number;
} {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { invalidatePrefixes = ["idcard-"] } = opts ?? {};

  const { socket, isConnected, emit } = useSocket({
    userId: user?.id ? String(user.id) : undefined,
  });

  const [eventCounter, setEventCounter] = useState(0);

  useEffect(() => {
    if (!socket || !isConnected) return;

    emit("subscribe_idcard");

    const invalidate = () => {
      queryClient.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0];
          if (typeof key !== "string") return false;
          return invalidatePrefixes.some((p) => key.startsWith(p));
        },
      });
      setEventCounter((c) => c + 1);
    };

    const events = [
      "idcard:issue:updated",
      "idcard:template:updated",
      "idcard:master:updated",
    ] as const;
    for (const ev of events) socket.on(ev, invalidate);

    return () => {
      for (const ev of events) socket.off(ev, invalidate);
      emit("unsubscribe_idcard");
    };
    // invalidatePrefixes is treated as stable (default literal) — see library hook.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, emit, queryClient]);

  return { isConnected, eventCounter };
}
