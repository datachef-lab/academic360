import type { Request, Response, NextFunction } from "express";
import { bumpSnapshotEpoch } from "@/services/snapshot-cache.js";
import { emitLibraryEvent } from "@/features/library/services/library-realtime.service.js";
import { createLogger } from "@/config/logger.js";

const log = createLogger("library-broadcast");

/**
 * Fire `library:master:updated` on every successful non-GET request under
 * `/api/library/*`. Rather than instrumenting each of the ~30 master
 * services with its own emit, this one middleware covers all of them:
 * whenever a POST / PUT / PATCH / DELETE succeeds against a library endpoint,
 * every dashboard on every EC2 instance refetches through the Redis-adapter
 * pub/sub.
 *
 * Only the "final response" is emitted on — the middleware hooks
 * `res.on("finish")` so we fire once per response, not on partial writes.
 * Failed requests (status >= 400) are skipped: no state changed.
 */
export function libraryBroadcastMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    next();
    return;
  }

  res.on("finish", () => {
    if (res.statusCode < 200 || res.statusCode >= 400) return;
    // The path segment after `/api/library/` is a rough resource hint the
    // client can use for finer refetches; the dashboard's default handler
    // just invalidates every `library-*` React Query key.
    const resource = req.path.replace(/^\/+/, "").split("/")[0] ?? "unknown";
    // Invalidate the cached dashboard snapshot BEFORE the socket event lands
    // on clients — their refetch must recompute, never replay pre-write stats.
    bumpSnapshotEpoch("library:dashboard");
    emitLibraryEvent("library:master:updated", {
      detail: { resource, method },
    });
    // Visible so we can prove writes reach the middleware — the previous
    // hunt for missing updates ended at "no writes today" and there was no
    // way to distinguish "not fired" from "fired but no socket".
    log.info(
      `emit library:master:updated { resource: ${resource}, method: ${method}, status: ${res.statusCode} }`,
    );
  });

  next();
}
