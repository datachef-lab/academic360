import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type {
  AffiliationRegistrationPayload,
  FeeMisPayload,
  RealtimeTrackerFilters,
  RealtimeTrackerTab,
} from "../types/realtime-tracker-types";
import {
  canonicalRealtimeTrackerFilters,
  realtimeTrackerFiltersKey,
  realtimeTrackerFiltersMatch,
} from "../utils/filters-key";

type UseRealtimeTrackerSocketOptions = {
  userId?: string;
  tab: RealtimeTrackerTab;
  filters: RealtimeTrackerFilters;
  onAffiliationUpdate?: (data: AffiliationRegistrationPayload) => void;
  onFeeMisUpdate?: (data: FeeMisPayload) => void;
  onFeeMisRefresh?: () => void;
  onError?: (error: string) => void;
};

export function useRealtimeTrackerSocket({
  userId,
  tab,
  filters,
  onAffiliationUpdate,
  onFeeMisUpdate,
  onFeeMisRefresh,
  onError,
}: UseRealtimeTrackerSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const tabRef = useRef(tab);
  const filtersRef = useRef(filters);
  const filtersKeyRef = useRef(realtimeTrackerFiltersKey(filters));
  const prevSubscriptionRef = useRef<{
    tab: RealtimeTrackerTab;
    filtersKey: string;
    filters: RealtimeTrackerFilters;
  } | null>(null);

  const onAffiliationRef = useRef(onAffiliationUpdate);
  const onFeeMisRef = useRef(onFeeMisUpdate);
  const onFeeMisRefreshRef = useRef(onFeeMisRefresh);
  const onErrorRef = useRef(onError);

  tabRef.current = tab;
  const canonical = canonicalRealtimeTrackerFilters(filters);
  filtersRef.current = canonical;
  filtersKeyRef.current = realtimeTrackerFiltersKey(canonical);
  onAffiliationRef.current = onAffiliationUpdate;
  onFeeMisRef.current = onFeeMisUpdate;
  onFeeMisRefreshRef.current = onFeeMisRefresh;
  onErrorRef.current = onError;

  const subscribe = useCallback(() => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("subscribe_realtime_tracker", {
      tab: tabRef.current,
      filters: filtersRef.current,
    });
  }, []);

  const unsubscribe = useCallback((t: RealtimeTrackerTab, f: RealtimeTrackerFilters) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit("unsubscribe_realtime_tracker", {
      tab: t,
      filters: canonicalRealtimeTrackerFilters(f),
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

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

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("authenticate", userId);
      prevSubscriptionRef.current = {
        tab: tabRef.current,
        filtersKey: filtersKeyRef.current,
        filters: filtersRef.current,
      };
      subscribe();
    });

    socket.on("disconnect", () => setIsConnected(false));
    socket.on("connect_error", (err) => onErrorRef.current?.(err.message));

    socket.on("affiliation_registration_update", (payload: AffiliationRegistrationPayload) => {
      if (
        !realtimeTrackerFiltersMatch(
          payload?.filters,
          canonicalRealtimeTrackerFilters(filtersRef.current),
        )
      ) {
        return;
      }
      onAffiliationRef.current?.(payload);
    });

    socket.on("fee_mis_update", (payload: FeeMisPayload) => {
      if (!payload?.courseRows || !payload?.semesterRows) return;
      if (
        !realtimeTrackerFiltersMatch(
          payload?.filters,
          canonicalRealtimeTrackerFilters(filtersRef.current),
        )
      ) {
        return;
      }
      onFeeMisRef.current?.(payload);
    });

    socket.on("fee_mis_refresh", () => {
      onFeeMisRefreshRef.current?.();
    });

    return () => {
      const prev = prevSubscriptionRef.current;
      if (prev) unsubscribe(prev.tab, prev.filters);
      socket.disconnect();
      socketRef.current = null;
      prevSubscriptionRef.current = null;
      setIsConnected(false);
    };
  }, [userId, subscribe, unsubscribe]);

  const filtersKey = realtimeTrackerFiltersKey(canonicalRealtimeTrackerFilters(filters));

  useEffect(() => {
    if (!socketRef.current?.connected) return;
    const canonical = canonicalRealtimeTrackerFilters(filters);
    const prev = prevSubscriptionRef.current;
    if (prev && prev.filtersKey === filtersKey && prev.tab === tab) return;
    if (prev) unsubscribe(prev.tab, prev.filters);
    prevSubscriptionRef.current = { tab, filtersKey, filters: canonical };
    subscribe();
  }, [tab, filtersKey, filters, subscribe, unsubscribe]);

  return { isConnected };
}
