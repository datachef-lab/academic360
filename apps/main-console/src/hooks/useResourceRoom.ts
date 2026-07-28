import { useEffect, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";

/**
 * Join a per-resource socket room and run `onChange` whenever another online
 * user mutates that resource (create/update/delete). The backend broadcasts a
 * `resource_changed` event to "resource:<resource>" via the resourceRealtime
 * middleware. `resource` is the API base path (e.g. "states", "admissions/boards").
 */
export function useResourceRoom(resource: string | undefined, onChange: () => void) {
  const { socket } = useSocket();
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!socket || !resource) return;
    const join = () => socket.emit("subscribe_resource", resource);
    join();
    socket.on("connect", join);
    const handler = (payload: { resource?: string }) => {
      if (payload?.resource === resource) cb.current();
    };
    socket.on("resource_changed", handler);
    return () => {
      socket.emit("unsubscribe_resource", resource);
      socket.off("connect", join);
      socket.off("resource_changed", handler);
    };
  }, [socket, resource]);
}
