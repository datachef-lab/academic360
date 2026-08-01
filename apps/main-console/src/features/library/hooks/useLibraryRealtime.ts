import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/features/auth/providers/auth-provider";

/**
 * One-liner for every library page: joins the shared `library` room (and the
 * optional per-book / per-user room), listens for domain events, and invalidates
 * every React Query key that starts with a library prefix.
 *
 * Payloads are HINTS. The page decides what to refetch by owning its query keys
 * — nothing about the on-screen data comes off the wire, so we cannot ship
 * stale or wrong values through the socket.
 *
 * The Redis adapter ([app.ts:400]) delivers events across every EC2 instance,
 * so an issue recorded on one node reaches every dashboard on every node.
 */
export function useLibraryRealtime(opts?: {
  bookId?: number | null;
  userId?: number | null;
  /** Query-key prefixes to invalidate on any library event. */
  invalidatePrefixes?: string[];
  /** Optional listener for the loader progress event (dashboard boot banner). */
  onLoadProgress?: (payload: {
    table: string;
    loaded: number;
    failed: number;
    total: number;
    done?: boolean;
  }) => void;
  /**
   * Called on ANY library domain event (circulation, copy, book, entry-exit,
   * fine, master, loader progress). Use for panels that fetch outside React
   * Query and cannot piggy-back on the cache invalidation.
   */
  onAnyEvent?: () => void;
}): { isConnected: boolean; eventCounter: number } {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    bookId = null,
    userId = null,
    invalidatePrefixes = ["library-", "library:"],
    onLoadProgress,
    onAnyEvent,
  } = opts ?? {};

  const { socket, isConnected, emit } = useSocket({
    userId: user?.id ? String(user.id) : undefined,
  });

  const progressRef = useRef(onLoadProgress);
  progressRef.current = onLoadProgress;
  const anyRef = useRef(onAnyEvent);
  anyRef.current = onAnyEvent;

  // Bumps on every incoming library event — panels use it to trigger a
  // "just updated" flash without having to subscribe to individual events.
  const [eventCounter, setEventCounter] = useState(0);

  useEffect(() => {
    if (!socket || !isConnected) return;

    emit("subscribe_library", { bookId, userId });

    // One handler covers every domain event — the page decides what to refetch
    // via its query-key prefixes, and panels that fetch outside React Query
    // can piggy-back through onAnyEvent.
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

    const events = [
      "library:circulation:updated",
      "library:copy:updated",
      "library:book:updated",
      "library:entry-exit:updated",
      "library:fine:updated",
      "library:master:updated",
    ] as const;

    for (const ev of events) socket.on(ev, invalidate);

    const onProgress = (payload: {
      table: string;
      loaded: number;
      failed: number;
      total: number;
      done?: boolean;
    }) => {
      progressRef.current?.(payload);
      // A loader event also means fresh data — refetch.
      invalidate();
    };
    socket.on("library:load:progress", onProgress);

    return () => {
      for (const ev of events) socket.off(ev, invalidate);
      socket.off("library:load:progress", onProgress);
      emit("unsubscribe_library", { bookId, userId });
    };
    // invalidatePrefixes is treated as stable — passing a new array literal on
    // every render would resubscribe on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, isConnected, bookId, userId, emit, queryClient]);

  return { isConnected, eventCounter };
}
