import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/features/auth/providers/auth-provider";

/**
 * One-liner for every documents-issuance page: joins the shared `documents`
 * room (and the optional per-batch / per-student room), listens for domain
 * events, and invalidates every React Query key that starts with a documents
 * prefix.
 *
 * Payloads are HINTS. The page decides what to refetch by owning its query
 * keys — nothing about the on-screen data comes off the wire, so we cannot
 * ship stale or wrong values through the socket.
 *
 * The Redis adapter (backend `app.ts:403`) delivers events across every
 * backend instance, so a batch update on one node reaches every dashboard
 * on every node.
 */
export function useDocumentsRealtime(opts?: {
  batchId?: number | null;
  studentId?: number | null;
  /** Query-key prefixes to invalidate on any documents event. */
  invalidatePrefixes?: string[];
  /**
   * Called on ANY documents domain event. Use for panels that fetch outside
   * React Query and cannot piggy-back on cache invalidation.
   */
  onAnyEvent?: () => void;
}): { isConnected: boolean; eventCounter: number } {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    batchId = null,
    studentId = null,
    invalidatePrefixes = [
      // Passbook + batch-receipt list query keys used across the pages.
      "student-ledger",
      "document-batch-receipts",
      "document-types",
    ],
    onAnyEvent,
  } = opts ?? {};

  const { socket, isConnected, emit } = useSocket({
    userId: user?.id ? String(user.id) : undefined,
  });

  const anyRef = useRef(onAnyEvent);
  anyRef.current = onAnyEvent;

  // Bumps on every incoming documents event — panels can use it to trigger
  // a "just updated" flash without subscribing to individual events.
  const [eventCounter, setEventCounter] = useState(0);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const subscribeArgs: { batchId?: number; studentId?: number } = {};
    if (batchId != null) subscribeArgs.batchId = batchId;
    if (studentId != null) subscribeArgs.studentId = studentId;

    emit("subscribe_documents", subscribeArgs);

    const invalidate = () => {
      queryClient.invalidateQueries({
        predicate: (q) => {
          const key = q.queryKey[0];
          if (typeof key !== "string") return false;
          return invalidatePrefixes.some((p) => key.startsWith(p));
        },
      });
      anyRef.current?.();
      setEventCounter((c) => c + 1);
    };

    const events = ["documents:batch-receipt:updated", "documents:ledger:updated"] as const;

    for (const ev of events) socket.on(ev, invalidate);

    return () => {
      for (const ev of events) socket.off(ev, invalidate);
      emit("unsubscribe_documents", subscribeArgs);
    };
    // invalidatePrefixes is treated as stable — passing a new array literal
    // on every render would resubscribe on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, batchId, studentId, emit, queryClient]);

  return { isConnected, eventCounter };
}
